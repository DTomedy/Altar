'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg';
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}: ModalProps) {
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      
      {/* Panel */}
      <div
        className={cn(
          'relative bg-surface border border-border-soft rounded-2xl w-full p-6 shadow-lg z-10 animate-in fade-in zoom-in-95 duration-150',
          maxWidth === 'md' && 'max-w-md',
          maxWidth === 'lg' && 'max-w-lg'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-display font-medium text-xl text-body">{title}</h2>
          <button
            type="button"
            className="p-1 rounded-full hover:bg-ghost transition-colors -mr-1 -mt-1 text-body"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
