'use client';

import { ArrowLeft } from 'lucide-react';

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="inline-flex items-center font-body text-sm text-body/70 hover:text-body transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg"
    >
      <ArrowLeft className="w-4 h-4 mr-1.5" />
      Back
    </button>
  );
}
