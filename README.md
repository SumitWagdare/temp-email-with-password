# NoTrace — Privacy-First Disposable Temp Mail & Secure Password Generator

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/SumitWagdare/notrace)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black)

**NoTrace** is a free, open-source, privacy-first web application providing disposable temporary email inboxes and cryptographically strong password generation. Built with zero backend databases or server logs, all credentials and messages exist exclusively in browser RAM and `sessionStorage`.

---

## 🌟 Key Features

### 📬 Disposable Temp Email
- **Keyless Public Provider Integration**: Built on `mail.tm` REST API with automatic fallback to `1secmail`.
- **Server API Proxy**: All requests route server-side through `/api/mailtm` to eliminate browser CORS blocks and adblocker issues.
- **Stacked Account Credentials**: Displays both Email Address and Account Password together with copy triggers and eye-reveal toggles.
- **Session-Only Persistence**: Credentials stored in `sessionStorage`. Closing the tab or clicking Destroy wipes all data instantly.
- **Auto-Polling with Tab Visibility Control**: Background polling every 12 seconds that automatically pauses when the browser tab is hidden to save resources and rate-limits.
- **QR Code Modal**: Scan your temporary email address directly onto your smartphone using `qrcode.react`.
- **Sanitized HTML Message Viewer**: Email body HTML rendered safely using `isomorphic-dompurify`.
- **Search & Filters**: Instant filter by Subject, Sender, All, Unread, and Read statuses.

### 🔐 Password Generator
- **Web Crypto API**: High-entropy password generation using `window.crypto.getRandomValues()`.
- **Category Guarantee**: Post-generation validation loop ensures at least one character exists from *every* enabled category (Uppercase, Lowercase, Numbers, Symbols).
- **Ambiguous Character Filtering**: Option to exclude easily confused characters (`0`, `O`, `1`, `l`, `I`, `|`).
- **Live Entropy Meter**: Exact bit-entropy calculations ($H = L \times \log_2(N)$) and strength rating.
- **Auto-Clear Clipboard**: Copy password with automatic 30-second clipboard clearing and live countdown toast.
- **Batch Engine**: Generate 5 passwords simultaneously with individual and batch copy buttons.

### 🎨 Premium UI & Design Engine
- **Dark/Light/System Theme Modes**: Managed via `next-themes`.
- **Curated Accent Swatches**: Choose between Electric Cyan, Emerald, Violet, Sunset Amber, and Rose Quartz.
- **Glassmorphism & Framer Motion**: Liquid glass panels and dynamic page transitions.

---

## 🏗 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + CSS Variables for dynamic accents
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Data Fetching**: `@tanstack/react-query`
- **QR Code**: `qrcode.react`
- **Sanitization**: `isomorphic-dompurify`
- **Testing**: `vitest`

---

## 🚀 Quick Start & Development Setup

1. **Clone repository**:
   ```bash
   git clone https://github.com/SumitWagdare/notrace.git
   cd notrace
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run unit test suite**:
   ```bash
   npm run test
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🔌 How to Add a New Email Provider

NoTrace uses a clean Strategy Pattern for email providers defined in `src/lib/email-providers/`.

To add a new email provider (e.g. `GuerrillaMail` or `CustomProvider`):

1. Create a new provider file `src/lib/email-providers/myprovider.ts` implementing the `EmailProvider` interface:
   ```typescript
   import { EmailProvider, InboxAccount, EmailMessage, EmailDetail } from './types';

   export class MyProvider implements EmailProvider {
     name = 'myprovider';

     async getDomains(): Promise<string[]> { /* ... */ }
     async createAccount(username: string, domain: string): Promise<InboxAccount> { /* ... */ }
     async getMessages(account: InboxAccount): Promise<EmailMessage[]> { /* ... */ }
     async getMessageDetail(account: InboxAccount, messageId: string): Promise<EmailDetail> { /* ... */ }
     async deleteAccount(account: InboxAccount): Promise<boolean> { /* ... */ }
   }
   ```

2. Register your provider in `src/lib/email-providers/index.ts` inside `EmailProviderService`.

---

## ⚡ Deployment

### Vercel (Recommended)
This repository includes a pre-configured `vercel.json` file. Simply import `SumitWagdare/notrace` into your Vercel dashboard or click the badge above.
Zero environment variables or manual dashboard setup required!

---

## 📄 License

MIT License. Free for personal and commercial use.
