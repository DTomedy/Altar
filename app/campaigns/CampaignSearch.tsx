'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, SearchX } from 'lucide-react';
import { CampaignCard } from '@/components/landing/CampaignCard';

interface CampaignData {
  slug: string;
  title: string;
  description: string;
  coverPhoto: string | null;
  goalAmount: number | null;
  totalRaised: number;
  donorCount: number;
}

export function CampaignSearch({ campaigns }: { campaigns: CampaignData[] }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debouncedQuery.trim()) return campaigns;
    const q = debouncedQuery.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [campaigns, debouncedQuery]);

  function handleClear() {
    setQuery('');
    setDebouncedQuery('');
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
        <h1
          className="font-heading font-medium text-body"
          style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
        >
          All Campaigns
        </h1>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-body/40 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full border border-border-soft rounded-xl pl-12 pr-10 py-3 font-body text-body bg-white transition-colors outline-none focus:outline-1 focus:outline-primary placeholder:text-body/40"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-body/40 hover:text-body transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {debouncedQuery && (
        <p className="font-body text-sm text-body/70 mb-6">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{debouncedQuery}&rdquo;
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-ghost flex items-center justify-center mb-4">
            <SearchX className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display font-medium text-xl text-body mb-2">No campaigns found</h3>
          <p className="font-body text-sm text-body/70 max-w-sm">
            {debouncedQuery
              ? `We couldn't find any campaigns matching "${debouncedQuery}". Try a different search term.`
              : 'There are no active campaigns right now. Check back later.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign.slug}
              slug={campaign.slug}
              title={campaign.title}
              coverPhoto={campaign.coverPhoto}
              goalAmount={campaign.goalAmount}
              totalRaised={campaign.totalRaised}
              donorCount={campaign.donorCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
