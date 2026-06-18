import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center font-body font-semibold px-6 py-2.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40',
        variant === 'secondary' && 'bg-transparent text-primary border border-primary hover:bg-ghost focus-visible:ring-primary/40',
        variant === 'ghost' && 'bg-ghost text-primary hover:bg-petal focus-visible:ring-primary/40',
        variant === 'destructive' && 'bg-error text-white hover:opacity-90 focus-visible:ring-error/40',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
}
