import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'petal' | 'flat';
}

export function Card({
  className,
  variant = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 transition-all duration-150',
        variant === 'default' && 'bg-surface border border-gray-200',
        variant === 'petal' && 'bg-petal border border-gray-200',
        variant === 'flat' && 'bg-surface-muted border-none',
        className
      )}
      {...props}
    />
  );
}
