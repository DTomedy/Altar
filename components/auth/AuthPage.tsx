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
  const errorParam = searchParams.get('error');

  return (
    <div className="bg-surface rounded-2xl p-6 sm:p-8">
      {mode === 'login' && (
        <>
          <h1 className="font-display font-medium text-2xl text-body mb-1 text-center">Welcome back</h1>
          <p className="font-body text-sm text-body/80 mb-6 text-center">Sign in to manage your campaigns and wallet.</p>

          {verified && (
            <div className="bg-success/10 text-success font-body text-sm px-4 py-3 rounded-xl mb-4">
              Email verified successfully. You can now log in.
            </div>
          )}

          {errorParam === 'verify_email' && (
            <div className="bg-petal text-primary font-body text-sm px-4 py-3 rounded-xl mb-4">
              Please verify your email before accessing the dashboard. Check your inbox for the verification link.
            </div>
          )}

          <LoginForm onForgotPassword={() => setMode('forgot-password')} />

          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="font-body text-sm text-body/80">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer transition-colors"
              >
                Create one
              </button>
            </p>
          </div>
        </>
      )}

      {mode === 'register' && (
        <>
          <h1 className="font-display font-medium text-2xl text-body mb-1 text-center">Create your account</h1>
          <p className="font-body text-sm text-body/80 mb-6 text-center">Set up your profile to start celebrating.</p>
          <RegisterForm />
          <p className="mt-6 font-body text-sm text-body/80 text-center">
            Already have an account?{' '}
            <button
              onClick={() => setMode('login')}
              className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover cursor-pointer transition-colors"
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
