'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { CampaignForm } from './CampaignForm';

function ModalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOpen = searchParams.get('create') === '1';

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('create');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-body/40 hover:text-body transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-display font-semibold text-xl text-body mb-5">Create a campaign</h2>
        <CampaignForm />
      </div>
    </div>
  );
}

export function CampaignModal() {
  return (
    <Suspense fallback={null}>
      <ModalInner />
    </Suspense>
  );
}
