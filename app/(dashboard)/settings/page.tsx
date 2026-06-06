import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui';
import { formatDate } from '@/lib/formatters';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      name: true,
      email: true,
      phone: true,
      emailVerified: true,
      kycLevel: true,
      kycStatus: true,
      bankAccountNumber: true,
      bankCode: true,
      bankName: true,
      bankAccountName: true,
      createdAt: true,
    },
  });

  return user;
}

export default async function SettingsPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Settings</h1>
      <p className="font-body text-sm text-body/60 mb-8">Manage your profile and account settings.</p>

      <div className="max-w-lg space-y-8">
        {/* Profile */}
        <section>
          <h2 className="font-display font-medium text-lg text-body mb-4">Profile</h2>
          <div className="bg-surface border border-default rounded-2xl p-5 space-y-4">
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Full name</p>
              <p className="font-body text-sm text-body">{user.name}</p>
            </div>
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-body text-sm text-body">{user.email}</p>
                {user.emailVerified ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="muted">Unverified</Badge>
                )}
              </div>
            </div>
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Phone</p>
              <p className="font-body text-sm text-body">{user.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Member since</p>
              <p className="font-body text-sm text-body">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </section>

        {/* KYC */}
        <section>
          <h2 className="font-display font-medium text-lg text-body mb-4">Verification</h2>
          <div className="bg-surface border border-default rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-body text-sm text-body font-medium">KYC Level {user.kycLevel}</p>
              <Badge
                variant={
                  user.kycStatus === 'VERIFIED'
                    ? 'success'
                    : user.kycStatus === 'REJECTED'
                      ? 'error'
                      : 'muted'
                }
              >
                {user.kycStatus}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-body/60">Email verified</p>
                <span className={`font-body text-sm ${user.emailVerified ? 'text-success' : 'text-body/40'}`}>
                  {user.emailVerified ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-body/60">Phone confirmed</p>
                <span className={`font-body text-sm ${user.phone ? 'text-success' : 'text-body/40'}`}>
                  {user.phone ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-body/60">Government ID</p>
                <span className={`font-body text-sm ${user.kycLevel >= 1 ? 'text-success' : 'text-body/40'}`}>
                  {user.kycLevel >= 1 ? 'Done' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-body text-sm text-body/60">Bank account</p>
                <span className={`font-body text-sm ${user.kycLevel >= 2 ? 'text-success' : 'text-body/40'}`}>
                  {user.kycLevel >= 2 ? 'Done' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bank */}
        {user.bankAccountName && (
          <section>
            <h2 className="font-display font-medium text-lg text-body mb-4">Bank account</h2>
            <div className="bg-surface border border-default rounded-2xl p-5 space-y-4">
              <div>
                <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Account name</p>
                <p className="font-body text-sm text-body">{user.bankAccountName}</p>
              </div>
              <div>
                <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Account number</p>
                <p className="font-mono text-sm text-body">{user.bankAccountNumber}</p>
              </div>
              <div>
                <p className="font-body text-xs text-muted uppercase tracking-wider mb-1">Bank</p>
                <p className="font-body text-sm text-body">{user.bankName}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
