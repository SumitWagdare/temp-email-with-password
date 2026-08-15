'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: 'Is NoTrace completely free and open-source?',
    answer:
      'Yes. NoTrace is 100% free and open source with zero hidden paywalls, subscriptions, or paid API keys. All core services leverage open public keyless infrastructure.',
  },
  {
    question: 'Are my temporary emails or generated passwords stored on a server database?',
    answer:
      'Never. NoTrace has zero backend databases. Passwords are generated exclusively on your client device using window.crypto.getRandomValues(). Disposable email credentials exist solely in your browser memory and sessionStorage.',
  },
  {
    question: 'What happens when I close my browser tab or window?',
    answer:
      'Closing your tab or window automatically purges your ephemeral email session. No trace of your session remains anywhere on the web or on your local system.',
  },
  {
    question: 'How is password entropy calculated?',
    answer:
      'Password entropy is measured in bit-length using Shannon entropy formula: H = L × log2(PoolSize), where L is the length and PoolSize is the active character set. Ratings range from Weak (<40 bits) up to Ultra-Secure (>100 bits).',
  },
  {
    question: 'What happens if the primary mail provider is rate-limited?',
    answer:
      'NoTrace includes an automated Provider Strategy abstraction layer. If the primary mail.tm provider encounters rate limits or network issues, requests automatically fallback to 1secmail transparently.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-bold text-slate-100">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggle(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-200 hover:text-white"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-accent shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-sm text-slate-400 border-t border-slate-800/60 pt-3 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
