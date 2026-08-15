'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export const ACCENT_SWATCHES = [
  { id: 'cyan', name: 'Electric Cyan', color: '#06b6d4' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b' },
  { id: 'rose', name: 'Rose Quartz', color: '#f43f5e' },
] as const;

export type AccentSwatchId = (typeof ACCENT_SWATCHES)[number]['id'];

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5000,
            refetchOnWindowFocus: false,
            retry: 2,
          },
        },
      })
  );

  const [accent, setAccentState] = useState<AccentSwatchId>('cyan');

  useEffect(() => {
    const savedAccent = localStorage.getItem('notrace-accent') as AccentSwatchId;
    if (savedAccent && ACCENT_SWATCHES.some((s) => s.id === savedAccent)) {
      setAccentState(savedAccent);
      document.documentElement.setAttribute('data-accent', savedAccent);
    } else {
      document.documentElement.setAttribute('data-accent', 'cyan');
    }
  }, []);

  const changeAccent = (newAccent: AccentSwatchId) => {
    setAccentState(newAccent);
    localStorage.setItem('notrace-accent', newAccent);
    document.documentElement.setAttribute('data-accent', newAccent);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AccentContext.Provider value={{ accent, setAccent: changeAccent }}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
              },
            }}
          />
        </AccentContext.Provider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

interface AccentContextType {
  accent: AccentSwatchId;
  setAccent: (accent: AccentSwatchId) => void;
}

export const AccentContext = React.createContext<AccentContextType>({
  accent: 'cyan',
  setAccent: () => {},
});

export function useAccent() {
  return React.useContext(AccentContext);
}
