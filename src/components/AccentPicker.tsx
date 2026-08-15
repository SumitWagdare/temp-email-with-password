'use client';

import React from 'react';
import { useAccent, ACCENT_SWATCHES } from '@/app/providers';
import { Palette } from 'lucide-react';

export function AccentPicker() {
  const { accent, setAccent } = useAccent();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
        title="Change Accent Color"
        aria-label="Change Accent Color"
      >
        <Palette className="w-5 h-5 text-accent" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-48 p-2 rounded-xl glass-panel shadow-2xl border border-slate-700/50">
            <p className="text-xs font-semibold text-slate-400 px-2 py-1 mb-1">
              ACCENT THEME
            </p>
            <div className="space-y-1">
              {ACCENT_SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  onClick={() => {
                    setAccent(swatch.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    accent === swatch.id
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20"
                    style={{ backgroundColor: swatch.color }}
                  />
                  <span>{swatch.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
