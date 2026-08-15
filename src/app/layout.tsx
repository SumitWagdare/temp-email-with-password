import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from './providers';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'NoTrace — Disposable Email & Secure Password Generator',
  description:
    'Free, open-source, privacy-first ephemeral mail and client-side entropy password generator with zero logging.',
  keywords: [
    'disposable email',
    'temp mail',
    'temporary inbox',
    'password generator',
    'entropy generator',
    'privacy tool',
    'no trace',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-accent/30 selection:text-accent">
        <AppProviders>
          <Navbar />
          <main className="flex-1 w-full relative">{children}</main>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
