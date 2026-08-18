'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_OPTIONS,
  PasswordOptions,
  generatePassword,
  generatePasswordBatch,
  calculateEntropy,
  getStrengthInfo,
} from '@/lib/password-generator';

export default function PasswordGeneratorPage() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [primaryPassword, setPrimaryPassword] = useState<string>('');
  const [batchPasswords, setBatchPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPrimary, setCopiedPrimary] = useState(false);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [isMounted, setIsMounted] = useState(false);
  const clipboardTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mark component as mounted (client-side only) to avoid SSR hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    return () => {
      // Cleanup clipboard timer on unmount
      if (clipboardTimerRef.current) {
        clearInterval(clipboardTimerRef.current);
      }
    };
  }, []);

  // Regenerate primary & batch passwords
  const handleRegenerate = useCallback(() => {
    const mainPwd = generatePassword(options);
    setPrimaryPassword(mainPwd);
    setBatchPasswords(generatePasswordBatch(5, options));
    setCopiedPrimary(false);
    setCopiedIndex(null);
  }, [options]);

  // Generate passwords only after client-side mount to prevent hydration mismatch
  useEffect(() => {
    if (isMounted) {
      handleRegenerate();
    }
  }, [isMounted, handleRegenerate]);

  // Handle Copy to Clipboard with 30s auto-clear countdown toast
  const copyToClipboard = (text: string, isPrimary = true, index?: number) => {
    navigator.clipboard.writeText(text);

    if (isPrimary) {
      setCopiedPrimary(true);
      setTimeout(() => setCopiedPrimary(false), 2000);
    } else if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }

    // Clear any existing clipboard countdown timer
    if (clipboardTimerRef.current) {
      clearInterval(clipboardTimerRef.current);
      clipboardTimerRef.current = null;
    }

    // Auto-clear clipboard countdown toast
    let remaining = 30;
    const toastId = 'clipboard-countdown';

    // Show the initial toast
    toast.custom(
      () => (
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 text-sm">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-slate-100">Password Copied to Clipboard!</p>
            <p className="text-xs text-slate-400">
              Clipboard will auto-clear in <span className="font-mono font-bold text-accent">{remaining}s</span> for security.
            </p>
          </div>
        </div>
      ),
      { id: toastId, duration: 31000 }
    );

    clipboardTimerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        if (clipboardTimerRef.current) {
          clearInterval(clipboardTimerRef.current);
          clipboardTimerRef.current = null;
        }
        // Clear clipboard
        navigator.clipboard.writeText('');
        toast.dismiss(toastId);
        toast.info('Clipboard auto-cleared for security.', { duration: 3000 });
      } else {
        // Update the SAME toast in place using its stable ID
        toast.custom(
          () => (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-700/80 p-3.5 rounded-xl shadow-2xl backdrop-blur-md text-slate-100 text-sm">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-slate-100">Password Copied to Clipboard!</p>
                <p className="text-xs text-slate-400">
                  Clipboard will auto-clear in <span className="font-mono font-bold text-accent">{remaining}s</span> for security.
                </p>
              </div>
            </div>
          ),
          { id: toastId, duration: (remaining + 1) * 1000 }
        );
      }
    }, 1000);
  };

  const copyAllBatch = () => {
    const text = batchPasswords.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All 5 passwords copied to clipboard!');
  };

  // Calculate entropy
  const entropy = calculateEntropy(primaryPassword, options);
  const strength = getStrengthInfo(entropy);

  const toggleOption = (key: keyof PasswordOptions) => {
    // Prevent disabling all character sets
    if (
      typeof options[key] === 'boolean' &&
      options[key] === true &&
      key !== 'excludeAmbiguous'
    ) {
      const activeCount = [
        options.uppercase,
        options.lowercase,
        options.numbers,
        options.symbols,
      ].filter(Boolean).length;
      if (activeCount <= 1) {
        toast.warning('At least one character set must remain enabled');
        return;
      }
    }
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold tracking-wide">
          <Zap className="w-3.5 h-3.5" />
          <span>CRYPTOGRAPHICALLY SECURE & BULLPROOF CATEGORY GUARANTEE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Secure Password Generator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Generate zero-log, entropy-guaranteed passwords entirely in your browser using Web Crypto API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-accent" />
                <h2 className="font-bold text-slate-200">Custom Rules</h2>
              </div>
              <button
                onClick={() => setOptions(DEFAULT_OPTIONS)}
                className="text-xs text-slate-400 hover:text-accent transition-colors"
              >
                Reset Defaults
              </button>
            </div>

            {/* Length Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <label className="font-medium text-slate-300">Password Length</label>
                <span className="font-mono font-bold text-lg text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                  {options.length}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={options.length}
                onChange={(e) =>
                  setOptions((prev) => ({ ...prev, length: parseInt(e.target.value) }))
                }
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between text-[11px] text-slate-400 px-0.5">
                <span>8 (Short)</span>
                <span>16 (Recommended)</span>
                <span>32 (Strong)</span>
                <span>64 (Max)</span>
              </div>
            </div>

            {/* Category Toggle Cards */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Character Sets
              </p>

              {[
                { key: 'uppercase', label: 'Uppercase Letters (A-Z)', sample: 'ABC' },
                { key: 'lowercase', label: 'Lowercase Letters (a-z)', sample: 'abc' },
                { key: 'numbers', label: 'Numbers (0-9)', sample: '123' },
                { key: 'symbols', label: 'Special Symbols (!@#$%)', sample: '!@#' },
              ].map((item) => {
                const isChecked = options[item.key as keyof PasswordOptions] as boolean;
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleOption(item.key as keyof PasswordOptions)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isChecked
                        ? 'bg-slate-800/80 border-accent/40 text-slate-100 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-accent border-accent text-slate-950'
                            : 'border-slate-700 bg-slate-800/50'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {item.sample}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ambiguous Filter */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                onClick={() => toggleOption('excludeAmbiguous')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  options.excludeAmbiguous
                    ? 'bg-accent/10 border-accent/40 text-slate-100'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-accent" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Avoid Ambiguous Characters</p>
                    <p className="text-[11px] text-slate-400">Excludes 0, O, 1, l, I, |</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    options.excludeAmbiguous
                      ? 'bg-accent border-accent text-slate-950'
                      : 'border-slate-700 bg-slate-800/50'
                  }`}
                >
                  {options.excludeAmbiguous && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Batch View */}
        <div className="lg:col-span-7 space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4 text-accent" />
              <span>Single Password</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'batch'
                  ? 'bg-slate-800 text-slate-100 border border-slate-700/60 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-accent" />
              <span>Batch Generator (x5)</span>
            </button>
          </div>

          {isMounted && (
            <AnimatePresence mode="wait">
              {activeTab === 'single' ? (
                <motion.div
                  key="single"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                {/* Main Password Output Box */}
                <div className="glass-panel rounded-2xl p-6 space-y-6 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      Generated Result
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${strength.badgeBg}`}>
                      {strength.label} ({strength.bits} bits)
                    </span>
                  </div>

                  {/* Password Display Box */}
                  <div className="relative group">
                    <div className="w-full min-h-[4rem] px-4 py-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3 overflow-x-auto font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-100 break-all select-all">
                      <span className="text-slate-100">{primaryPassword}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => copyToClipboard(primaryPassword, true)}
                      className="flex-1 py-3 px-4 rounded-xl bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all shadow-lg shadow-accent/20 flex items-center justify-center gap-2 text-sm"
                    >
                      {copiedPrimary ? (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy Password</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRegenerate}
                      className="p-3 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-all"
                      title="Generate New Password"
                      aria-label="Generate New Password"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Live Strength / Entropy Bar */}
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Entropy Strength</span>
                      <span className="text-slate-300 font-semibold">{strength.bits} bits</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${strength.colorClass.split(' ')[0]}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy & Guarantee Note */}
                <div className="p-4 rounded-xl glass-card border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-200 mb-0.5">Post-Generation Guaranteed</p>
                    <p>
                      Every password generated undergoes strict post-generation verification to ensure at least one character exists from every enabled category. No raw password ever leaves your browser.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="batch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-accent" />
                      <h3 className="font-bold text-slate-200">Batch of 5 Passwords</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyAllBatch}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All</span>
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className="px-3 py-1.5 rounded-lg bg-accent text-xs font-bold text-slate-950 hover:bg-accent-glow transition-all shadow-md shadow-accent/20 flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Regenerate All</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {batchPasswords.map((pwd, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors group"
                      >
                        <span className="font-mono text-sm font-bold tracking-wider text-slate-200 break-all">
                          {pwd}
                        </span>
                        <button
                          onClick={() => copyToClipboard(pwd, false, idx)}
                          className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-accent hover:bg-slate-800 transition-colors shrink-0 ml-2"
                          title="Copy password"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
