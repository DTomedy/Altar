import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth';

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-center py-8">
        <Link href="/">
          <Image src="/logo/Altar Logo.svg" alt="Altar" width={100} height={28} className="h-7 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl p-6 sm:p-8">
            <Suspense fallback={<div className="font-body text-sm text-body/60">Loading...</div>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
