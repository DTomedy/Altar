'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Circle, CheckCircle2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

type FieldErrors = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

type PasswordCheck = {
  label: string;
  test: (v: string) => boolean;
};

const passwordChecks: PasswordCheck[] = [
  { label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { label: 'At least 1 uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'At least 1 lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'At least 1 special character (e.g. !@#$%^&*)', test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];

function validateName(value: string): string | undefined {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Full name must be at least 2 characters';
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required';
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
}

function validatePhone(value: string): string | undefined {
  if (!value.trim()) return 'Phone number is required';
  if (!/^\+234\d{10}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid Nigerian number (e.g. +2348012345678)';
}

function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (!passwordChecks.every((c) => c.test(value))) return 'Password does not meet all requirements';
}

export function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const validateField = useCallback((field: string, value: string) => {
    switch (field) {
      case 'name': return validateName(value);
      case 'email': return validateEmail(value);
      case 'phone': return validatePhone(value);
      case 'password': return validatePassword(value);
    }
  }, []);

  const handleBlur = useCallback((field: string, value: string) => {
    setTouched((prev) => new Set(prev).add(field));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  }, [validateField]);

  const handleChange = useCallback((field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched.has(field)) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }, [touched, validateField]);

  const passwordAllMet = useMemo(() => passwordChecks.every((c) => c.test(password)), [password]);

  const isFormValid = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      emailRegex.test(email) &&
      /^\+234\d{10}$/.test(phone.replace(/\s/g, '')) &&
      passwordAllMet &&
      termsAccepted
    );
  }, [name, email, phone, passwordAllMet, termsAccepted]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

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

      setRegistered(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [name, email, phone, password, isFormValid]);

  return (
    <>
      {registered ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display font-semibold text-xl text-body mb-2">Check your email</h2>
          <p className="font-body text-sm text-body/60 max-w-sm mx-auto">
            We sent a verification link to <strong className="text-body">{email}</strong>. Click the link to activate your account and access the dashboard.
          </p>
        </div>
      ) : (
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
          onChange={(e) => handleChange('name', e.target.value, setName)}
          onBlur={() => handleBlur('name', name)}
          error={touched.has('name') ? errors.name : undefined}
          required
          autoComplete="name"
        />
        <Input
          id="email"
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => handleChange('email', e.target.value, setEmail)}
          onBlur={() => handleBlur('email', email)}
          error={touched.has('email') ? errors.email : undefined}
          required
          autoComplete="email"
        />
        <Input
          id="phone"
          label="Phone number"
          type="tel"
          placeholder="+234 801 234 5678"
          value={phone}
          onChange={(e) => handleChange('phone', e.target.value, setPhone)}
          onBlur={() => handleBlur('phone', phone)}
          error={touched.has('phone') ? errors.phone : undefined}
          required
          autoComplete="tel"
        />
        <div>
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => handleChange('password', e.target.value, setPassword)}
            onBlur={() => handleBlur('password', password)}
            error={touched.has('password') ? errors.password : undefined}
            required
            autoComplete="new-password"
          />
          {password.length > 0 && !passwordAllMet && (
            <div className="mt-3 space-y-1.5">
              {passwordChecks.map((check, index) => {
                const met = check.test(password);
                return (
                  <div
                    key={index}
                    className="flex items-center gap-2 transition-all duration-300"
                  >
                    {met ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0 transition-all duration-300" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted shrink-0 transition-all duration-300" />
                    )}
                    <span
                      className={cn(
                        'font-body text-xs transition-all duration-300',
                        met ? 'text-success' : 'text-body/60'
                      )}
                    >
                      {check.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border-soft text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shrink-0"
          />
          <span className="font-body text-xs text-body/70 leading-relaxed">
            I have read, understood and I agree to Altar{' '}
            <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary-hover transition-colors">
              Terms and conditions
            </Link>
            , and{' '}
            <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary-hover transition-colors">
              Privacy policy
            </Link>
            .
          </span>
        </label>

        <Button
          type="submit"
          isLoading={loading}
          disabled={!isFormValid}
          className="w-full"
        >
          Create account
        </Button>
      </form>
        </>
      )}
    </>
  );
}
