'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Trash2,
  QrCode,
  Search,
  Inbox,
  ShieldCheck,
  Clock,
  EyeOff,
  Eye,
  User,
  Calendar,
  Paperclip,
  Download,
  Code,
  FileText,
  X,
  KeyRound,
  Lock,
  AlertCircle,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { emailService } from '@/lib/email-providers';
import { InboxAccount, EmailMessage, EmailDetail } from '@/lib/email-providers/types';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import { QrModal } from '@/components/QrModal';
import { ChangeAddressModal } from '@/components/ChangeAddressModal';
import { generatePassword, DEFAULT_OPTIONS, PasswordOptions, calculateEntropy, getStrengthInfo } from '@/lib/password-generator';

const SESSION_KEY = 'notrace-inbox-session';

function formatTimeAgo(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function TempMailPage() {
  const isVisible = usePageVisibility();

  // Session Account state
  const [account, setAccount] = useState<InboxAccount | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Copy feedback state
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modals state
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isChangeOpen, setIsChangeOpen] = useState(false);
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);

  // Messages UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [messageDetail, setMessageDetail] = useState<EmailDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  // 1. Initialize or restore session inbox
  const initInbox = useCallback(async () => {
    setInitializing(true);
    setInitError(null);
    try {
      const availDomains = await emailService.getDomains();
      setDomains(availDomains);

      const savedSession = sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession) as InboxAccount;
          // Gracefully upgrade old sessions that didn't have passwords (e.g. old 1secmail sessions)
          if (!parsed.password) {
            parsed.password = generatePassword(DEFAULT_OPTIONS);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
          }
          setAccount(parsed);
          setInitializing(false);
          return;
        } catch {
          sessionStorage.removeItem(SESSION_KEY);
        }
      }

      const selectedDom = availDomains[0] || 'mail.tm';
      const randomUser = `nt_${Math.random().toString(36).substring(2, 9)}`;
      const newAcc = await emailService.createAccount(randomUser, selectedDom);

      setAccount(newAcc);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newAcc));
    } catch (err: any) {
      const msg = err.message || 'Failed to initialize disposable inbox';
      console.error('[TempMail] initInbox failed:', msg);
      setInitError(msg);
      toast.error(msg);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    initInbox();
  }, [initInbox]);

  // 2. React Query for auto-polling messages (12s interval, paused when tab hidden)
  const {
    data: messages = [],
    isLoading: isLoadingMessages,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['inbox-messages', account?.id, account?.address],
    queryFn: async () => {
      if (!account) return [];
      return await emailService.getMessages(account);
    },
    enabled: Boolean(account?.id) && isVisible,
    refetchInterval: isVisible ? 12000 : false,
    staleTime: 5000,
  });

  // Copy Email Address
  const copyAddress = () => {
    if (!account?.address) return;
    navigator.clipboard.writeText(account.address);
    setCopiedAddress(true);
    toast.success('Temp email address copied to clipboard!');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Copy Account Password
  const copyPassword = () => {
    if (!account?.password) return;
    navigator.clipboard.writeText(account.password);
    setCopiedPassword(true);
    toast.success('Inbox account password copied to clipboard!');
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  // Attempt Refresh Password (generate a new one locally)
  const handlePasswordRefreshClick = () => {
    if (!account) return;
    const newPassword = generatePassword(options);
    const updatedAccount = { ...account, password: newPassword };
    setAccount(updatedAccount);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedAccount));
    toast.success('Generated a new secure password!', { duration: 2000 });
  };

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

  // Auto-regenerate password when generator options change so entropy display stays accurate
  useEffect(() => {
    if (!account) return;
    const newPassword = generatePassword(options);
    const updatedAccount = { ...account, password: newPassword };
    setAccount(updatedAccount);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedAccount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length, options.uppercase, options.lowercase, options.numbers, options.symbols, options.excludeAmbiguous]);

  const entropy = account?.password ? calculateEntropy(account.password, options) : 0;
  const strength = getStrengthInfo(entropy);

  // Handle Manual Refresh Inbox
  const handleManualRefresh = () => {
    refetch();
    toast.info('Checking for new messages...', { duration: 2000 });
  };

  // Handle Swap / Change Inbox
  const handleChangeInbox = async (newUsername: string, newDomain: string) => {
    if (account) {
      await emailService.deleteAccount(account);
    }
    const newAcc = await emailService.createAccount(newUsername, newDomain);
    setAccount(newAcc);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newAcc));
    setSelectedMessageId(null);
    setMessageDetail(null);
  };

  // Handle Destroy / Delete Inbox
  const handleDeleteInbox = async () => {
    if (!account) return;
    const confirmDelete = window.confirm(
      'Are you sure you want to destroy this inbox? All messages will be permanently erased.'
    );
    if (!confirmDelete) return;

    try {
      await emailService.deleteAccount(account);
      sessionStorage.removeItem(SESSION_KEY);
      toast.success('Inbox permanently destroyed.');
      setSelectedMessageId(null);
      setMessageDetail(null);
      await initInbox();
    } catch (err: any) {
      toast.error('Failed to delete inbox: ' + err.message);
    }
  };

  // Handle Select Message
  const handleSelectMessage = async (msg: EmailMessage) => {
    if (!account) return;
    setSelectedMessageId(msg.id);
    setLoadingDetail(true);
    try {
      const detail = await emailService.getMessageDetail(account, msg.id);
      setMessageDetail(detail);

      const rawHtml = detail.html && detail.html.length > 0 ? detail.html[0] : '';
      if (rawHtml && typeof window !== 'undefined') {
        const DOMPurify = (await import('dompurify')).default;
        setSanitizedHtml(DOMPurify.sanitize(rawHtml));
      } else {
        setSanitizedHtml(rawHtml);
      }
    } catch (err: any) {
      toast.error('Failed to load email details: ' + err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Filter Messages
  const filteredMessages = messages.filter((msg) => {
    const senderName = msg.from?.name || '';
    const senderAddr = msg.from?.address || '';
    const subj = msg.subject || '';

    const matchesSearch =
      subj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      senderAddr.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterTab === 'unread') return matchesSearch && !msg.seen;
    if (filterTab === 'read') return matchesSearch && msg.seen;
    return matchesSearch;
  });

  const unreadCount = messages.filter((m) => !m.seen).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Error State Panel */}
      {initError && !account && (
        <div className="glass-panel rounded-3xl p-8 border border-rose-500/30 bg-rose-500/5 space-y-5 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-2 max-w-lg">
              <h2 className="text-lg font-bold text-rose-200">Inbox Creation Failed</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Could not connect to the email provider. This is usually a temporary issue with the upstream service.
              </p>
              <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                <p className="text-xs font-mono text-rose-300 break-all">{initError}</p>
              </div>
            </div>
            <button
              onClick={async () => {
                setRetrying(true);
                await initInbox();
                setRetrying(false);
              }}
              disabled={retrying}
              className="mt-2 py-3 px-8 rounded-xl bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Retrying...' : 'Retry Connection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="p-3.5 rounded-2xl glass-card border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-3 text-xs text-amber-300">
        <div className="flex items-center gap-2.5">
          <EyeOff className="w-4 h-4 text-amber-400 shrink-0" />
          <p>
            <span className="font-bold text-amber-200">Ephemeral RAM Storage: </span>
            Closing this browser tab or destroying the inbox permanently erases all credentials and messages.
          </p>
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold uppercase tracking-wider text-[10px] hidden sm:inline-block">
          Zero Persistence
        </span>
      </div>

      {/* Main Account Credentials Panel (Email + Account Password Grouped Stacked) */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-slate-100 text-lg">Inbox Account Credentials</h2>
          </div>

          {/* Polling Indicator */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-800 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isVisible ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isVisible ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="font-semibold text-slate-300">
              {isVisible ? 'Live Polling Active (12s)' : 'Polling Paused'}
            </span>
          </div>
        </div>

        {/* Stacked Credentials Rows */}
        <div className="space-y-4">
          {/* Row 1: Temporary Email Address */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-accent" />
              Temporary Email Address
            </span>

            {initializing || !account ? (
              <div className="h-12 w-full bg-slate-900 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-3 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                <span className="flex-1 font-mono text-base sm:text-lg font-bold tracking-tight text-slate-100 truncate select-all px-1">
                  {account.address}
                </span>
                <button
                  onClick={copyAddress}
                  className="py-2 px-3.5 rounded-lg bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all flex items-center gap-1.5 text-xs shrink-0 shadow-sm"
                >
                  {copiedAddress ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Inbox Account Password (Stacked directly below) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-accent" />
                Inbox Account Password
              </span>
              <span className="text-[10px] text-slate-400">Used for session re-authentication</span>
            </div>

            {initializing || !account ? (
              <div className="h-12 w-full bg-slate-900 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2 bg-slate-950/80 p-2.5 sm:p-3 rounded-xl border border-slate-800">
                <span className="flex-1 font-mono text-sm sm:text-base font-bold tracking-wider text-slate-200 truncate select-all px-1">
                  {showPassword ? account.password : '••••••••••••••••'}
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
                  onClick={copyPassword}
                  className="py-2 px-3.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700/60 font-bold transition-all flex items-center gap-1.5 text-xs shrink-0"
                >
                  {copiedPassword ? <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPassword ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={handlePasswordRefreshClick}
                  className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-accent hover:bg-slate-800 transition-colors shrink-0"
                  title="Generate New Password"
                  aria-label="Generate New Password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Password Generator Settings */}
        <div className="pt-5 border-t border-slate-800/80 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <SlidersHorizontal className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-sm">Generator Settings</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${strength.badgeBg}`}>
              {strength.label} ({strength.bits} bits)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Toggles */}
            <div className="space-y-2">
              {[
                { key: 'uppercase', label: 'Uppercase (A-Z)' },
                { key: 'lowercase', label: 'Lowercase (a-z)' },
                { key: 'numbers', label: 'Numbers (0-9)' },
                { key: 'symbols', label: 'Symbols (!@#$)' },
              ].map((item) => {
                const isChecked = options[item.key as keyof PasswordOptions] as boolean;
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleOption(item.key as keyof PasswordOptions)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg border transition-all ${
                      isChecked
                        ? 'bg-slate-800 border-accent/40 text-slate-200'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center border transition-colors ${isChecked ? 'bg-accent border-accent text-slate-950' : 'border-slate-700 bg-slate-800/50'}`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right: Slider & Strength */}
            <div className="space-y-4">
              <div className="space-y-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300">Length</label>
                  <span className="font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20">
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
                  <span>64</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-medium uppercase tracking-wider">Entropy Score</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strength.colorClass.split(' ')[0]}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Inbox Actions Controls Bar */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={handleManualRefresh}
            disabled={isRefetching || initializing}
            className="py-2.5 px-3 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Refresh Inbox</span>
          </button>

          <button
            onClick={() => setIsChangeOpen(true)}
            disabled={initializing}
            className="py-2.5 px-3 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-accent" />
            <span>Change Inbox</span>
          </button>

          <button
            onClick={() => setIsQrOpen(true)}
            disabled={initializing || !account}
            className="py-2.5 px-3 rounded-xl bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-4 h-4 text-accent" />
            <span>QR Code</span>
          </button>

          <button
            onClick={handleDeleteInbox}
            disabled={initializing || !account}
            className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Destroy Inbox</span>
          </button>
        </div>
      </div>

      {/* Dual-Pane Layout (Desktop: List Left + Reader Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inbox List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'all'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({messages.length})
              </button>

              <button
                onClick={() => setFilterTab('unread')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  filterTab === 'unread'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-accent text-slate-950 font-extrabold text-[10px]">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFilterTab('read')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterTab === 'read'
                    ? 'bg-slate-800 text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Read
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden min-h-[22rem]">
            {isLoadingMessages ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 bg-slate-900/80 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[20rem]">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 animate-float">
                  <Inbox className="w-7 h-7 text-accent" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h3 className="text-sm font-bold text-slate-200">Inbox is Clean</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {searchQuery
                      ? 'No messages matched your search query.'
                      : 'Waiting for incoming emails. Messages sent to your address will appear automatically.'}
                  </p>
                </div>
                <button
                  onClick={handleManualRefresh}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" />
                  <span>Check Now</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredMessages.map((msg) => {
                  const isSelected = selectedMessageId === msg.id;
                  const senderInitial = (msg.from?.name || msg.from?.address || 'U')
                    .charAt(0)
                    .toUpperCase();

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      className={`p-4 flex items-start gap-3 hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-800/80 border-l-4 border-l-accent'
                          : !msg.seen
                          ? 'bg-slate-900/60 font-semibold'
                          : 'opacity-85'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-xs font-extrabold text-accent shrink-0 mt-0.5">
                        {senderInitial}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {msg.from?.name || msg.from?.address || 'Unknown'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatTimeAgo(msg.createdAt)}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-200 truncate">
                          {msg.subject || '(No Subject)'}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{msg.intro}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Message Reader Pane */}
        <div className="lg:col-span-7">
          {loadingDetail ? (
            <div className="glass-panel rounded-2xl p-8 border border-slate-800 min-h-[22rem] flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-accent animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Sanitizing and rendering email...</p>
            </div>
          ) : messageDetail ? (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <button
                  onClick={() => {
                    setSelectedMessageId(null);
                    setMessageDetail(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4 text-accent" />
                  <span>Close Reader</span>
                </button>

                {messageDetail.html && messageDetail.html.length > 0 && messageDetail.text && (
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setViewMode('html')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        viewMode === 'html'
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5 text-accent" />
                      <span>HTML</span>
                    </button>
                    <button
                      onClick={() => setViewMode('text')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        viewMode === 'text'
                          ? 'bg-slate-800 text-slate-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-accent" />
                      <span>Text</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-extrabold text-slate-100">
                  {messageDetail.subject || '(No Subject)'}
                </h2>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-accent" />
                    <span className="font-bold text-slate-200">{messageDetail.from?.name}</span>
                    <span className="font-mono text-slate-400">&lt;{messageDetail.from?.address}&gt;</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(messageDetail.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {messageDetail.attachments && messageDetail.attachments.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <p className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-accent" />
                    <span>Attachments ({messageDetail.attachments.length})</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {messageDetail.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                      >
                        <div className="truncate mr-2">
                          <p className="font-medium text-slate-200 truncate">{att.filename}</p>
                          <p className="text-[10px] text-slate-400">
                            {(att.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        {att.downloadUrl && (
                          <a
                            href={att.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 text-accent hover:bg-slate-700 shrink-0"
                            title="Download Attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                {viewMode === 'html' && (sanitizedHtml || (messageDetail.html && messageDetail.html[0])) ? (
                  <div
                    className="prose prose-invert max-w-none p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-200 text-sm leading-relaxed overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: sanitizedHtml || messageDetail.html[0],
                    }}
                  />
                ) : (
                  <pre className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {messageDetail.text || messageDetail.intro || 'No text body available.'}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-12 border border-slate-800 min-h-[22rem] flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <Mail className="w-8 h-8 text-accent/60" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-base font-bold text-slate-200">No Email Selected</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select an email from the inbox list on the left to read its full sanitized contents.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {account && (
        <QrModal
          isOpen={isQrOpen}
          onClose={() => setIsQrOpen(false)}
          emailAddress={account.address}
        />
      )}

      <ChangeAddressModal
        isOpen={isChangeOpen}
        onClose={() => setIsChangeOpen(false)}
        domains={domains}
        currentAddress={account?.address || ''}
        onConfirm={handleChangeInbox}
      />
    </div>
  );
}
