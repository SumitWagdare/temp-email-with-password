'use client';

import React, { useState } from 'react';
import { X, Edit3, Shuffle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface ChangeAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  domains: string[];
  currentAddress: string;
  onConfirm: (newUsername: string, newDomain: string) => Promise<void>;
}

export function ChangeAddressModal({
  isOpen,
  onClose,
  domains,
  currentAddress,
  onConfirm,
}: ChangeAddressModalProps) {
  const currentUsername = currentAddress.split('@')[0] || '';
  const currentDom = currentAddress.split('@')[1] || domains[0] || '';

  const [username, setUsername] = useState(currentUsername);
  const [selectedDomain, setSelectedDomain] = useState(currentDom);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerateRandom = () => {
    const randomUser = `user_${Math.random().toString(36).substring(2, 9)}`;
    setUsername(randomUser);
    if (domains.length > 0) {
      setSelectedDomain(domains[Math.floor(Math.random() * domains.length)]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedUser = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');

    if (!cleanedUser) {
      toast.error('Username cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(cleanedUser, selectedDomain);
      toast.success(`Created inbox: ${cleanedUser}@${selectedDomain}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create custom inbox');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center text-accent mb-2">
            <Edit3 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Change Address</h3>
          <p className="text-xs text-slate-400">Specify a custom username or choose a different domain</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Username (Local Part)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. privacy_user"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono font-semibold text-slate-100 focus:outline-none focus:border-accent"
              />
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/50"
                title="Random Username"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Domain Name</label>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-mono font-semibold text-slate-100 focus:outline-none focus:border-accent"
            >
              {domains.map((dom) => (
                <option key={dom} value={dom}>
                  @{dom}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-xs hover:bg-accent-glow flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>{loading ? 'Creating...' : 'Confirm Swap'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
