import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  generatePasswordBatch,
  calculateEntropy,
  getStrengthInfo,
  CHARACTER_SETS,
  DEFAULT_OPTIONS,
  PasswordOptions,
} from '../src/lib/password-generator';

describe('Password Generator Core Module', () => {
  it('should generate a password of specified length', () => {
    const lengths = [8, 16, 32, 64];
    lengths.forEach((len) => {
      const pwd = generatePassword({ ...DEFAULT_OPTIONS, length: len });
      expect(pwd.length).toBe(len);
    });
  });

  it('should guarantee presence of at least one character from each enabled category', () => {
    const options: PasswordOptions = {
      length: 12,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: false,
    };

    // Run 50 iterations to ensure consistency
    for (let i = 0; i < 50; i++) {
      const pwd = generatePassword(options);
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNum = /[0-9]/.test(pwd);
      const hasSymbol = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd);

      expect(hasUpper).toBe(true);
      expect(hasLower).toBe(true);
      expect(hasNum).toBe(true);
      expect(hasSymbol).toBe(true);
    }
  });

  it('should exclude ambiguous characters when option is enabled', () => {
    const options: PasswordOptions = {
      length: 30,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
    };

    const ambiguousChars = CHARACTER_SETS.ambiguous.split('');

    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(options);
      ambiguousChars.forEach((ambChar) => {
        expect(pwd).not.toContain(ambChar);
      });
    }
  });

  it('should calculate entropy accurately based on bit length formula H = L * log2(N)', () => {
    const options: PasswordOptions = {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true, // total pool ~ 26+26+10+26 = 88
      excludeAmbiguous: false,
    };
    const pwd = generatePassword(options);
    const entropy = calculateEntropy(pwd, options);

    // 16 * log2(88) = 16 * ~6.4594 = ~103.35 bits
    expect(entropy).toBeGreaterThan(95);
    expect(entropy).toBeLessThan(115);
  });

  it('should correctly classify strength based on entropy', () => {
    const weakInfo = getStrengthInfo(30);
    expect(weakInfo.label).toBe('Weak');

    const fairInfo = getStrengthInfo(50);
    expect(fairInfo.label).toBe('Fair');

    const goodInfo = getStrengthInfo(70);
    expect(goodInfo.label).toBe('Good');

    const strongInfo = getStrengthInfo(90);
    expect(strongInfo.label).toBe('Strong');

    const ultraInfo = getStrengthInfo(110);
    expect(ultraInfo.label).toBe('Ultra Secure');
  });

  it('should generate a batch of passwords', () => {
    const batch = generatePasswordBatch(5, DEFAULT_OPTIONS);
    expect(batch.length).toBe(5);
    batch.forEach((pwd) => expect(pwd.length).toBe(16));
  });
});
