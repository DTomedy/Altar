'use client';

import React from 'react';
import { Badge } from '@/components/ui';
import { Check, X, AlertCircle } from 'lucide-react';

interface KycTabProps {
  kycLevel: number;
  kycStatus: string;
  emailVerified: boolean;
  phone: string | null;
}

export function KycTab({ kycLevel, kycStatus, emailVerified, phone }: KycTabProps) {
  const steps = [
    { label: 'Email verified', done: emailVerified },
    { label: 'Phone confirmed', done: !!phone },
    { label: 'Government ID', done: kycLevel >= 1 },
    { label: 'Bank account', done: kycLevel >= 2 },
  ];

  const statusBadgeVariant = kycStatus === 'VERIFIED' ? 'success' as const : kycStatus === 'REJECTED' ? 'error' as const : 'muted' as const;
  const statusIcon = kycStatus === 'VERIFIED'
    ? <Check className="w-5 h-5 text-success" />
    : kycStatus === 'REJECTED'
      ? <X className="w-5 h-5 text-error" />
      : <AlertCircle className="w-5 h-5 text-warning" />;

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="bg-surface border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-medium text-lg text-body">KYC Level {kycLevel}</h3>
          <Badge variant={statusBadgeVariant}>{kycStatus}</Badge>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.label} className="flex items-center justify-between py-2">
              <p className="font-body text-sm text-body">{step.label}</p>
              {step.done ? (
                <span className="flex items-center gap-1.5 font-body text-sm text-success">
                  <Check className="w-4 h-4" />
                  Done
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-body text-sm text-body/40">
                  <X className="w-4 h-4" />
                  Pending
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 p-4 bg-ghost border border-gray-200 rounded-2xl">
        {statusIcon}
        <div>
          <p className="font-body font-medium text-sm text-body">
            {kycStatus === 'VERIFIED'
              ? 'You are fully verified'
              : kycStatus === 'REJECTED'
                ? 'Your verification was rejected'
                : 'Verification in progress'}
          </p>
          <p className="font-body text-xs text-body/60 mt-0.5">
            {kycStatus === 'VERIFIED'
              ? 'You can withdraw funds from your wallet.'
              : kycStatus === 'REJECTED'
                ? 'Please contact support for assistance with your verification.'
                : 'Complete all steps above to enable withdrawals from your wallet.'}
          </p>
        </div>
      </div>
    </div>
  );
}
