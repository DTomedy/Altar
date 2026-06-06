'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select } from '@/components/ui';

export function CampaignForm() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'WISHLIST' | 'GOAL'>('WISHLIST');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          goalAmount: goalAmount ? Number(goalAmount) : undefined,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Failed to create campaign');
        return;
      }

      router.push(`/campaigns/${data.id}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [title, description, type, goalAmount, deadline, router]);

  return (
    <>
      {error && (
        <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        <Input
          id="title"
          label="Campaign title"
          type="text"
          placeholder="e.g. Ada's 28th Birthday"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="w-full">
          <label htmlFor="description" className="block font-body text-sm text-body/80 mb-1.5 font-medium">
            Description
          </label>
          <textarea
            id="description"
            className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
            placeholder="Tell your friends what you're celebrating..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <Select
          id="type"
          label="Campaign type"
          value={type}
          onChange={(e) => setType(e.target.value as 'WISHLIST' | 'GOAL')}
        >
          <option value="WISHLIST">Birthday Wishlist</option>
          <option value="GOAL">Goal Fundraiser</option>
        </Select>

        {type === 'GOAL' && (
          <>
            <Input
              id="goalAmount"
              label="Goal amount (₦)"
              type="number"
              placeholder="50000"
              min="500"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              required
            />
            <Input
              id="deadline"
              label="Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </>
        )}

        <Button type="submit" isLoading={loading}>
          Create campaign
        </Button>
      </form>
    </>
  );
}
