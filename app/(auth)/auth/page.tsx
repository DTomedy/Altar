import { Suspense } from 'react';
import { AuthPage } from '@/components/auth';

export default function AuthRoute() {
  return (
    <Suspense fallback={<div className="font-body text-sm text-body/80">Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}
