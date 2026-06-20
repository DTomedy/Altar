'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export function CampaignSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') || '';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get('q') as string;
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    router.push(`/campaigns${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-body/40" />
      <input
        name="q"
        defaultValue={currentQuery}
        placeholder="Search campaigns..."
        className="w-full border border-border-soft rounded-xl pl-12 pr-4 py-3 font-body text-body bg-white transition-colors outline-none focus:outline-1 focus:outline-primary placeholder:text-body/40"
      />
    </form>
  );
}
