import {
  EmailProvider,
  InboxAccount,
  EmailMessage,
  EmailDetail,
  EmailAttachment,
} from './types';

const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

function getUrl(path: string): string {
  if (typeof window !== 'undefined') {
    return `/api/mailtm?endpoint=${encodeURIComponent(path)}`;
  }
  const base = process.env.NEXT_PUBLIC_MAILTM_API_URL || 'https://api.mail.tm';
  return `${base}${path}`;
}

/**
 * Fetch wrapper with AbortController timeout.
 */
async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class MailTmProvider implements EmailProvider {
  name = 'mail.tm';

  async getDomains(): Promise<string[]> {
    const url = getUrl('/domains');
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Mail.tm getDomains error (${res.status}): ${res.statusText}`);
    }
    const data = await res.json();
    const members = data['hydra:member'] || data.member || data;
    if (Array.isArray(members)) {
      return members
        .filter((d: any) => d.isOptionDisabled !== true)
        .map((d: any) => d.domain);
    }
    return ['mail.tm'];
  }

  async createAccount(
    username: string,
    domain: string,
    password?: string
  ): Promise<InboxAccount> {
    const pwd = password || `NoTrace_${Math.random().toString(36).slice(2, 10)}!`;
    const address = `${username.toLowerCase()}@${domain}`;

    console.log(`[MailTmProvider] Creating account for ${address}...`);

    // 1. Create account
    const createRes = await fetchWithTimeout(getUrl('/accounts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ address, password: pwd }),
    });

    if (!createRes.ok && createRes.status !== 422) {
      const errText = await createRes.text();
      console.error(`[MailTmProvider] createAccount failed (${createRes.status}):`, errText);
      throw new Error(`Mail.tm createAccount failed (${createRes.status}): ${errText}`);
    }

    const createData = createRes.ok ? await createRes.json() : null;
    const accountId = createData?.id || address;

    // 2. Get JWT Token
    const tokenRes = await fetchWithTimeout(getUrl('/token'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ address, password: pwd }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error(`[MailTmProvider] Token request failed (${tokenRes.status}):`, errText);
      throw new Error(`Mail.tm token generation failed (${tokenRes.status}): ${tokenRes.statusText}`);
    }

    const tokenData = await tokenRes.json();
    console.log(`[MailTmProvider] JWT Token retrieved for ${address}.`);

    return {
      id: accountId,
      address,
      token: tokenData.token,
      password: pwd,
      providerName: this.name,
      createdAt: new Date().toISOString(),
    };
  }

  async getMessages(account: InboxAccount): Promise<EmailMessage[]> {
    if (!account.token) {
      throw new Error('Mail.tm requires JWT token to fetch messages');
    }

    const res = await fetchWithTimeout(getUrl('/messages'), {
      headers: {
        Authorization: `Bearer ${account.token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mail.tm getMessages failed (${res.status}): ${res.statusText}`);
    }

    const data = await res.json();
    const members = data['hydra:member'] || data.member || data;

    if (!Array.isArray(members)) return [];

    return members.map((m: any) => ({
      id: m.id,
      accountId: account.id,
      msgid: m.msgid,
      from: {
        name: m.from?.name || m.from?.address || 'Unknown Sender',
        address: m.from?.address || '',
      },
      to: Array.isArray(m.to)
        ? m.to.map((t: any) => ({ name: t.name || t.address, address: t.address }))
        : [{ address: account.address }],
      subject: m.subject || '(No Subject)',
      intro: m.intro || '',
      seen: Boolean(m.seen),
      createdAt: m.createdAt || new Date().toISOString(),
      hasAttachments: Boolean(m.hasAttachments),
    }));
  }

  async getMessageDetail(account: InboxAccount, messageId: string): Promise<EmailDetail> {
    if (!account.token) {
      throw new Error('Mail.tm requires JWT token for message detail');
    }

    const res = await fetchWithTimeout(getUrl(`/messages/${messageId}`), {
      headers: {
        Authorization: `Bearer ${account.token}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Mail.tm getMessageDetail failed (${res.status}): ${res.statusText}`);
    }

    const m = await res.json();

    const attachments: EmailAttachment[] = Array.isArray(m.attachments)
      ? m.attachments.map((att: any) => ({
          id: att.id || att.filename,
          filename: att.filename || 'attachment',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          downloadUrl: getUrl(att.downloadUrl),
        }))
      : [];

    return {
      id: m.id,
      accountId: account.id,
      msgid: m.msgid,
      from: {
        name: m.from?.name || m.from?.address || 'Unknown Sender',
        address: m.from?.address || '',
      },
      to: Array.isArray(m.to)
        ? m.to.map((t: any) => ({ name: t.name || t.address, address: t.address }))
        : [{ address: account.address }],
      subject: m.subject || '(No Subject)',
      intro: m.intro || '',
      seen: Boolean(m.seen),
      createdAt: m.createdAt || new Date().toISOString(),
      hasAttachments: Boolean(m.hasAttachments),
      html: Array.isArray(m.html) ? m.html : m.html ? [m.html] : [],
      text: m.text || '',
      attachments,
    };
  }

  async getAttachment(account: InboxAccount, messageId: string, attachmentId: string): Promise<string> {
    if (!account.token) {
      throw new Error('Mail.tm requires JWT token to fetch attachment');
    }
    return getUrl(`/messages/${messageId}/attachments/${attachmentId}`);
  }

  async updatePassword(): Promise<boolean> {
    throw new Error('In-place password rotation is not supported by mail.tm');
  }

  async deleteAccount(account: InboxAccount): Promise<boolean> {
    if (!account.token || !account.id) return true;

    try {
      const res = await fetchWithTimeout(getUrl(`/accounts/${account.id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${account.token}`,
        },
      });
      return res.ok || res.status === 404;
    } catch {
      return false;
    }
  }
}
