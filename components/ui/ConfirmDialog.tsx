'use client';

import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'primary' | 'destructive';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border-soft rounded-2xl w-full max-w-sm p-6 shadow-lg text-center">
        {variant === 'destructive' && (
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-error" />
          </div>
        )}

        <h2 className="font-display font-medium text-xl text-body mb-2">{title}</h2>
        <p className="font-body text-sm text-body/60 mb-6">{message}</p>

        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={
              variant === 'destructive'
                ? 'w-full bg-error text-white font-body font-medium px-6 py-2.5 rounded-full hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed'
                : 'w-full bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            }
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full bg-transparent text-primary border border-primary font-body font-medium px-6 py-2.5 rounded-full hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-ghost transition-colors text-body"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
