'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button, Input, Select } from '@/components/ui';
import { CampaignCreatedDialog } from './CampaignCreatedDialog';

export function CampaignForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'WISHLIST' | 'GOAL'>('WISHLIST');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPhotoError, setCoverPhotoError] = useState<string | null>(null);
  const [createdCampaign, setCreatedCampaign] = useState<{ id: string; slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCoverPhotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setCoverPhotoError('Image must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setCoverPhotoError('Only image files are allowed');
      return;
    }

    setCoverPhotoError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCoverPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveCoverPhoto = useCallback(() => {
    setCoverPhoto(null);
    setCoverPhotoError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coverPhoto) {
      setCoverPhotoError('Cover image is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          coverPhoto,
          goalAmount: goalAmount ? Number(goalAmount) : undefined,
          deadline: deadline || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Failed to create campaign');
        return;
      }

      setCreatedCampaign({ id: data.id, slug: data.slug });
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [title, description, type, coverPhoto, goalAmount, deadline]);

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

        {/* Cover image */}
        <div className="w-full">
          <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">
            Cover image
          </label>
          {coverPhoto ? (
            <div className="relative rounded-xl overflow-hidden">
              <Image
                src={coverPhoto}
                alt="Cover preview"
                width={1200}
                height={600}
                className="w-full h-48 object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveCoverPhoto}
                className="absolute top-2 right-2 bg-white/80 hover:bg-white text-body text-xs font-body px-3 py-1.5 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border-soft rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface-muted/30">
              <div className="flex flex-col items-center gap-1">
                <span className="font-body text-sm text-body/60">Click to upload</span>
                <span className="font-body text-xs text-body/40">PNG or JPG, max 2MB</span>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleCoverPhotoChange}
              />
            </label>
          )}
          {coverPhotoError && (
            <p className="text-error text-sm mt-1 font-body">{coverPhotoError}</p>
          )}
        </div>

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

      {createdCampaign && (
        <CampaignCreatedDialog id={createdCampaign.id} slug={createdCampaign.slug} />
      )}
    </>
  );
}
