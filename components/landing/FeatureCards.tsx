'use client';

import { Card } from '@/components/ui';
import { Wallet, MaskHappy, Gift, Smiley } from '@phosphor-icons/react';

export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Card className="p-6 border border-primary">
        <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mb-4">
          <Wallet className="w-6 h-6 text-primary" weight="bold" />
        </div>
        <h3 className="font-display font-semibold text-lg text-body mb-2">In-app wallet</h3>
        <p className="font-body text-sm text-body/60">All contributions are held securely in your Altar wallet. No awkward manual coordination.</p>
      </Card>
      <Card className="p-6 border border-primary">
        <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mb-4">
          <MaskHappy className="w-6 h-6 text-primary" weight="bold" />
        </div>
        <h3 className="font-display font-semibold text-lg text-body mb-2">Anonymous giving</h3>
        <p className="font-body text-sm text-body/60">Contributors can give without revealing their identity. Sometimes the best gifts come from nowhere.</p>
      </Card>
      <Card className="p-6 border border-primary">
        <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mb-4">
          <Gift className="w-6 h-6 text-primary" weight="bold" />
        </div>
        <h3 className="font-display font-semibold text-lg text-body mb-2">Wishlist campaigns</h3>
        <p className="font-body text-sm text-body/60">List exactly what you want. Friends can contribute toward specific items.</p>
      </Card>
      <Card className="p-6 border border-primary">
        <div className="w-12 h-12 rounded-full bg-ghost flex items-center justify-center mb-4">
          <Smiley className="w-6 h-6 text-primary" weight="bold" />
        </div>
        <h3 className="font-display font-semibold text-lg text-body mb-2">No account needed to give</h3>
        <p className="font-body text-sm text-body/60">Anyone with the link can contribute via card, bank transfer, or USSD. No sign-up required.</p>
      </Card>
    </div>
  );
}
