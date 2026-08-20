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
 * GET /api/message?token=<jwt>&id=<message_id>
 *
 * Fetches full message detail including HTML body and text body.
 * Used to extract verification links from email content.
 *
 * Response:
 *   {
 *     "id": "...",
 *     "from": { "name": "...", "address": "..." },
 *     "subject": "...",
 *     "text": "plain text body...",
 *     "html": ["<html>...</html>"],
 *     "links": ["https://example.com/verify?token=..."],
 *     "createdAt": "..."
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    const messageId = req.nextUrl.searchParams.get('id');

    if (!token || !messageId) {
      return NextResponse.json(
        { error: 'Missing required query parameters: token and id' },
        { status: 400 }
      );
    }

    const res = await fetchWithTimeout(`${MAILTM_BASE}/messages/${messageId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: 'Failed to fetch message', detail: errText, status: res.status },
        { status: res.status === 401 ? 401 : 502 }
      );
    }

    const m = await res.json();

    // Extract all http(s) links from both HTML and text body
    const allText = [
      m.text || '',
      ...(Array.isArray(m.html) ? m.html : m.html ? [m.html] : []),
    ].join(' ');

    const linkRegex = /https?:\/\/[^\s"'<>\])}]+/gi;
    const rawLinks = allText.match(linkRegex) || [];
    // Deduplicate and clean trailing punctuation
    const links = [...new Set(rawLinks.map((l: string) => l.replace(/[.,;:!?)}\]]+$/, '')))];

    return NextResponse.json({
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
      text: m.text || '',
      html: Array.isArray(m.html) ? m.html : m.html ? [m.html] : [],
      links,
      seen: Boolean(m.seen),
      createdAt: m.createdAt || new Date().toISOString(),
      hasAttachments: Boolean(m.hasAttachments),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'message_fetch_failed', message: err.message || String(err) },
      { status: 500 }
    );
  }
}
