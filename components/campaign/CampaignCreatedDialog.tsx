'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

interface CampaignCreatedDialogProps {
  id: string;
  slug: string;
}

export function CampaignCreatedDialog({ id, slug }: CampaignCreatedDialogProps) {
  const router = useRouter();

  const [copied, setCopied] = useState(false);

  const campaignUrl = `${window.location.origin}/c/${slug}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [campaignUrl]);

  const handleCancel = useCallback(() => {
    router.push(`/campaigns/${id}`);
  }, [id, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative bg-surface border border-border-soft rounded-2xl w-full max-w-sm p-6 shadow-lg text-center">
        {/* Success icon */}
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-success" />
        </div>

        {/* Title */}
        <h2 className="font-display font-semibold text-xl text-body mb-2">
          Campaign created successfully
        </h2>

        {/* Message */}
        <p className="font-body text-sm text-body/60 mb-6">
          This campaign has been created successfully. You will be able to edit this campaign and republish changes.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="w-full bg-primary text-white font-body font-semibold px-6 py-2.5 rounded-full hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy the link'}
          </button>
          <button
            onClick={handleCancel}
            className="w-full bg-transparent text-primary border border-primary font-body font-semibold px-6 py-2.5 rounded-full hover:bg-ghost focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
