import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailProviderService } from '../src/lib/email-providers';
import { MailTmProvider } from '../src/lib/email-providers/mailtm';
import { OneSecMailProvider } from '../src/lib/email-providers/1secmail';

describe('Email Providers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('MailTmProvider handles domain retrieval correctly', async () => {
    const provider = new MailTmProvider();
    const fakeResponse = {
      'hydra:member': [
        { id: '1', domain: 'emalupe.com', isActive: true },
        { id: '2', domain: 'disabled.com', isOptionDisabled: true },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => fakeResponse,
    } as unknown as Response);

    const domains = await provider.getDomains();
    expect(domains).toEqual(['emalupe.com']);
  });

  it('MailTmProvider creates account and retrieves token', async () => {
    const provider = new MailTmProvider();

    global.fetch = vi
      .fn()
      // createAccount call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'acc_123' }),
      } as unknown as Response)
      // token call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'jwt_token_sample' }),
      } as unknown as Response);

    const account = await provider.createAccount('testuser', 'emalupe.com', 'Secret123!');
    expect(account.id).toBe('acc_123');
    expect(account.address).toBe('testuser@emalupe.com');
    expect(account.token).toBe('jwt_token_sample');
    expect(account.password).toBe('Secret123!');
  });

  it('EmailProviderService falls back when primary fails', async () => {
    const service = new EmailProviderService();

    // Mock primary failure, fallback success for getDomains
    vi.spyOn(MailTmProvider.prototype, 'getDomains').mockRejectedValue(new Error('Primary 500 error'));
    vi.spyOn(OneSecMailProvider.prototype, 'getDomains').mockResolvedValue(['fallback.com']);

    const domains = await service.getDomains();
    expect(domains).toEqual(['fallback.com']);
  });

  it('EmailProviderService returns hardcoded default domains if all remote providers fail', async () => {
    const service = new EmailProviderService();

    vi.spyOn(MailTmProvider.prototype, 'getDomains').mockRejectedValue(new Error('Down'));
    vi.spyOn(OneSecMailProvider.prototype, 'getDomains').mockRejectedValue(new Error('Down'));

    const domains = await service.getDomains();
    expect(domains).toContain('emalupe.com');
  });
});
