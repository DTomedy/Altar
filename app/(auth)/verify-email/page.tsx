import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token, error } = await searchParams;

  if (error === 'expired') {
    return <VerifyError expired />;
  }

  if (error) {
    return <VerifyError />;
  }

  if (token) {
    redirect(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
  }

  return <VerifyError />;
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
