'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Calendar, Paperclip, Download, ShieldCheck, Code, FileText } from 'lucide-react';
import { EmailDetail } from '@/lib/email-providers/types';

interface MessageDetailViewProps {
  message: EmailDetail;
  onBack: () => void;
}

export function MessageDetailView({ message, onBack }: MessageDetailViewProps) {
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [sanitizedHtml, setSanitizedHtml] = useState<string>('');

  const rawHtml = message.html && message.html.length > 0 ? message.html[0] : '';

  useEffect(() => {
    if (rawHtml) {
      // Import DOMPurify on the client side only to avoid SSG/SSR jsdom stylesheet lookup errors
      import('dompurify').then((DOMPurify) => {
        setSanitizedHtml(DOMPurify.default.sanitize(rawHtml));
      });
    }
  }, [rawHtml]);

  const formattedDate = new Date(message.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-accent" />
          <span>Back to Inbox</span>
        </button>

        {rawHtml && message.text && (
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('html')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'html'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-accent" />
              <span>HTML</span>
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'text'
                  ? 'bg-slate-800 text-slate-100 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span>Plain Text</span>
            </button>
          </div>
        )}
      </div>

      {/* Message Header Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {message.subject || '(No Subject)'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-accent" />
                <span className="font-semibold text-slate-200">{message.from?.name || 'Unknown'}</span>
                <span className="text-slate-400 font-mono">({message.from?.address || ''})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sanitized View</span>
          </div>
        </div>

        {/* Attachment Bar if present */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Paperclip className="w-4 h-4 text-accent" />
              <span>Attachments ({message.attachments.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-medium text-slate-200 truncate">{att.filename}</p>
                    <p className="text-[10px] text-slate-400">
                      {(att.size / 1024).toFixed(1)} KB &bull; {att.contentType}
                    </p>
                  </div>
                  {att.downloadUrl && (
                    <a
                      href={att.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 text-accent hover:bg-slate-700 transition-colors shrink-0"
                      title="Download Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Content Container */}
        <div className="pt-2">
          {viewMode === 'html' && (sanitizedHtml || rawHtml) ? (
            <div
              className="prose prose-invert max-w-none p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-x-auto text-slate-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml || rawHtml }}
            />
          ) : (
            <pre className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {message.text || message.intro || 'No text content available.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
