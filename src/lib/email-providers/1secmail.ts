import {
  EmailProvider,
  InboxAccount,
  EmailMessage,
  EmailDetail,
  EmailAttachment,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_1SECMAIL_API_URL || 'https://www.1secmail.com/api/v1/';

export class OneSecMailProvider implements EmailProvider {
  name = '1secmail';

  async getDomains(): Promise<string[]> {
    try {
      const res = await fetch(`${BASE_URL}?action=getDomainList`);
      if (!res.ok) {
        throw new Error(`1secmail getDomains error (${res.status}): ${res.statusText}`);
      }
      const domains = await res.json();
      return Array.isArray(domains) ? domains : ['1secmail.com'];
    } catch (err: any) {
      throw new Error(`1secmail getDomains failed: ${err.message}`);
    }
  }

  async createAccount(username: string, domain: string): Promise<InboxAccount> {
    const address = `${username.toLowerCase()}@${domain}`;
    return {
      id: username,
      address,
      token: null,
      providerName: this.name,
      createdAt: new Date().toISOString(),
    };
  }

  async getMessages(account: InboxAccount): Promise<EmailMessage[]> {
    const [login, domain] = account.address.split('@');
    try {
      const res = await fetch(
        `${BASE_URL}?action=getMessages&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}`
      );

      if (!res.ok) {
        throw new Error(`1secmail getMessages failed (${res.status}): ${res.statusText}`);
      }

      const messages = await res.json();
      if (!Array.isArray(messages)) return [];

      return messages.map((m: any) => ({
        id: String(m.id),
        accountId: account.id,
        from: {
          name: m.from || 'Unknown Sender',
          address: m.from || '',
        },
        to: [{ address: account.address }],
        subject: m.subject || '(No Subject)',
        intro: '',
        seen: false,
        createdAt: m.date || new Date().toISOString(),
        hasAttachments: false,
      }));
    } catch (err: any) {
      throw new Error(`1secmail getMessages error: ${err.message}`);
    }
  }

  async getMessageDetail(account: InboxAccount, messageId: string): Promise<EmailDetail> {
    const [login, domain] = account.address.split('@');
    try {
      const res = await fetch(
        `${BASE_URL}?action=readMessage&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${messageId}`
      );

      if (!res.ok) {
        throw new Error(`1secmail readMessage failed (${res.status}): ${res.statusText}`);
      }

      const m = await res.json();

      const attachments: EmailAttachment[] = Array.isArray(m.attachments)
        ? m.attachments.map((att: any) => ({
            id: att.filename,
            filename: att.filename,
            contentType: att.contentType || 'application/octet-stream',
            size: att.size || 0,
            downloadUrl: `${BASE_URL}?action=download&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${messageId}&file=${encodeURIComponent(att.filename)}`,
          }))
        : [];

      return {
        id: String(m.id),
        accountId: account.id,
        from: {
          name: m.from || 'Unknown Sender',
          address: m.from || '',
        },
        to: [{ address: account.address }],
        subject: m.subject || '(No Subject)',
        intro: '',
        seen: true,
        createdAt: m.date || new Date().toISOString(),
        hasAttachments: attachments.length > 0,
        html: m.htmlBody ? [m.htmlBody] : m.body ? [m.body] : [],
        text: m.textBody || m.body || '',
        attachments,
      };
    } catch (err: any) {
      throw new Error(`1secmail readMessage error: ${err.message}`);
    }
  }

  async getAttachment(account: InboxAccount, messageId: string, attachmentId: string): Promise<string> {
    const [login, domain] = account.address.split('@');
    return `${BASE_URL}?action=download&login=${encodeURIComponent(login)}&domain=${encodeURIComponent(domain)}&id=${messageId}&file=${encodeURIComponent(attachmentId)}`;
  }

  async updatePassword(): Promise<boolean> {
    throw new Error('In-place password rotation is not supported by 1secmail');
  }

  async deleteAccount(): Promise<boolean> {
    return true;
  }
}
