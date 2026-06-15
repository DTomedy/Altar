'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam === 'expired') {
      setError('expired');
      setChecking(false);
      return;
    }

    if (errorParam || !token) {
      setError('invalid');
      setChecking(false);
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.ok) {
          router.push('/dashboard?verified=true');
        } else {
          const data = await res.json();
          if (data.error?.code === 'UNAUTHORIZED' && data.error?.message?.includes('expired')) {
            setError('expired');
          } else {
            setError('invalid');
          }
          setChecking(false);
        }
      })
      .catch(() => {
        setError('invalid');
        setChecking(false);
      });
  }, [searchParams, router]);

  if (checking) {
    return (
      <div className="bg-surface rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ghost">
          <svg className="h-6 w-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-medium text-body mb-2">Verifying your email...</h1>
        <p className="font-body text-sm text-body/60">Please wait while we confirm your account.</p>
      </div>
    );
  }

  return <VerifyError expired={error === 'expired'} />;
}

function VerifyError({ expired = false }: { expired?: boolean }) {
  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
        <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-medium text-body mb-2">
        Verification {expired ? 'Expired' : 'Failed'}
      </h1>
      <p className="font-body text-sm text-body/60 mb-6">
        {expired
          ? 'This verification link has expired. Please request a new one.'
          : 'This verification link is invalid. Please try again.'}
      </p>
      <Link
        href="/auth?mode=login"
        className="inline-block rounded-full bg-primary px-6 py-2.5 font-body text-sm font-medium text-white"
      >
        Back to login
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ghost">
          <svg className="h-6 w-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-medium text-body mb-2">Verifying your email...</h1>
        <p className="font-body text-sm text-body/60">Please wait while we confirm your account.</p>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
