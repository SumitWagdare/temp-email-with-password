'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Layers,
  Eye,
  EyeOff,
  ClipboardCheck,
  Timer,
  Sparkles,
  Lock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  generatePassword,
  generatePasswordBatch,
  calculateEntropy,
  getStrengthInfo,
  DEFAULT_OPTIONS,
  PasswordOptions,
  CHARACTER_SETS,
  StrengthInfo,
} from '@/lib/password-generator';

const CLIPBOARD_CLEAR_SECONDS = 30;

export default function PasswordGeneratorPage() {
  // Generator options
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);

  // Single password
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  // Batch passwords
  const [batchPasswords, setBatchPasswords] = useState<string[]>([]);
  const [showBatch, setShowBatch] = useState(false);

  // Copy state
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedBatchIndex, setCopiedBatchIndex] = useState<number | null>(null);
  const [copiedBatchAll, setCopiedBatchAll] = useState(false);

  // Clipboard auto-clear countdown
  const [clipboardCountdown, setClipboardCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate initial password on mount
  useEffect(() => {
    setPassword(generatePassword(options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recalculate entropy
  const entropy = password ? calculateEntropy(password, options) : 0;
  const strength: StrengthInfo = getStrengthInfo(entropy);

  // Generate single password
  const handleGenerate = useCallback(() => {
    const newPw = generatePassword(options);
    setPassword(newPw);
    setCopiedMain(false);
  }, [options]);

  // Generate batch of 5
  const handleBatchGenerate = useCallback(() => {
    const batch = generatePasswordBatch(5, options);
    setBatchPasswords(batch);
    setShowBatch(true);
    setCopiedBatchIndex(null);
    setCopiedBatchAll(false);
  }, [options]);

  // Auto-regenerate password when options change
  useEffect(() => {
    setPassword(generatePassword(options));
    setCopiedMain(false);
    if (showBatch && batchPasswords.length > 0) {
      setBatchPasswords(generatePasswordBatch(5, options));
      setCopiedBatchIndex(null);
      setCopiedBatchAll(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length, options.uppercase, options.lowercase, options.numbers, options.symbols, options.excludeAmbiguous]);

  // Start clipboard auto-clear countdown
  const startClipboardCountdown = useCallback(() => {
    // Clear existing countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setClipboardCountdown(CLIPBOARD_CLEAR_SECONDS);

    countdownRef.current = setInterval(() => {
      setClipboardCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // Clear clipboard
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText('').catch(() => {});
          }
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
          }
          toast.info('Clipboard auto-cleared for security.', { duration: 2000 });
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Copy single password
  const handleCopyMain = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedMain(true);
    toast.success('Password copied! Auto-clearing clipboard in 30s.', { duration: 3000 });
    startClipboardCountdown();
    setTimeout(() => setCopiedMain(false), 2000);
  }, [password, startClipboardCountdown]);

  // Copy individual batch password
  const handleCopyBatchItem = useCallback(
    (pw: string, index: number) => {
      navigator.clipboard.writeText(pw);
      setCopiedBatchIndex(index);
      toast.success(`Password #${index + 1} copied!`, { duration: 2000 });
      startClipboardCountdown();
      setTimeout(() => setCopiedBatchIndex(null), 2000);
    },
    [startClipboardCountdown]
  );

  // Copy all batch passwords
  const handleCopyBatchAll = useCallback(() => {
    if (batchPasswords.length === 0) return;
    const allText = batchPasswords.map((pw, i) => `${i + 1}. ${pw}`).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedBatchAll(true);
    toast.success('All 5 passwords copied! Auto-clearing clipboard in 30s.', { duration: 3000 });
    startClipboardCountdown();
    setTimeout(() => setCopiedBatchAll(false), 2000);
  }, [batchPasswords, startClipboardCountdown]);

  // Toggle option with minimum-1-category guard
  const toggleOption = (key: keyof PasswordOptions) => {
    if (typeof options[key] === 'boolean' && options[key] === true && key !== 'excludeAmbiguous') {
      const activeCount = [options.uppercase, options.lowercase, options.numbers, options.symbols].filter(Boolean).length;
      if (activeCount <= 1) {
        toast.warning('At least one character set must remain enabled');
        return;
      }
    }
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Count active pool size for display
  const poolSize = (() => {
    let size = 0;
    if (options.uppercase) size += options.excludeAmbiguous ? CHARACTER_SETS.uppercase.split('').filter((c) => !CHARACTER_SETS.ambiguous.includes(c)).length : CHARACTER_SETS.uppercase.length;
    if (options.lowercase) size += options.excludeAmbiguous ? CHARACTER_SETS.lowercase.split('').filter((c) => !CHARACTER_SETS.ambiguous.includes(c)).length : CHARACTER_SETS.lowercase.length;
    if (options.numbers) size += options.excludeAmbiguous ? CHARACTER_SETS.numbers.split('').filter((c) => !CHARACTER_SETS.ambiguous.includes(c)).length : CHARACTER_SETS.numbers.length;
    if (options.symbols) size += options.excludeAmbiguous ? CHARACTER_SETS.symbols.split('').filter((c) => !CHARACTER_SETS.ambiguous.includes(c)).length : CHARACTER_SETS.symbols.length;
    return size || 26;
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>WEB CRYPTO API · CLIENT-SIDE ONLY</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
          Secure Password Generator
        </h1>
        <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          Generate cryptographically strong passwords using{' '}
          <code className="text-accent font-mono text-xs">crypto.getRandomValues()</code>.
          Every password is guaranteed to include characters from all enabled categories.
        </p>
      </motion.div>

      {/* Main Generator Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 relative overflow-hidden shadow-2xl"
      >
        {/* Generated Password Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent" />
              Generated Password
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${strength.badgeBg}`}>
              {strength.label} ({strength.bits} bits)
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800">
            <span className="flex-1 font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-100 truncate select-all px-1 break-all">
              {showPassword ? password : '•'.repeat(Math.min(password.length, 32))}
            </span>

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors shrink-0"
              title={showPassword ? 'Hide Password' : 'Reveal Password'}
              aria-label="Toggle Password Visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-accent" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={handleCopyMain}
              className="py-2 px-3.5 rounded-lg bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all flex items-center gap-1.5 text-xs shrink-0 shadow-sm"
            >
              {copiedMain ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMain ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleGenerate}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-accent hover:bg-slate-800 transition-colors shrink-0"
              title="Generate New Password"
              aria-label="Generate New Password"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entropy Meter */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-400 font-medium uppercase tracking-wider">Entropy Score</span>
            <span className="font-mono text-slate-300">
              {entropy.toFixed(1)} bits · Pool: {poolSize} chars
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div
              className={`h-full rounded-full ${strength.colorClass.split(' ')[0]}`}
              initial={{ width: 0 }}
              animate={{ width: `${strength.score}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Clipboard Countdown Toast */}
        <AnimatePresence>
          {clipboardCountdown !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs"
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">
                  Clipboard auto-clears in <span className="font-mono font-bold text-amber-200">{clipboardCountdown}s</span>
                </span>
              </div>
              <button
                onClick={() => {
                  if (countdownRef.current) {
                    clearInterval(countdownRef.current);
                    countdownRef.current = null;
                  }
                  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText('').catch(() => {});
                  }
                  setClipboardCountdown(null);
                  toast.info('Clipboard cleared immediately.', { duration: 1500 });
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-bold transition-colors"
              >
                Clear Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generator Settings */}
        <div className="pt-4 border-t border-slate-800/80 space-y-5">
          <div className="flex items-center gap-2 text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-sm">Generator Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Toggles */}
            <div className="space-y-2">
              {[
                { key: 'uppercase', label: 'Uppercase (A-Z)', sample: 'ABCDEF' },
                { key: 'lowercase', label: 'Lowercase (a-z)', sample: 'abcdef' },
                { key: 'numbers', label: 'Numbers (0-9)', sample: '012345' },
                { key: 'symbols', label: 'Symbols (!@#$)', sample: '!@#$%^' },
              ].map((item) => {
                const isChecked = options[item.key as keyof PasswordOptions] as boolean;
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleOption(item.key as keyof PasswordOptions)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-slate-800 border-accent/40 text-slate-200'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-accent border-accent text-slate-950' : 'border-slate-700 bg-slate-800/50'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium flex-1 text-left">{item.label}</span>
                    <span className="font-mono text-[10px] text-slate-500">{item.sample}</span>
                  </button>
                );
              })}

              {/* Exclude ambiguous */}
              <button
                onClick={() => toggleOption('excludeAmbiguous')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  options.excludeAmbiguous
                    ? 'bg-slate-800 border-amber-500/40 text-slate-200'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${
                    options.excludeAmbiguous ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {options.excludeAmbiguous && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-xs font-medium flex-1 text-left">Exclude Ambiguous</span>
                <span className="font-mono text-[10px] text-slate-500">0 O l 1 I |</span>
              </button>
            </div>

            {/* Right: Slider + Stats */}
            <div className="space-y-4">
              {/* Length Slider */}
              <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300">Password Length</label>
                  <span className="font-mono font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-sm">
                    {options.length}
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={options.length}
                  onChange={(e) => setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between text-[9px] text-slate-500 px-0.5 font-medium uppercase tracking-wider">
                  <span>8</span>
                  <span>16</span>
                  <span>32</span>
                  <span>48</span>
                  <span>64</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Pool Size</p>
                  <p className="text-lg font-extrabold text-slate-100 font-mono">{poolSize}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Entropy</p>
                  <p className="text-lg font-extrabold text-slate-100 font-mono">{entropy.toFixed(1)}</p>
                </div>
              </div>

              {/* Formula Note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/60 text-[10px] text-slate-400 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-slate-300">H = L × log₂(N)</span> where L={options.length} and N={poolSize}.
                  Passwords are verified post-generation to guarantee at least one character from every enabled category.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleGenerate}
            className="py-3 px-4 rounded-xl bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-accent/20"
          >
            <Zap className="w-4 h-4" />
            <span>Generate New Password</span>
          </button>

          <button
            onClick={handleBatchGenerate}
            className="py-3 px-4 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 font-bold transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Layers className="w-4 h-4 text-accent" />
            <span>Batch Generate (5)</span>
          </button>
        </div>
      </motion.div>

      {/* Batch Passwords Panel */}
      <AnimatePresence>
        {showBatch && batchPasswords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-slate-100 text-lg">Batch Results</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold">
                  5 passwords
                </span>
              </div>
              <button
                onClick={handleCopyBatchAll}
                className="py-2 px-3.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700/60 font-bold transition-all flex items-center gap-1.5 text-xs"
              >
                {copiedBatchAll ? (
                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                ) : (
                  <ClipboardCheck className="w-3.5 h-3.5 text-accent" />
                )}
                <span>{copiedBatchAll ? 'All Copied!' : 'Copy All'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {batchPasswords.map((pw, index) => {
                const batchEntropy = calculateEntropy(pw, options);
                const batchStrength = getStrengthInfo(batchEntropy);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-extrabold text-accent border border-slate-700 shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-mono text-sm font-bold text-slate-200 truncate select-all">
                      {pw}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0 hidden sm:inline-block ${batchStrength.badgeBg}`}>
                      {batchStrength.bits}b
                    </span>
                    <button
                      onClick={() => handleCopyBatchItem(pw, index)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-accent hover:bg-slate-700 transition-colors shrink-0"
                      title={`Copy password #${index + 1}`}
                    >
                      {copiedBatchIndex === index ? (
                        <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Notice */}
      <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <span className="font-bold text-slate-300">100% Client-Side: </span>
          All passwords are generated exclusively in your browser using the Web Crypto API.
          No passwords are ever transmitted over the network or stored on any server.
          Clipboard is automatically cleared after 30 seconds for additional security.
        </p>
      </div>
    </div>
  );
}
