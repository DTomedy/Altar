import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'muted';
}

export function Badge({
  className,
  variant = 'primary',
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full shrink-0',
        variant === 'primary' && 'bg-ghost text-primary',
        variant === 'success' && 'bg-success/10 text-success',
        variant === 'warning' && 'bg-petal text-primary',
        variant === 'error' && 'bg-error/10 text-error',
        variant === 'muted' && 'bg-surface-muted text-muted',
        className
      )}
      {...props}
    />
  );
}
