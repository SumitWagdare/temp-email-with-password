import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime (not Edge) — prevents ambiguity on Vercel
export const runtime = 'nodejs';

// Allow up to 30s for the function (Vercel hobby default is 10s, pro is 60s)
export const maxDuration = 30;

const MAILTM_BASE =
  process.env.NEXT_PUBLIC_MAILTM_API_URL || 'https://api.mail.tm';

const UPSTREAM_TIMEOUT_MS = 12_000; // 12 seconds

/**
 * Wraps a fetch call with an AbortController timeout.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Central proxy handler — wraps EVERYTHING in try/catch so
 * Vercel never sees an uncaught exception (which would produce
 * the silent 500 with empty body).
 */
async function handleProxy(req: NextRequest): Promise<NextResponse> {
  try {
    const endpoint = req.nextUrl.searchParams.get('endpoint') || '';
    const targetUrl = `${MAILTM_BASE}${endpoint}`;

    console.log(`[mailtm-proxy] ${req.method} ${targetUrl}`);

    // --- Build upstream headers ---
    const upstreamHeaders: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 NoTrace/1.0',
    };

    const authHeader = req.headers.get('authorization');
    if (authHeader) upstreamHeaders['Authorization'] = authHeader;

    const contentType = req.headers.get('content-type');
    if (contentType) upstreamHeaders['Content-Type'] = contentType;

    // --- Read body for non-GET/HEAD ---
    let body: string | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        body = await req.text();
      } catch {
        body = undefined;
      }
    }

    // --- Proxy the request with fallback to mail.gw if primary fails ---
    let upstreamRes: Response | null = null;
    const upstreamBases = [
      MAILTM_BASE,
      'https://api.mail.gw',
    ].filter((v, i, a) => a.indexOf(v) === i);

    let lastError: any = null;

    for (const base of upstreamBases) {
      const currentUrl = `${base}${endpoint}`;
      try {
        const res = await fetchWithTimeout(
          currentUrl,
          {
            method: req.method,
            headers: upstreamHeaders,
            body: body || undefined,
          },
          UPSTREAM_TIMEOUT_MS
        );

        if (res.status >= 500 && base !== upstreamBases[upstreamBases.length - 1]) {
          console.warn(`[mailtm-proxy] Upstream ${base} returned ${res.status}, trying fallback...`);
          continue;
        }

        upstreamRes = res;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[mailtm-proxy] Upstream fetch to ${base} failed:`, err.message);
      }
    }

    if (!upstreamRes) {
      const message =
        lastError?.name === 'AbortError'
          ? `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms`
          : `Upstream fetch failed: ${lastError?.message || String(lastError)}`;

      console.error(`[mailtm-proxy] All upstreams failed:`, message);

      return NextResponse.json(
        { error: 'upstream_fetch_failed', message },
        { status: 502 }
      );
    }

    // --- Read the upstream response body ---
    let responseData: string;
    try {
      responseData = await upstreamRes.text();
    } catch (readErr: any) {
      console.error(
        `[mailtm-proxy] Failed to read upstream response body:`,
        readErr.message
      );
      return NextResponse.json(
        {
          error: 'upstream_response_read_failed',
          message: `Failed to read response body: ${readErr.message}`,
        },
        { status: 502 }
      );
    }

    console.log(
      `[mailtm-proxy] Upstream responded ${upstreamRes.status} (${responseData.length} bytes)`
    );

    // --- Return the proxied response ---
    const responseHeaders: Record<string, string> = {
      'Content-Type':
        upstreamRes.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    return new NextResponse(responseData, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    // Absolute last-resort catch — should never reach here, but if it does,
    // we return a proper JSON response instead of letting Vercel crash silently.
    console.error(`[mailtm-proxy] Unhandled error in proxy handler:`, err);

    return NextResponse.json(
      {
        error: 'proxy_internal_error',
        message: err.message || String(err),
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleProxy(req);
}

export async function POST(req: NextRequest) {
  return handleProxy(req);
}

export async function DELETE(req: NextRequest) {
  return handleProxy(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
