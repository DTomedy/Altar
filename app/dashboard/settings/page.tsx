'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { KycTab } from '@/components/settings/KycTab';
import { PasswordTab } from '@/components/settings/PasswordTab';
import { BankTab } from '@/components/settings/BankTab';

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'verification', label: 'Verification' },
  { id: 'password', label: 'Password' },
  { id: 'bank', label: 'Bank Account' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [user, setUser] = useState<{
    name: string;
    email: string;
    phone: string | null;
    profilePicture: string | null;
    kycLevel: number;
    kycStatus: string;
    emailVerified: boolean;
    bankAccountNumber: string | null;
    bankCode: string | null;
    bankName: string | null;
    bankAccountName: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="font-display font-medium text-2xl text-body mb-1">Settings</h1>
        <p className="font-body text-sm text-body/70 mb-8">Manage your profile and account settings.</p>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-muted rounded-xl w-full max-w-lg" />
          <div className="h-64 bg-surface-muted rounded-2xl w-full max-w-lg" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <h1 className="font-display font-medium text-2xl text-body mb-1">Settings</h1>
        <p className="font-body text-sm text-body/70">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Settings</h1>
      <p className="font-body text-sm text-body/70 mb-8">Manage your profile and account settings.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border-soft overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'font-body font-medium text-sm px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-body/70 hover:text-body hover:border-default'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-lg">
        {activeTab === 'profile' && (
          <ProfileTab
            initialName={user.name}
            initialPhone={user.phone}
            initialEmail={user.email}
            initialProfilePicture={user.profilePicture}
          />
        )}

        {activeTab === 'verification' && (
          <KycTab
            kycLevel={user.kycLevel}
            kycStatus={user.kycStatus}
            emailVerified={user.emailVerified}
            phone={user.phone}
          />
        )}

        {activeTab === 'password' && <PasswordTab />}

        {activeTab === 'bank' && (
          <BankTab
            initialAccountNumber={user.bankAccountNumber}
            initialBankCode={user.bankCode}
            initialBankName={user.bankName}
            initialAccountName={user.bankAccountName}
          />
        )}
      </div>
    </div>
  );
}
