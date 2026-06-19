'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface ShareButtonProps {
  url: string;
  title: string;
  label?: string;
}

export function ShareButton({ url, title, label = 'Share' }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center font-body font-medium px-6 py-2.5 rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 cursor-pointer shrink-0 bg-transparent text-primary border border-primary hover:bg-ghost focus-visible:ring-primary/40"
      >
        <Share2 className="w-5 h-5 mr-2" />
        {label}
      </button>

      <ShareModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        url={url}
      />
    </>
  );
}
