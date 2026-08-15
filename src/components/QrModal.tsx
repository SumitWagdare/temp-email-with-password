'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailAddress: string;
}

export function QrModal({ isOpen, onClose, emailAddress }: QrModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-sm glass-panel rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-6 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close QR Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto text-accent mb-2">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Scan QR Code</h3>
          <p className="text-xs text-slate-400">Scan to open or transfer address to your mobile phone</p>
        </div>

        {/* QR Code Graphic Container */}
        <div className="p-4 bg-white rounded-2xl flex items-center justify-center shadow-inner mx-auto w-fit">
          <QRCodeSVG value={emailAddress} size={180} level="M" includeMargin={false} />
        </div>

        {/* Address Display & Copy */}
        <div className="space-y-3">
          <p className="font-mono text-xs text-slate-300 font-semibold bg-slate-900/90 py-2 px-3 rounded-lg border border-slate-800 break-all select-all">
            {emailAddress}
          </p>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-xl bg-accent text-slate-950 font-bold hover:bg-accent-glow transition-all flex items-center justify-center gap-2 text-xs"
          >
            {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied!' : 'Copy Email Address'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
