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
 * POST /api/generate
 *
 * Creates a new disposable email account and generates a secure password.
 * Returns the email address, password, JWT token, and account ID.
 *
 * Request body (optional):
 *   { "username": "custom_prefix" }   — defaults to random nt_xxxxx
 *
 * Response:
 *   {
 *     "email": "nt_abc1234@emalupe.com",
 *     "password": "NoTrace_k8f2m9x1!",
 *     "token": "eyJhbG...",
 *     "accountId": "...",
 *     "provider": "mail.tm",
 *     "createdAt": "2026-08-20T..."
 *   }
 */
export async function POST(req: NextRequest) {
  try {
    // Parse optional username from body
    let username = `nt_${Math.random().toString(36).substring(2, 9)}`;
    try {
      const body = await req.json();
      if (body.username && typeof body.username === 'string') {
        username = body.username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      }
    } catch {
      // No body or invalid JSON — use default username
    }

    // 1. Fetch available domains
    const domainsRes = await fetchWithTimeout(`${MAILTM_BASE}/domains`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!domainsRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch domains', status: domainsRes.status },
        { status: 502 }
      );
    }

    const domainsData = await domainsRes.json();
    const members = domainsData['hydra:member'] || domainsData.member || domainsData;
    const domains = Array.isArray(members)
      ? members.filter((d: any) => d.isActive !== false).map((d: any) => d.domain)
      : ['emalupe.com'];
    const domain = domains[0] || 'emalupe.com';

    // 2. Generate password (strong, with uppercase + symbol for form validation)
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    const pwLength = 16;
    let pw = '';
    for (let i = 0; i < pwLength; i++) {
      pw += charset[Math.floor(Math.random() * charset.length)];
    }
    // Guarantee uppercase + lowercase + digit + symbol
    const guaranteeChars = [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)],
      'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)],
      '0123456789'[Math.floor(Math.random() * 10)],
      '!@#$%&*'['!@#$%&*'.length * Math.random() | 0],
    ];
    const pwArr = pw.split('');
    guaranteeChars.forEach((c, i) => { pwArr[i] = c; });
    // Shuffle
    for (let i = pwArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwArr[i], pwArr[j]] = [pwArr[j], pwArr[i]];
    }
    const password = pwArr.join('');
    const address = `${username}@${domain}`;

    // 3. Create account on mail.tm
    const createRes = await fetchWithTimeout(`${MAILTM_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!createRes.ok && createRes.status !== 422) {
      const errText = await createRes.text();
      return NextResponse.json(
        { error: 'Account creation failed', detail: errText, status: createRes.status },
        { status: 502 }
      );
    }

    const createData = createRes.ok ? await createRes.json() : null;
    const accountId = createData?.id || address;

    // 4. Get JWT token
    const tokenRes = await fetchWithTimeout(`${MAILTM_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ address, password }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return NextResponse.json(
        { error: 'Token generation failed', detail: errText, status: tokenRes.status },
        { status: 502 }
      );
    }

    const tokenData = await tokenRes.json();

    return NextResponse.json({
      email: address,
      password,
      token: tokenData.token,
      accountId,
      provider: 'mail.tm',
      domain,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'generate_failed', message: err.message || String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate — returns docs for this endpoint
 */
export async function GET() {
  return NextResponse.json({
    usage: 'POST /api/generate',
    description: 'Creates a disposable email account and returns credentials + JWT token.',
    body: '{ "username": "optional_prefix" }',
    response: '{ email, password, token, accountId, provider, domain, createdAt }',
  });
}
