import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui';
import { formatNaira, formatDateTime } from '@/lib/formatters';

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  SUCCESS: 'Successful',
  FAILED: 'Failed',
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: 'bg-petal text-primary',
  SUCCESS: 'bg-success/10 text-success',
  FAILED: 'bg-error/10 text-error',
};

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

  const [wallet, contributions] = await Promise.all([
    prisma.wallet.findUnique({
      where: { userId: payload.userId },
    }),
    prisma.contribution.findMany({
      where: { campaign: { ownerId: payload.userId } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        flwTxRef: true,
        amount: true,
        status: true,
        displayName: true,
        isAnonymous: true,
        createdAt: true,
        campaign: { select: { title: true } },
      },
    }),
  ]);

  return { wallet, contributions, kycLevel: user.kycLevel, kycStatus: user.kycStatus };
}

export default async function WalletPage() {
  const data = await getWalletData();

  if (!data) {
    redirect('/auth');
  }

  const { wallet, contributions, kycLevel } = data;

  const canWithdraw = kycLevel >= 2;

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Wallet</h1>
      <p className="font-body text-sm text-body/60 mb-8">Manage your contributions and withdrawals.</p>

      {/* Balance card */}
      <div className="bg-primary text-white rounded-2xl p-6 mb-8">
        <p className="font-body text-sm text-white/70 mb-1">Available balance</p>
        <p className="font-display font-medium text-3xl mb-4">
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

      {/* Transactions table */}
      <div>
        <h2 className="font-display font-medium text-lg text-body mb-4">Transaction history</h2>

        {contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-default rounded-2xl">
            <p className="font-body text-sm text-body/60">No transactions yet.</p>
          </div>
        ) : (
          <div className="bg-surface border border-default rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="font-body text-xs text-muted font-medium uppercase tracking-wider text-left px-5 py-3">
                    Transaction ID
                  </th>
                  <th className="font-body text-xs text-muted font-medium uppercase tracking-wider text-right px-5 py-3">
                    Amount
                  </th>
                  <th className="font-body text-xs text-muted font-medium uppercase tracking-wider text-left px-5 py-3">
                    Payment status
                  </th>
                  <th className="font-body text-xs text-muted font-medium uppercase tracking-wider text-left px-5 py-3">
                    Payer name
                  </th>
                  <th className="font-body text-xs text-muted font-medium uppercase tracking-wider text-left px-5 py-3">
                    Date / time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-ghost/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-body" title={c.flwTxRef}>
                        {c.flwTxRef.length > 28
                          ? `${c.flwTxRef.slice(0, 16)}...${c.flwTxRef.slice(-8)}`
                          : c.flwTxRef}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-medium text-sm text-body">
                        {formatNaira(c.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center font-body font-medium text-xs px-2.5 py-1 rounded-full ${
                          STATUS_STYLES[c.status as PaymentStatus]
                        }`}
                      >
                        {STATUS_LABELS[c.status as PaymentStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-body text-sm text-body">
                        {c.isAnonymous ? '—' : c.displayName || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-body text-sm text-muted">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
