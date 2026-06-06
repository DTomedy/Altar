'use client';

import { useState, useCallback } from 'react';
import { Button, Input } from '@/components/ui';

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Something went wrong');
        return;
      }

      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="font-display font-medium text-2xl text-body mb-2">Check your email</h1>
        <p className="font-body text-sm text-body/60 mb-6">
          If an account with that email exists, we&apos;ve sent a password reset link.
        </p>
        <button
          onClick={onBackToLogin}
          className="text-primary font-body font-medium underline underline-offset-2 hover:text-primary-hover transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Forgot password</h1>
      <p className="font-body text-sm text-body/60 mb-6">Enter your email and we&apos;ll send you a reset link.</p>

      {error && (
        <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" isLoading={loading} className="w-full">
          Send reset link
        </Button>
      </form>

      <p className="mt-6 font-body text-sm text-body/60 text-center">
        Remember your password?{' '}
        <button
          onClick={onBackToLogin}
          className="text-primary font-medium underline underline-offset-2 hover:text-primary-hover transition-colors"
        >
          Sign in
        </button>
      </p>
    </>
  );
}
