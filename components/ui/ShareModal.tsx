'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Link as LinkIcon, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

const WA_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path
      d="M12 2C6.477 2 2 6.477 2 12c0 2.136.66 4.12 1.788 5.76L2 22l4.32-1.768A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.18 8.18 0 01-4.2-1.2l-.3-.18-2.58 1.06 1.08-2.52-.2-.32A8.14 8.14 0 013.818 12c0-4.5 3.682-8.182 8.182-8.182s8.182 3.682 8.182 8.182-3.682 8.182-8.182 8.182z"
      fill="#25D366"
    />
    <path
      d="M16.91 13.645c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.41-1.49-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.6-.48-.5-.67-.51-.17-.01-.37-.02-.57-.02-.2 0-.53.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.11 3.22 5.11 4.52.72.31 1.28.49 1.71.62.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.3-.2-.6-.35z"
      fill="#25D366"
    />
  </svg>
);

const FB_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

const X_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
    <path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill="#000000"
    />
  </svg>
);

const COPY_ICON = <LinkIcon className="w-6 h-6" />;
const CHECK_ICON = <Check className="w-6 h-6" />;

export function ShareModal({ isOpen, onClose, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
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
  }, [url]);

  const handleShare = useCallback((shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, []);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      id: 'copy',
      label: 'Copy link',
      icon: copied ? CHECK_ICON : COPY_ICON,
      color: 'text-primary',
      bgColor: 'bg-ghost',
      hoverBg: 'hover:bg-petal',
      onClick: handleCopy,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: WA_ICON,
      color: 'text-[#25D366]',
      bgColor: 'bg-[#25D366]/10',
      hoverBg: 'hover:bg-[#25D366]/20',
      onClick: () => handleShare(`https://wa.me/?text=${encodedTitle}%20-%20${encodedUrl}`),
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: FB_ICON,
      color: 'text-[#1877F2]',
      bgColor: 'bg-[#1877F2]/10',
      hoverBg: 'hover:bg-[#1877F2]/20',
      onClick: () => handleShare(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      id: 'x',
      label: 'X',
      icon: X_ICON,
      color: 'text-body',
      bgColor: 'bg-ghost',
      hoverBg: 'hover:bg-petal',
      onClick: () =>
        handleShare(
          `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}%20on%20Altar%20-%20Give%20with%20intention.`
        ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />

      <div className="relative bg-surface border border-border-soft rounded-2xl w-full max-w-sm p-6 shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-ghost transition-colors text-body"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-display font-medium text-xl text-body mb-1 pr-8">{title}</h2>
        <p className="font-body text-sm text-body/70 mb-6">
          Support this campaign by sharing it to friends and family!
        </p>

        <div className="grid grid-cols-4 gap-3">
          {shareLinks.map((option) => (
            <button
              key={option.id}
              onClick={option.onClick}
              className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${option.bgColor} ${option.hoverBg} transition-colors ${option.color}`}
              >
                {option.icon}
              </div>
              <span className="font-body text-xs text-body/70 text-center leading-tight">
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
