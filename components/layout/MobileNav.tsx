'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden flex items-center justify-center w-10 h-10 text-white"
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-primary" />
          <div className="relative flex flex-col h-full px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setOpen(false)}>
                <img src="/logo/Altar Logo_white.svg" alt="Altar" className="h-8 w-auto" />
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-10 h-10 text-white"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex flex-col gap-6 mt-16">
              <Link
                href="/#features"
                onClick={() => setOpen(false)}
                className="font-body text-lg text-white/80 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setOpen(false)}
                className="font-body text-lg text-white/80 hover:text-white transition-colors"
              >
                How it works
              </Link>
              <Link
                href="/campaigns"
                onClick={() => setOpen(false)}
                className="font-body text-lg text-white/80 hover:text-white transition-colors"
              >
                Campaigns
              </Link>
              <hr className="border-white/20 my-2" />
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="font-body text-lg text-white/80 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/auth?mode=register"
                onClick={() => setOpen(false)}
                className="font-body text-lg text-white/80 hover:text-white transition-colors"
              >
                Get started
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
