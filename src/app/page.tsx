'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Mail,
  KeyRound,
  ShieldCheck,
  Zap,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Lock,
  Globe,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import { FaqAccordion } from '@/components/FaqAccordion';

export default function LandingPage() {
  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>100% FREE & ZERO DATABASE PERSISTENCE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight leading-[1.15]">
            Disposable Temp Mail & <br />
            <span className="bg-gradient-to-r from-slate-100 via-slate-200 to-accent bg-clip-text text-transparent">
              Secure Password Generator
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Protect your real inbox from spam and generate uncrackable, entropy-guaranteed passwords completely inside your browser. No signups, no tracking, zero logs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/temp-mail"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 text-sm group"
            >
              <Mail className="w-4 h-4" />
              <span>Get Free Temp Inbox</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/password-generator"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 text-slate-200 hover:text-white hover:bg-slate-800 border border-slate-800 font-bold transition-all flex items-center justify-center gap-2 text-sm"
            >
              <KeyRound className="w-4 h-4 text-accent" />
              <span>Generate Secure Password</span>
            </Link>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 max-w-5xl mx-auto">
          <div className="glass-card rounded-2xl p-6 text-left border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Zero Server Database</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              NoTrace stores zero email content or passwords on any backend database. Credentials exist strictly in browser RAM and sessionStorage.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Client-Side Cryptography</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Passwords are created using <code className="text-accent font-mono">crypto.getRandomValues()</code> and verified post-generation to guarantee character category inclusion.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left border border-slate-800/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Keyless Provider Strategy</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leverages keyless public REST APIs (mail.tm with 1secmail fallback) ensuring infinite free usage without paid API quotas.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Tool Teasers / Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Two Powerful Privacy Tools. One Ephemeral Hub.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Designed for instant disposable use without registrations or tracking cookies.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Temp Mail Teaser Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent font-bold text-sm">
                  <Mail className="w-5 h-5" />
                  <span>DISPOSABLE EMAIL INBOX</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  Active Auto-Polling
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                Instant Temp Inbox with QR Code & Sanitized Reader
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Generate instant temporary email addresses to verify signups, download whitepapers, or test workflows without cluttering your personal inbox.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  'Auto-refresh polling with Page Visibility pause',
                  'QR Code modal for instant mobile phone scanning',
                  'DOMPurify HTML email body rendering',
                  'One-click custom local-part username change',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/temp-mail"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold border border-slate-800 text-xs flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Launch Temp Mail Tool</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </Link>
          </div>

          {/* Password Generator Teaser Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-accent font-bold text-sm">
                  <KeyRound className="w-5 h-5" />
                  <span>PASSWORD GENERATOR</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  Web Crypto API
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                High-Entropy Password Generator & Batch Engine
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Create passwords with true cryptographic randomness, category guarantees, entropy metrics, and automatic 30-second clipboard clearing.
              </p>

              <div className="space-y-2 pt-2">
                {[
                  'Post-generation mandatory category inclusion check',
                  'Bit-entropy calculation H = L × log2(N)',
                  'Batch generation (5 passwords simultaneously)',
                  '30-second auto-clear clipboard countdown toast',
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/password-generator"
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold border border-slate-800 text-xs flex items-center justify-center gap-2 transition-all mt-4"
            >
              <span>Launch Password Generator</span>
              <ArrowRight className="w-4 h-4 text-accent" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Diagram */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">How NoTrace Protects Your Privacy</h2>
          <p className="text-xs sm:text-sm text-slate-400">Three simple steps to zero-trace online security</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative text-center">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-extrabold flex items-center justify-center mx-auto text-sm border border-accent/30">
              1
            </div>
            <h3 className="font-bold text-slate-200 text-base">Instant Generation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Open NoTrace and instantly receive a clean temporary inbox address and cryptographically strong password.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative text-center">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-extrabold flex items-center justify-center mx-auto text-sm border border-accent/30">
              2
            </div>
            <h3 className="font-bold text-slate-200 text-base">Use & Verify</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use your disposable address for signups or confirmations. View sanitized incoming emails live in real-time.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3 relative text-center">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-extrabold flex items-center justify-center mx-auto text-sm border border-accent/30">
              3
            </div>
            <h3 className="font-bold text-slate-200 text-base">Automatic Destruction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Close your browser tab or hit Delete. Session keys and stored messages are immediately wiped with zero residual trace.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="px-4 sm:px-6 lg:px-8">
        <FaqAccordion />
      </section>
    </div>
  );
}
