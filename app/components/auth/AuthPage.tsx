'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

type AuthMode = 'login' | 'register' | 'forgot-password';

export function AuthPage() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const verified = searchParams.get('verified') === 'true';

  return (
    <div className="bg-surface border border-border-soft rounded-2xl p-6 sm:p-8">
      {mode === 'login' && (
        <>
          <h1 className="font-display font-medium text-2xl text-body mb-1">Welcome back</h1>
          <p className="font-body text-sm text-body/60 mb-6">Sign in to manage your campaigns and wallet.</p>

          {verified && (
            <div className="bg-success/10 text-success font-body text-sm px-4 py-3 rounded-xl mb-4">
              Email verified successfully. You can now log in.
            </div>
          )}

          <LoginForm />

          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={() => setMode('forgot-password')}
              className="font-body text-sm text-primary underline underline-offset-2 hover:text-primary-hover transition-colors"
            >
              Forgot your password?
            </button>
            <p className="font-body text-sm text-body/60">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover transition-colors"
              >
                Create one
              </button>
            </p>
          </div>
        </>
      )}

      {mode === 'register' && (
        <>
          <h1 className="font-display font-medium text-2xl text-body mb-1">Create your account</h1>
          <p className="font-body text-sm text-body/60 mb-6">Join Altar and start celebrating with intention.</p>
          <RegisterForm />
          <p className="mt-6 font-body text-sm text-body/60 text-center">
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover transition-colors"
            >
              Sign in
            </button>
          </p>
        </>
      )}

      {mode === 'forgot-password' && (
        <ForgotPasswordForm onBackToLogin={() => setMode('login')} />
      )}
    </div>
  );
}
