'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Plus, Share2 } from 'lucide-react';

const STEPS = [
  {
    icon: Gift,
    title: 'Welcome to Altar',
    description:
      'Give with intention. Create celebration campaigns, share a single link, and receive gifts from friends and family — all in one place.',
  },
  {
    icon: Plus,
    title: 'Create a campaign',
    description:
      'Start a birthday wishlist with specific items or set up a goal fundraiser. Add a cover photo, write a description, and get a unique link to share.',
  },
  {
    icon: Share2,
    title: 'Share & receive',
    description:
      'Share your campaign link on WhatsApp or anywhere. Friends contribute directly, and gifts go straight into your Altar wallet — withdraw to your bank anytime.',
  },
];

export function OnboardingTour() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/onboarding', { method: 'POST' });
    } catch {
      /* ignore */
    } finally {
      setDismissed(true);
      router.refresh();
    }
  }, [router]);

  if (dismissed) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative bg-surface border border-border-soft rounded-2xl w-full max-w-md p-6 shadow-lg">
        {/* Skip link — always available */}
        <button
          onClick={handleComplete}
          className="absolute top-4 right-4 font-body text-sm text-muted hover:text-body transition-colors"
        >
          Skip
        </button>

        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-ghost flex items-center justify-center mx-auto mb-5">
          <Icon className="w-7 h-7 text-primary" />
        </div>

        {/* Step indicator */}
        <p className="font-body text-xs text-muted text-center mb-2">
          Step {step + 1} of {STEPS.length}
        </p>

        {/* Title */}
        <h2 className="font-display font-medium text-xl text-body text-center mb-2">
          {current.title}
        </h2>

        {/* Description */}
        <p className="font-body text-sm text-body/60 text-center mb-6 max-w-sm mx-auto">
          {current.description}
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-primary' : 'bg-surface-muted'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isFirst ? (
            <button
              onClick={handleComplete}
              className="flex-1 bg-transparent text-primary border border-primary font-body font-medium px-6 py-2.5 rounded-full hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
            >
              Skip
            </button>
          ) : (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 bg-transparent text-primary border border-primary font-body font-medium px-6 py-2.5 rounded-full hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
            >
              Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Finishing...' : 'Get started'}
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
