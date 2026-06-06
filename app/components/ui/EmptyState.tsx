import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  isLoading?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  isLoading = false,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-ghost flex items-center justify-center mb-4 shrink-0">
        <Icon className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-display font-medium text-xl text-body mb-2">{title}</h3>
      <p className="font-body text-sm text-body/60 max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction} isLoading={isLoading}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
