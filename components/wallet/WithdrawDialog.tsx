'use client';

import { useState, useCallback, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { Loader, Check } from 'lucide-react';
import { formatNaira } from '@/lib/formatters';

interface Bank {
  code: string;
  name: string;
}

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawDialog({ isOpen, onClose }: WithdrawDialogProps) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksError, setBanksError] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ reference: string; amount: number; fee: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    fetch('/api/banks', { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setBanks(d.data);
          setBanksError(false);
        } else {
          setBanksError(true);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setBanksError(true);
      });

    return () => controller.abort();
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setBankCode('');
    setAccountNumber('');
    setAccountName('');
    setAmount('');
    setError('');
    setSuccess(null);
    onClose();
  }, [onClose]);

  const handleVerify = useCallback(async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/banks/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || 'Account verification failed');
      } else {
        setAccountName(data.data.accountName);
      }
    } catch {
      setError('Unable to verify account. Please check the details.');
    } finally {
      setVerifying(false);
    }
  }, [accountNumber, bankCode]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSubmitting(true);
      try {
        const res = await fetch('/api/wallet/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountNumber,
            bankCode,
            amount: Number(amount),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || 'Withdrawal failed');
        } else {
          setSuccess(data.data);
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [accountNumber, bankCode, amount]
  );

  const numericAmount = Number(amount) || 0;
  const fee = Math.round(numericAmount * 0.03);
  const netAmount = numericAmount - fee;
  const banksEmpty = banks.length === 0 && !banksError;

  if (success) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Withdrawal initiated">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-success" />
          </div>
          <p className="font-body text-sm text-body/60 mb-2">
            Your withdrawal of {formatNaira(success.amount)} has been initiated.
          </p>
          <p className="font-body text-xs text-body/40 mb-6 break-all">Ref: {success.reference}</p>
          <p className="font-body text-xs text-body/60 mb-6">
            A platform fee of {formatNaira(success.fee)} (3%) was deducted. You will receive{' '}
            {formatNaira(success.amount - success.fee)}.
          </p>
          <Button onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Withdraw funds" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="w-full">
          <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">Bank</label>
          {banksError ? (
            <div className="flex items-center gap-2">
              <p className="font-body text-sm text-error">Could not load banks.</p>
              <button
                type="button"
                onClick={() => {
                  setBanksError(false);
                  fetch('/api/banks')
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.data) {
                        setBanks(d.data);
                        setBanksError(false);
                      } else {
                        setBanksError(true);
                      }
                    })
                    .catch(() => setBanksError(true));
                }}
                className="font-body text-sm text-primary hover:text-primary-hover underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          ) : (
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setAccountName('');
              }}
              className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface-muted disabled:text-muted transition-colors"
              disabled={banksEmpty}
              required
            >
              <option value="">{banksEmpty ? 'Loading banks...' : 'Select your bank'}</option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="w-full">
          <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">
            Account number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              placeholder="0123456789"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, ''));
                setAccountName('');
              }}
              className="flex-1 border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
              required
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={accountNumber.length !== 10 || !bankCode || verifying}
              className="shrink-0 px-4 py-3 rounded-xl bg-ghost text-primary font-body text-sm font-medium hover:bg-petal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? <Loader className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
          {accountName && (
            <p className="text-success text-sm mt-1 font-body flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {accountName}
            </p>
          )}
        </div>

        <div className="w-full">
          <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body text-body/40">₦</span>
            <input
              type="number"
              min="500"
              placeholder="50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-border-soft rounded-xl pl-9 pr-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
              required
            />
          </div>
        </div>

        {numericAmount >= 500 && (
          <div className="bg-ghost rounded-xl px-4 py-3 space-y-1">
            <div className="flex justify-between font-body text-sm text-body/60">
              <span>Withdrawal amount</span>
              <span className="font-mono">{formatNaira(numericAmount)}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-body/60">
              <span>Platform fee (3%)</span>
              <span className="font-mono">-{formatNaira(fee)}</span>
            </div>
            <div className="flex justify-between font-body text-sm font-medium text-body pt-1 border-t border-border-soft">
              <span>You receive</span>
              <span className="font-mono text-primary">{formatNaira(netAmount)}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-error/10 text-error font-body text-sm px-4 py-3 rounded-xl">{error}</div>
        )}

        <Button type="submit" isLoading={submitting} className="w-full">
          Withdraw
        </Button>
      </form>
    </Modal>
  );
}
