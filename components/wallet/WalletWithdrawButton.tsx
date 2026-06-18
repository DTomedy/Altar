'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { WithdrawDialog } from './WithdrawDialog';

interface WalletWithdrawButtonProps {
  canWithdraw: boolean;
}

export function WalletWithdrawButton({ canWithdraw }: WalletWithdrawButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!canWithdraw) {
    return (
      <p className="font-body text-xs text-white/60">Complete KYC to withdraw</p>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        onClick={() => setDialogOpen(true)}
      >
        Withdraw funds
      </Button>
      <WithdrawDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
