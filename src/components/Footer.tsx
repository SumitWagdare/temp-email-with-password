'use client';

import React from 'react';
import { Shield, Lock, EyeOff, Globe, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 mt-auto text-slate-400 py-6 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Brand tagline & privacy badges */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <span className="font-semibold text-slate-200 text-sm">NoTrace</span>
            <span>&mdash; Ephemeral Mail & Password Security</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 border-l border-slate-800 pl-4 hidden md:flex">
            <div className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-accent" />
              <span>Client-Side Crypto</span>
            </div>
            <div className="flex items-center gap-1">
              <EyeOff className="w-3 h-3 text-emerald-400" />
              <span>Zero Database</span>
            </div>
          </div>
        </div>

        {/* Right: Minimal inline icon row */}
        <div className="flex items-center gap-3 text-slate-400">
          <a
            href="https://wagdaresumitportfolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors p-1"
            title="Portfolio — Sumit Wagdare"
            aria-label="Portfolio"
          >
            <Globe className="w-4 h-4" />
          </a>
          <a
            href="https://linkedin.com/in/sumit-wagdare-455816419"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors p-1"
            title="LinkedIn Profile"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href="mailto:sumitwagdare8@gmail.com"
            className="hover:text-accent transition-colors p-1"
            title="Send Email"
            aria-label="Email"
          >
            <Mail className="w-4 h-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
