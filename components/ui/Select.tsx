import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, id, children, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block font-body text-sm text-body/80 mb-1.5 font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full border rounded-xl px-4 py-3 font-body text-body bg-white transition-colors focus:outline-none focus:ring-2 disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed',
            error
              ? 'border-error focus:ring-error/20 focus:border-error'
              : 'border-border-soft focus:ring-primary/20 focus:border-primary',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-error text-sm mt-1 font-body">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
