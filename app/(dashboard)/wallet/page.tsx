import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui';
import { formatNaira, formatDate } from '@/lib/formatters';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

async function getWalletData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { kycLevel: true, kycStatus: true },
  });

  if (!user) return null;

  const wallet = await prisma.wallet.findUnique({
    where: { userId: payload.userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  return { wallet, kycLevel: user.kycLevel, kycStatus: user.kycStatus };
}

export default async function WalletPage() {
  const data = await getWalletData();

  if (!data) {
    redirect('/auth');
  }

  const { wallet, kycLevel } = data;

  const canWithdraw = kycLevel >= 2;

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Wallet</h1>
      <p className="font-body text-sm text-body/60 mb-8">Manage your contributions and withdrawals.</p>

      {/* Balance card */}
      <div className="bg-primary text-white rounded-2xl p-6 mb-8">
        <p className="font-body text-sm text-white/70 mb-1">Available balance</p>
        <p className="font-mono font-medium text-3xl mb-4">
          {wallet ? formatNaira(wallet.balance) : '₦0.00'}
        </p>
        {canWithdraw ? (
          <Button variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Withdraw funds
          </Button>
        ) : (
          <p className="font-body text-xs text-white/60">
            Complete KYC verification to withdraw funds.
          </p>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="font-display font-medium text-lg text-body mb-4">Transaction history</h2>

        {!wallet || wallet.transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-default rounded-2xl">
            <p className="font-body text-sm text-body/60">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-default rounded-2xl divide-y divide-border-soft">
            {wallet.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'CREDIT' ? 'bg-success/10' : 'bg-error/10'
                    }`}
                  >
                    {tx.type === 'CREDIT' ? (
                      <ArrowDownLeft className={`w-4 h-4 ${tx.type === 'CREDIT' ? 'text-success' : 'text-error'}`} />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-error" />
                    )}
                  </div>
                  <div>
                    <p className="font-body text-sm text-body">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="font-body text-xs text-muted">{formatDate(tx.createdAt)}</p>
                      {tx.status === 'PENDING' && (
                        <span className="inline-flex items-center font-body font-medium text-xs px-2 py-0.5 rounded-full bg-petal text-primary">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p
                  className={`font-mono font-medium text-sm ${
                    tx.type === 'CREDIT' ? 'text-success' : 'text-error'
                  }`}
                >
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatNaira(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
