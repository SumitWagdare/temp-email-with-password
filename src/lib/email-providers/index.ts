import { EmailProvider, InboxAccount, EmailMessage, EmailDetail } from './types';
import { MailTmProvider } from './mailtm';
import { OneSecMailProvider } from './1secmail';

export class EmailProviderService implements EmailProvider {
  name = 'EmailProviderService';
  private primary: EmailProvider;
  private fallback: EmailProvider;

  constructor() {
    this.primary = new MailTmProvider();
    this.fallback = new OneSecMailProvider();
  }

  private async executeWithFallback<T>(
    fn: (provider: EmailProvider) => Promise<T>,
    targetProviderName?: string
  ): Promise<T> {
    const provider =
      targetProviderName === this.fallback.name ? this.fallback : this.primary;

    try {
      return await fn(provider);
    } catch (primaryErr) {
      console.warn(
        `Primary provider ${provider.name} failed. Attempting fallback...`,
        primaryErr
      );
      if (provider === this.primary) {
        return await fn(this.fallback);
      }
      throw primaryErr;
    }
  }

  async getDomains(): Promise<string[]> {
    try {
      return await this.primary.getDomains();
    } catch {
      return await this.fallback.getDomains();
    }
  }

  async createAccount(
    username: string,
    domain: string,
    password?: string
  ): Promise<InboxAccount> {
    return this.executeWithFallback((provider) =>
      provider.createAccount(username, domain, password)
    );
  }

  async getMessages(account: InboxAccount): Promise<EmailMessage[]> {
    return this.executeWithFallback(
      (provider) => provider.getMessages(account),
      account.providerName
    );
  }

  async getMessageDetail(
    account: InboxAccount,
    messageId: string
  ): Promise<EmailDetail> {
    return this.executeWithFallback(
      (provider) => provider.getMessageDetail(account, messageId),
      account.providerName
    );
  }

  async getAttachment(
    account: InboxAccount,
    messageId: string,
    attachmentId: string
  ): Promise<string> {
    return this.executeWithFallback(
      (provider) =>
        provider.getAttachment
          ? provider.getAttachment(account, messageId, attachmentId)
          : Promise.reject(new Error('getAttachment not implemented on provider')),
      account.providerName
    );
  }

  async updatePassword(account: InboxAccount, newPassword: string): Promise<boolean> {
    return this.executeWithFallback(
      (provider) =>
        provider.updatePassword
          ? provider.updatePassword(account, newPassword)
          : Promise.reject(new Error('Password update not supported by provider')),
      account.providerName
    );
  }

  async deleteAccount(account: InboxAccount): Promise<boolean> {
    return this.executeWithFallback(
      (provider) => provider.deleteAccount(account),
      account.providerName
    );
  }
}

export const emailService = new EmailProviderService();
