'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
      title={`Theme: ${theme}`}
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5" />
      ) : theme === 'light' ? (
        <Sun className="w-5 h-5 text-amber-500" />
      ) : (
        <Monitor className="w-5 h-5" />
      )}
    </button>
  );
}
