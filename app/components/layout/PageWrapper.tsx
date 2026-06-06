import React from 'react';
import { cn } from '@/lib/utils';

export interface PageWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PageWrapper({ children, className, ...props }: PageWrapperProps) {
  return (
    <main className={cn('flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12', className)} {...props}>
      {children}
    </main>
  );
}
