'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Something went wrong');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [password, confirmPassword, token]);

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display font-medium text-2xl text-body mb-2">Invalid link</h1>
        <p className="font-body text-sm text-body/60 mb-6">
          This password reset link is invalid or has expired.
        </p>
        <Button onClick={() => router.push('/auth')} className="w-full">
          Back to sign in
        </Button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-display font-medium text-2xl text-body mb-2">Password reset</h1>
        <p className="font-body text-sm text-body/60 mb-6">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Button onClick={() => router.push('/auth')} className="w-full">
          Sign in
        </Button>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Reset your password</h1>
      <p className="font-body text-sm text-body/60 mb-6">Enter your new password below.</p>

      {error && (
        <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="password"
          label="New password"
          type="password"
          placeholder="Enter your new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Input
          id="confirm-password"
          label="Confirm password"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" isLoading={loading} className="w-full">
          Reset password
        </Button>
      </form>
    </>
  );
}
