'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block font-body text-sm text-body/80 mb-1.5 font-semibold">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={resolvedType}
            className={cn(
              'w-full border rounded-xl px-4 py-3 font-body text-body bg-white transition-colors outline-none focus:outline-1 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed placeholder:text-body/40',
              isPassword && 'pr-12',
              error
                ? 'border-error'
                : 'border-border-soft focus:outline-primary',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-body/40 hover:text-body transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
        {error && (
          <p className="text-error text-sm mt-1 font-body">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
