'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CampaignActionsProps {
  campaignId: string;
  campaignStatus: string;
}

export function CampaignActions({ campaignId, campaignStatus }: CampaignActionsProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [endLoading, setEndLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleEndCampaign = useCallback(async () => {
    setEndLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'PATCH' });
      if (!res.ok) return;
      setEndOpen(false);
      setMenuOpen(false);
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setEndLoading(false);
    }
  }, [campaignId, router]);

  const handleDeleteCampaign = useCallback(async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { method: 'DELETE' });
      if (!res.ok) return;
      setDeleteOpen(false);
      setMenuOpen(false);
      router.refresh();
    } catch {
      /* ignore */
    } finally {
      setDeleteLoading(false);
    }
  }, [campaignId, router]);

  const isActive = campaignStatus === 'ACTIVE';

  return (
    <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="p-1 rounded-full hover:bg-ghost transition-colors text-body/40 hover:text-body"
        aria-label="Campaign actions"
        type="button"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border-soft rounded-xl shadow-lg py-1 min-w-[170px] z-10">
          {isActive && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                setEndOpen(true);
              }}
              className="w-full text-left font-body text-sm text-body px-4 py-2 hover:bg-ghost transition-colors"
              type="button"
            >
              End Campaign
            </button>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className="w-full text-left font-body text-sm text-error px-4 py-2 hover:bg-error/5 transition-colors"
            type="button"
          >
            Delete
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEndCampaign}
        title="End campaign?"
        message="This will stop receiving contributions for this campaign. You can still view the campaign page."
        confirmLabel="End campaign"
        loading={endLoading}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteCampaign}
        title="Delete campaign?"
        message="This campaign will be permanently deleted and won't be accessible by anyone. This action cannot be undone."
        confirmLabel="Delete campaign"
        variant="destructive"
        loading={deleteLoading}
      />
    </div>
  );
}
