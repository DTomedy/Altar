import React from 'react';

export interface ProgressBarProps {
  value: number; // percentage (0 - 100)
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(value, 100));
  
  return (
    <div className="w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-primary rounded-full h-1.5 transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
