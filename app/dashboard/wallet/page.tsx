import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { formatNaira, formatDateTime } from '@/lib/formatters';
import { WalletWithdrawButton } from '@/components/wallet/WalletWithdrawButton';

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

function shortCode(id: string): string {
  const chars = id.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const a = chars.charAt(3) || 'X';
  const b = chars.charAt(8) || 'X';
  const c = chars.charAt(chars.length - 1) || 'X';
  return `TR-${a}${b}${c}`;
}

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

  const [wallet, contributions, withdrawals] = await Promise.all([
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
    prisma.walletTransaction.findMany({
      where: {
        wallet: { userId: payload.userId },
        type: 'DEBIT',
        status: 'COMPLETED',
      },
      select: { amount: true },
    }),
  ]);

  const totalReceived = contributions
    .filter((c) => c.status === 'SUCCESS')
    .reduce((sum, c) => sum + Number(c.amount), 0);

  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  return { wallet, contributions, totalReceived, totalWithdrawn, kycLevel: user.kycLevel, kycStatus: user.kycStatus };
}

export default async function WalletPage() {
  const data = await getWalletData();

  if (!data) {
    redirect('/auth');
  }

  const { wallet, contributions, totalReceived, totalWithdrawn, kycLevel } = data;
  const canWithdraw = kycLevel >= 2;

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Wallet</h1>
      <p className="font-body text-sm text-body/70 mb-8">Manage your contributions and withdrawals.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-gray-200 rounded-2xl p-5">
          <p className="font-body text-sm text-body/70 mb-1">Total received</p>
          <p className="font-display font-medium text-2xl text-primary">
            {formatNaira(totalReceived)}
          </p>
        </div>

        <div className="bg-primary text-white rounded-2xl p-5">
          <p className="font-body text-sm text-white/70 mb-1">Available balance</p>
          <p className="font-display font-medium text-2xl mb-4">
            {wallet ? formatNaira(wallet.balance) : '₦0.00'}
          </p>
          <WalletWithdrawButton canWithdraw={canWithdraw} />
        </div>

        <div className="bg-surface border border-gray-200 rounded-2xl p-5">
          <p className="font-body text-sm text-body/70 mb-1">Amount withdrawn</p>
          <p className="font-display font-medium text-2xl text-body">
            {formatNaira(totalWithdrawn)}
          </p>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-surface border border-gray-200 rounded-2xl p-5">
        <h3 className="font-display font-medium text-lg text-body mb-4">Transaction history</h3>

        {contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-body text-sm text-body/70">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border-soft">
                    <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                      Transaction
                    </th>
                    <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-right px-5 py-3">
                      Amount
                    </th>
                    <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                      Status
                    </th>
                    <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                      Payer
                    </th>
                    <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                      Date
                    </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-ghost/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-primary font-medium" title={c.flwTxRef}>
                        {shortCode(c.id)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-medium text-sm text-body">
                        {formatNaira(c.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center font-body font-medium text-sm px-2.5 py-1 rounded-full ${
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
                      <span className="font-body text-sm text-body/70">
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
