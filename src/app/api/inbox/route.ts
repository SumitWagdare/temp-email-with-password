import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAILTM_BASE = process.env.NEXT_PUBLIC_MAILTM_API_URL || 'https://api.mail.tm';
const TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET /api/inbox?token=<jwt_token>
 *
 * Fetches all messages for the authenticated account.
 * The token is the JWT returned from POST /api/generate.
 *
 * Response:
 *   {
 *     "messages": [
 *       {
 *         "id": "...",
 *         "from": { "name": "...", "address": "..." },
 *         "subject": "...",
 *         "intro": "...",
 *         "seen": false,
 *         "createdAt": "...",
 *         "hasAttachments": false
 *       }
 *     ],
 *     "count": 1
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing required query parameter: token (JWT from /api/generate)' },
        { status: 400 }
      );
    }

    // Fetch messages from mail.tm
    const res = await fetchWithTimeout(`${MAILTM_BASE}/messages`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'Failed to fetch inbox', detail: errText, status: res.status },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    const data = await res.json();
    const members = data['hydra:member'] || data.member || data;

    if (!Array.isArray(members)) {
      return NextResponse.json({ messages: [], count: 0 });
    }

    const messages = members.map((m: any) => ({
      id: m.id,
      from: {
        name: m.from?.name || m.from?.address || 'Unknown',
        address: m.from?.address || '',
      },
      to: Array.isArray(m.to)
        ? m.to.map((t: any) => ({ name: t.name, address: t.address }))
        : [],
      subject: m.subject || '(No Subject)',
      intro: m.intro || '',
      seen: Boolean(m.seen),
      createdAt: m.createdAt || new Date().toISOString(),
      hasAttachments: Boolean(m.hasAttachments),
    }));

    return NextResponse.json({ messages, count: messages.length });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'inbox_fetch_failed', message: err.message || String(err) },
      { status: 500 }
    );
  }
}
