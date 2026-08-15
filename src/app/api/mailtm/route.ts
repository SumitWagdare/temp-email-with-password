import { NextRequest, NextResponse } from 'next/server';

const MAILTM_BASE = process.env.NEXT_PUBLIC_MAILTM_API_URL || 'https://api.mail.tm';

async function handleProxy(req: NextRequest) {
  const endpoint = req.nextUrl.searchParams.get('endpoint') || '';
  const targetUrl = `${MAILTM_BASE}${endpoint}`;

  const headers = new Headers();
  const authHeader = req.headers.get('authorization');
  if (authHeader) headers.set('authorization', authHeader);
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', 'application/json');

  let body: any = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.text();
    } catch {
      body = null;
    }
  }

  try {
    const res = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    const responseData = await res.text();

    return new NextResponse(responseData, {
      status: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/json',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to proxy request to mail.tm', message: err.message },
      { status: 502 }
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
