'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Gift, Target, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { CampaignCreatedDialog } from './CampaignCreatedDialog';

interface GiftItem {
  name: string;
  amount: string;
}

export function CampaignForm() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'WISHLIST' | 'GOAL' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [birthdayDate, setBirthdayDate] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [coverPhotoError, setCoverPhotoError] = useState<string | null>(null);
  const [items, setItems] = useState<GiftItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<{ id: string; slug: string } | null>(null);

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

  const handleContinue = useCallback(() => {
    if (type) setStep(2);
  }, [type]);

  const handleBack = useCallback(() => {
    setStep(1);
  }, []);

  const handleAddItem = useCallback(() => {
    setItems((prev) => [...prev, { name: '', amount: '' }]);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemChange = useCallback((index: number, field: 'name' | 'amount', value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!coverPhoto) {
      setCoverPhotoError('Cover image is required');
      return;
    }

    if (type === 'WISHLIST' && items.length === 0) {
      setError('Add at least one gift item');
      return;
    }

    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        title,
        description,
        type,
        coverPhoto,
      };

      if (type === 'GOAL') {
        body.goalAmount = goalAmount ? Number(goalAmount) : undefined;
        body.deadline = deadline || undefined;
      }

      if (type === 'WISHLIST') {
        body.items = items
          .filter((item) => item.name.trim() && item.amount)
          .map((item) => ({
            name: item.name.trim(),
            targetAmount: Number(item.amount),
          }));
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
  }, [title, description, type, coverPhoto, goalAmount, deadline, items]);

  return (
    <>
      {error && (
        <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-medium ${
            step >= 1 ? 'bg-primary text-white' : 'bg-surface-muted text-muted'
          }`}
        >
          1
        </div>
        <div className="w-8 h-0.5 rounded-full bg-border-soft" />
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-body text-sm font-medium ${
            step >= 2 ? 'bg-primary text-white' : 'bg-surface-muted text-muted'
          }`}
        >
          2
        </div>
      </div>

      {step === 1 ? (
        /* Step 1 — Campaign Type Selection */
        <div>
          <h3 className="font-display font-medium text-lg text-body mb-1">What kind of campaign?</h3>
          <p className="font-body text-sm text-body/60 mb-5">
            Choose the type that fits your celebration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setType('WISHLIST')}
              className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                type === 'WISHLIST'
                  ? 'border-primary bg-primary/5'
                  : 'border-border-soft bg-surface hover:border-primary/50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-petal flex items-center justify-center mb-3">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-medium text-base text-body mb-1">Birthday Wishlist</h4>
              <p className="font-body text-sm text-body/60">Share gifts you&apos;d love to receive</p>
            </button>

            <button
              type="button"
              onClick={() => setType('GOAL')}
              className={`text-left p-5 rounded-2xl border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                type === 'GOAL'
                  ? 'border-primary bg-primary/5'
                  : 'border-border-soft bg-surface hover:border-primary/50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-petal flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-display font-medium text-base text-body mb-1">Goal Fundraiser</h4>
              <p className="font-body text-sm text-body/60">Raise money for a specific goal</p>
            </button>
          </div>

          <Button type="button" onClick={handleContinue} disabled={!type} className="w-full">
            Continue
          </Button>
        </div>
      ) : (
        /* Step 2 — Form */
        <div>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 text-body/60 hover:text-body font-body text-sm mb-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="title"
              label="Campaign title"
              type="text"
              placeholder="e.g. Ada&apos;s 28th Birthday"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            {type === 'WISHLIST' && (
              <Input
                id="birthdayDate"
                label="Birthday date"
                type="date"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
                required
              />
            )}

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

            {type === 'WISHLIST' && (
              <div className="w-full">
                <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">
                  Gift items
                </label>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <input
                        type="text"
                        placeholder="Gift name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        className="flex-1 border border-border-soft rounded-xl px-4 py-3 font-body text-sm text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
                        required
                      />
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm text-body/40">
                          ₦
                        </span>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                          className="w-full border border-border-soft rounded-xl pl-7 pr-4 py-3 font-body text-sm text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
                          min="1"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-3 rounded-xl text-body/40 hover:text-error hover:bg-error/10 transition-colors mt-0.5"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="mt-3 flex items-center gap-2 text-primary font-body text-sm font-medium hover:text-primary-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg px-1"
                >
                  <Plus className="w-4 h-4" />
                  Add item
                </button>
                {items.length === 0 && (
                  <p className="text-body/40 text-xs font-body mt-1">Add at least one gift item</p>
                )}
              </div>
            )}

            <Button type="submit" isLoading={loading}>
              Create campaign
            </Button>
          </form>
        </div>
      )}

      {createdCampaign && (
        <CampaignCreatedDialog id={createdCampaign.id} slug={createdCampaign.slug} />
      )}
    </>
  );
}
