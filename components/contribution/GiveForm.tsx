'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gift, Check, AlertCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNaira } from '@/lib/formatters';

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000];
const FLW_SCRIPT_URL = 'https://checkout.flutterwave.com/v3.js';

interface GiveFormProps {
  campaignId: string;
  campaignTitle: string;
  wishlistItemId?: string;
  minAmount?: number;
  maxAmount?: number;
}

type FlwStatus = 'loading' | 'ready' | 'error';

export function GiveForm({ campaignId, campaignTitle, wishlistItemId, minAmount = 500, maxAmount = 10000000 }: GiveFormProps) {
  const [amount, setAmount] = useState<number>(10000);
  const [customAmount, setCustomAmount] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [flwStatus, setFlwStatus] = useState<FlwStatus>(() =>
    typeof FlutterwaveCheckout !== 'undefined' ? 'ready' : 'loading'
  );
  const flwReadyRef = useRef(typeof FlutterwaveCheckout !== 'undefined');

  useEffect(() => {
    if (!flwReadyRef.current) {
      const script = document.createElement('script');
      script.src = FLW_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        flwReadyRef.current = true;
        setFlwStatus('ready');
      };
      script.onerror = () => {
        setFlwStatus('error');
      };
      document.head.appendChild(script);

      return () => {
        script.remove();
      };
    }
  }, []);

  function handlePresetClick(value: number) {
    setAmount(value);
    setCustomAmount('');
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setAmount(Number(val));
    }
  }

  function openFlutterwave(txRef: string) {
    if (!flwReadyRef.current || typeof FlutterwaveCheckout === 'undefined') {
      setStatus('error');
      setErrorMessage('Payment system is still loading. Please try again.');
      return;
    }

    const contributorEmail = email || 'giving@altar.app';
    const contributorName = isAnonymous ? 'Anonymous' : (displayName || 'A friend');

    const meta: Record<string, string> = {};
    meta.campaignId = campaignId;
    if (wishlistItemId) meta.wishlistItemId = wishlistItemId;
    meta.isAnonymous = String(isAnonymous);
    if (displayName && !isAnonymous) meta.displayName = displayName;

    FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY!,
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      customer: {
        email: contributorEmail,
        name: contributorName,
      },
      meta,
      customizations: {
        title: 'Altar',
        description: campaignTitle,
        logo: '/logo.png',
      },
      callback: (response: { tx_ref: string; status: string }) => {
        if (response.status === 'successful') {
          verifyPayment(response.tx_ref);
        } else {
          setStatus('idle');
          setErrorMessage('Payment was not completed. Please try again.');
          setStatus('error');
        }
      },
      onclose: () => {
        setStatus((prev) => prev === 'submitting' ? 'idle' : prev);
      },
    });
  }

  function handleSubmit() {
    if (amount < minAmount) {
      setErrorMessage(`Minimum gift is ${formatNaira(minAmount)}`);
      setStatus('error');
      return;
    }
    if (amount > maxAmount) {
      setErrorMessage(`Maximum gift is ${formatNaira(maxAmount)}`);
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    fetch('/api/contributions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId,
        wishlistItemId: wishlistItemId ?? null,
        amount,
        isAnonymous,
        displayName: displayName || null,
        message: message || null,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message || 'Failed to initiate contribution');
        }
        return res.json();
      })
      .then((data) => {
        openFlutterwave(data.data.txRef);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Something went wrong. Please try again.');
      });
  }

  async function verifyPayment(txRef: string) {
    try {
      const res = await fetch('/api/contributions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txRef }),
      });
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage('Payment was received but verification is pending. Your contribution will be confirmed shortly.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Payment was received but verification is pending. Your contribution will be confirmed shortly.');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-surface border border-default rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h3 className="font-display font-medium text-xl text-body mb-2">Gift sent!</h3>
        <p className="font-body text-sm text-body/60 mb-1">
          Your gift of {formatNaira(amount)} is being processed.
        </p>
        <p className="font-body text-xs text-body/40 mb-6">
          It will arrive in the campaign wallet shortly.
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setCustomAmount('');
            setDisplayName('');
            setEmail('');
            setIsAnonymous(false);
            setMessage('');
            setAmount(10000);
          }}
          className="bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors"
        >
          Give again
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-surface border border-default rounded-2xl p-5">
        <h3 className="font-display font-medium text-lg text-body mb-4">Give a gift</h3>

        {/* Preset amounts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'font-body font-medium px-4 py-2 rounded-full transition-colors text-sm',
                amount === preset && !customAmount
                  ? 'bg-primary text-white'
                  : 'bg-ghost text-primary hover:bg-petal'
              )}
            >
              {formatNaira(preset)}
            </button>
          ))}
        </div>

        {/* Amount range hint */}
        <p className="font-body text-xs text-body/40 mb-4">
          Gifts between {formatNaira(minAmount)} and {formatNaira(maxAmount)}
        </p>

        {/* Custom amount */}
        <div className="mb-4">
          <label className="font-body text-sm text-body/60 mb-1.5 block">Custom amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-sm text-body/40">₦</span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmount ? Number(customAmount).toLocaleString('en-NG') : ''}
              onChange={handleCustomChange}
              placeholder="Enter amount"
              className="w-full border border-border-soft rounded-xl pl-8 pr-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
            />
          </div>
        </div>

        {/* Display name */}
        <div className="mb-4">
          <label className="font-body text-sm text-body/60 mb-1.5 block">Your name (optional)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Ada Eze"
            disabled={isAnonymous}
            className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="font-body text-sm text-body/60 mb-1.5 block">Email (for receipt)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
          />
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-border-soft text-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          />
          <span className="font-body text-sm text-body">Give anonymously</span>
        </label>

        {/* Message */}
        <div className="mb-6">
          <label className="font-body text-sm text-body/60 mb-1.5 block">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Leave a nice message..."
            maxLength={500}
            className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
          />
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="flex items-start gap-3 mb-4 p-3 bg-error/5 border border-error/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <p className="font-body text-sm text-error">{errorMessage}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={status === 'submitting' || flwStatus === 'loading'}
          className="w-full bg-primary text-white font-body font-medium px-6 py-3 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {status === 'submitting' ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : flwStatus === 'loading' ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Loading payment...
            </>
          ) : (
            <>
              <Gift className="w-5 h-5 mr-2" />
              Give {formatNaira(amount)}
            </>
          )}
        </button>

        {flwStatus === 'error' && (
          <p className="font-body text-xs text-error mt-3 text-center">
            Payment system failed to load. Please refresh and try again.
          </p>
        )}
      </div>
    </div>
  );
}
