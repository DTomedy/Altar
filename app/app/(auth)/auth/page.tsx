import { Suspense } from 'react';
import { AuthPage } from '@/components/auth';

export default function AuthRoute() {
  return (
    <Suspense fallback={<div className="font-body text-sm text-body/60">Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}
