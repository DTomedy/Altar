'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error?.message || 'Registration failed');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, email, phone, password, router]);

  return (
    <>
      {error && (
        <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="name"
          label="Full name"
          type="text"
          placeholder="Ada Obi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
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
        <Input
          id="phone"
          label="Phone number"
          type="tel"
          placeholder="+234 801 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoComplete="tel"
        />
        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <Button type="submit" isLoading={loading} className="w-full">
          Create account
        </Button>
      </form>
    </>
  );
}
