import React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarProps {
  name?: string;
  imageUrl?: string | null;
  isAnonymous?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({
  name,
  imageUrl,
  isAnonymous = false,
  size = 'md',
  className,
}: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (isAnonymous || (!imageUrl && !name)) {
    return (
      <div
        className={cn(
          'rounded-full bg-ghost flex items-center justify-center shrink-0',
          sizeClasses[size],
          className
        )}
      >
        <User className={cn('text-accent', iconSizes[size])} />
      </div>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'Avatar'}
        className={cn('rounded-full object-cover shrink-0', sizeClasses[size], className)}
      />
    );
  }

  // Extract initials (up to 2 characters)
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'rounded-full bg-ghost flex items-center justify-center font-body font-medium text-primary shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {initials || <User className={cn('text-accent', iconSizes[size])} />}
    </div>
  );
}
