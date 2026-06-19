'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  url: string;
  label?: string;
}

export function ShareButton({ url, label = 'Share' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center justify-center font-body font-medium px-6 py-2.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 cursor-pointer shrink-0',
        copied
          ? 'bg-success/10 text-success border border-success/30 focus-visible:ring-success/40'
          : 'bg-transparent text-primary border border-primary hover:bg-ghost focus-visible:ring-primary/40'
      )}
    >
      {copied ? (
        <>
          <Check className="w-5 h-5 mr-2" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5 mr-2" />
          {label}
        </>
      )}
    </button>
  );
}
