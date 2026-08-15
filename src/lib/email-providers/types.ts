/**
 * Standardized Email Provider Interface & Types
 */

export interface InboxAccount {
  id: string;
  address: string;
  token?: string | null;
  session?: Record<string, any> | null;
  password?: string;
  providerName: string;
  createdAt: string;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  downloadUrl?: string;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  msgid?: string;
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  intro: string;
  seen: boolean;
  createdAt: string;
  hasAttachments: boolean;
}

export interface EmailDetail extends EmailMessage {
  html: string[];
  text: string;
  attachments: EmailAttachment[];
}

export interface EmailProvider {
  name: string;
  getDomains(): Promise<string[]>;
  createAccount(username: string, domain: string, password?: string): Promise<InboxAccount>;
  getMessages(account: InboxAccount): Promise<EmailMessage[]>;
  getMessageDetail(account: InboxAccount, messageId: string): Promise<EmailDetail>;
  getAttachment?(account: InboxAccount, messageId: string, attachmentId: string): Promise<string>;
  updatePassword?(account: InboxAccount, newPassword: string): Promise<boolean>;
  deleteAccount(account: InboxAccount): Promise<boolean>;
}
