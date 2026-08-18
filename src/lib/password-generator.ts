/**
 * Password Generator Module with Cryptographic Entropy & Category Guarantee
 */

export interface PasswordOptions {
  length: number; // 8 - 64
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: '0Ol1I|B8',
};

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

/**
 * Filter out ambiguous characters if requested
 */
function getCategoryCharset(rawCharset: string, excludeAmbiguous: boolean): string {
  if (!excludeAmbiguous) return rawCharset;
  return rawCharset
    .split('')
    .filter((char) => !CHARACTER_SETS.ambiguous.includes(char))
    .join('');
}

/**
 * Generates a cryptographically secure random integer in range [0, max - 1]
 * Uses Web Crypto API (globalThis.crypto) — available in all modern browsers.
 * This module is only called client-side from 'use client' components after mount.
 */
function getRandomInt(max: number): number {
  if (max <= 0) return 0;
  const array = new Uint32Array(1);

  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(array);
  } else {
    // Fallback: Math.random (non-cryptographic, should never be reached in modern browsers)
    array[0] = Math.floor(Math.random() * 0xFFFFFFFF);
  }
  return array[0] % max;
}

/**
 * Generates a single password matching options with strict post-generation category validation
 */
export function generatePassword(options: PasswordOptions = DEFAULT_OPTIONS): string {
  const { length, uppercase, lowercase, numbers, symbols, excludeAmbiguous } = options;

  // Build active pools per enabled category
  const activeCategories: { name: string; charset: string }[] = [];

  if (uppercase) {
    const set = getCategoryCharset(CHARACTER_SETS.uppercase, excludeAmbiguous);
    if (set.length > 0) activeCategories.push({ name: 'uppercase', charset: set });
  }
  if (lowercase) {
    const set = getCategoryCharset(CHARACTER_SETS.lowercase, excludeAmbiguous);
    if (set.length > 0) activeCategories.push({ name: 'lowercase', charset: set });
  }
  if (numbers) {
    const set = getCategoryCharset(CHARACTER_SETS.numbers, excludeAmbiguous);
    if (set.length > 0) activeCategories.push({ name: 'numbers', charset: set });
  }
  if (symbols) {
    const set = getCategoryCharset(CHARACTER_SETS.symbols, excludeAmbiguous);
    if (set.length > 0) activeCategories.push({ name: 'symbols', charset: set });
  }

  // Fallback if no categories are enabled
  if (activeCategories.length === 0) {
    activeCategories.push({
      name: 'lowercase',
      charset: getCategoryCharset(CHARACTER_SETS.lowercase, excludeAmbiguous),
    });
  }

  const combinedCharset = activeCategories.map((cat) => cat.charset).join('');

  const maxAttempts = 100;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const chars: string[] = [];
    for (let i = 0; i < length; i++) {
      const index = getRandomInt(combinedCharset.length);
      chars.push(combinedCharset[index]);
    }
    const candidate = chars.join('');

    // Strict validation: Must contain at least 1 character from EACH enabled category
    const isValid = activeCategories.every((cat) =>
      cat.charset.split('').some((char) => candidate.includes(char))
    );

    if (isValid) {
      return candidate;
    }
  }

  // Deterministic fallback insertion if random chance failed after maxAttempts
  const result: string[] = [];
  // Ensure 1 of each enabled category first
  activeCategories.forEach((cat) => {
    const idx = getRandomInt(cat.charset.length);
    result.push(cat.charset[idx]);
  });
  // Fill remaining slots
  while (result.length < length) {
    const idx = getRandomInt(combinedCharset.length);
    result.push(combinedCharset[idx]);
  }

  // Shuffle using Fisher-Yates with crypto random
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

/**
 * Generate a batch of N passwords
 */
export function generatePasswordBatch(
  count: number = 5,
  options: PasswordOptions = DEFAULT_OPTIONS
): string[] {
  return Array.from({ length: count }, () => generatePassword(options));
}

/**
 * Calculate Bit Entropy: H = L * log2(PoolSize)
 */
export function calculateEntropy(password: string, options: PasswordOptions): number {
  if (!password) return 0;
  let poolSize = 0;

  if (options.uppercase) {
    poolSize += getCategoryCharset(CHARACTER_SETS.uppercase, options.excludeAmbiguous).length;
  }
  if (options.lowercase) {
    poolSize += getCategoryCharset(CHARACTER_SETS.lowercase, options.excludeAmbiguous).length;
  }
  if (options.numbers) {
    poolSize += getCategoryCharset(CHARACTER_SETS.numbers, options.excludeAmbiguous).length;
  }
  if (options.symbols) {
    poolSize += getCategoryCharset(CHARACTER_SETS.symbols, options.excludeAmbiguous).length;
  }

  if (poolSize === 0) poolSize = 26;

  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy * 10) / 10;
}

export type StrengthRating = 'Weak' | 'Fair' | 'Good' | 'Strong' | 'Ultra Secure';

export interface StrengthInfo {
  score: number; // 0 - 100 percentage bar
  label: StrengthRating;
  colorClass: string;
  badgeBg: string;
  bits: number;
}

/**
 * Evaluate password strength based on entropy bits
 */
export function getStrengthInfo(entropy: number): StrengthInfo {
  if (entropy < 40) {
    return {
      score: Math.min(100, Math.max(15, (entropy / 40) * 30)),
      label: 'Weak',
      colorClass: 'bg-rose-500 text-rose-400 border-rose-500/30',
      badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      bits: entropy,
    };
  } else if (entropy < 60) {
    return {
      score: 40 + ((entropy - 40) / 20) * 20,
      label: 'Fair',
      colorClass: 'bg-amber-500 text-amber-400 border-amber-500/30',
      badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      bits: entropy,
    };
  } else if (entropy < 80) {
    return {
      score: 60 + ((entropy - 60) / 20) * 20,
      label: 'Good',
      colorClass: 'bg-yellow-400 text-yellow-300 border-yellow-400/30',
      badgeBg: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
      bits: entropy,
    };
  } else if (entropy < 100) {
    return {
      score: 80 + ((entropy - 80) / 20) * 15,
      label: 'Strong',
      colorClass: 'bg-emerald-500 text-emerald-400 border-emerald-500/30',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      bits: entropy,
    };
  } else {
    return {
      score: 100,
      label: 'Ultra Secure',
      colorClass: 'bg-cyan-400 text-cyan-300 border-cyan-400/30',
      badgeBg: 'bg-cyan-400/15 text-cyan-300 border-cyan-400/30',
      bits: entropy,
    };
  }
}
