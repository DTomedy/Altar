'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Check, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = useCallback((title: string, description?: string) => {
    toast('success', title, description);
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    toast('error', title, description);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {/* Toast container in top-right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto bg-surface border border-border-soft rounded-2xl p-4 shadow-lg flex items-start gap-3 animate-slide-in w-full transition-all duration-300'
            )}
          >
            {/* Icon */}
            {t.type === 'success' ? (
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-success" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-error" />
              </div>
            )}
            
            {/* Message content */}
            <div className="flex-1">
              <p className="font-body font-medium text-sm text-body">{t.title}</p>
              {t.description && (
                <p className="font-body text-xs text-muted mt-0.5">{t.description}</p>
              )}
            </div>
            
            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-0.5 rounded-full hover:bg-ghost shrink-0 -mr-1 -mt-1 text-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
