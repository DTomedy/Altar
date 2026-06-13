'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui';
import { Check, AlertCircle, Landmark } from 'lucide-react';

interface BankTabProps {
  initialAccountNumber: string | null;
  initialBankCode: string | null;
  initialBankName: string | null;
  initialAccountName: string | null;
}

const NIGERIAN_BANKS = [
  { code: '011', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '035', name: 'ALAT by WEMA' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '063', name: 'Diamond Bank' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '084', name: 'Enterprise Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '069', name: 'First Bank of Nigeria' },
  { code: '060', name: 'First City Monument Bank (FCMB)' },
  { code: '083', name: 'Globus Bank' },
  { code: '036', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Jaiz Bank' },
  { code: '029', name: 'Keystone Bank' },
  { code: '076', name: 'Kuda Bank' },
  { code: '014', name: 'MainStreet Bank' },
  { code: '090', name: 'Moniepoint Microfinance Bank' },
  { code: '033', name: 'PalmPay' },
  { code: '027', name: 'Parallex Bank' },
  { code: '101', name: 'Paystack-Titan' },
  { code: '076', name: 'Polaris Bank' },
  { code: '002', name: 'Providus Bank' },
  { code: '032', name: 'Opay' },
  { code: '022', name: 'Stanbic IBTC Bank' },
  { code: '068', name: 'Standard Chartered Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '026', name: 'SunTrust Bank' },
  { code: '072', name: 'TAJ Bank' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'VFD Microfinance Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
];

export function BankTab({ initialAccountNumber, initialBankCode, initialBankName, initialAccountName }: BankTabProps) {
  const [accountNumber, setAccountNumber] = useState(initialAccountNumber || '');
  const [bankCode, setBankCode] = useState(initialBankCode || '');
  const [bankName, setBankName] = useState(initialBankName || '');
  const [accountName, setAccountName] = useState(initialAccountName || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBankSelect, setShowBankSelect] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  const hasBankDetails = !!(initialAccountNumber && initialBankName);

  const filteredBanks = NIGERIAN_BANKS.filter(
    (b) => b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  function handleBankSelect(code: string, name: string) {
    setBankCode(code);
    setBankName(name);
    setShowBankSelect(false);
    setBankSearch('');
  }

  function handleAccountNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!accountNumber || accountNumber.length !== 10) {
      setMessage({ type: 'error', text: 'Bank account number must be 10 digits' });
      return;
    }

    if (!bankCode || !bankName) {
      setMessage({ type: 'error', text: 'Please select your bank' });
      return;
    }

    if (!accountName.trim()) {
      setMessage({ type: 'error', text: 'Account name is required' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/bank', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccountNumber: accountNumber,
          bankCode,
          bankName,
          bankAccountName: accountName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to save bank details');
      }

      setMessage({ type: 'success', text: 'Bank account saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-surface border border-default rounded-2xl p-5 space-y-6">
        {hasBankDetails && (
          <div className="flex items-start gap-3 p-3 bg-success/5 border border-success/20 rounded-xl">
            <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <p className="font-body text-sm text-body/80">
              You have a bank account saved. Update it below if your details have changed.
            </p>
          </div>
        )}

        {/* Account name */}
        <Input
          label="Account name"
          id="settings-account-name"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value.toUpperCase())}
          placeholder="e.g. ADAEZE OKONKWO"
          required
        />

        {/* Account number */}
        <Input
          label="Account number"
          id="settings-account-number"
          value={accountNumber}
          onChange={handleAccountNumberChange}
          placeholder="0123456789"
          inputMode="numeric"
          maxLength={10}
          required
        />

        {/* Bank selection */}
        <div>
          <label className="block font-body text-sm text-body/80 mb-1.5 font-medium">Bank</label>
          {showBankSelect ? (
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="text"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Search for your bank..."
                  className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-body/40 transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto border border-border-soft rounded-xl">
                {filteredBanks.length === 0 ? (
                  <p className="font-body text-sm text-body/40 p-3">No banks found</p>
                ) : (
                  filteredBanks.map((b) => (
                    <button
                      key={`${b.code}-${b.name}`}
                      type="button"
                      onClick={() => handleBankSelect(b.code, b.name)}
                      className={`w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-ghost ${
                        bankCode === b.code && bankName === b.name ? 'bg-ghost text-primary' : 'text-body'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => { setShowBankSelect(false); setBankSearch(''); }}
                className="font-body text-xs text-primary hover:text-primary-hover transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowBankSelect(true)}
              className="w-full flex items-center justify-between border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-white hover:bg-ghost transition-colors text-left"
            >
              {bankName ? (
                <span>{bankName}</span>
              ) : (
                <span className="text-body/40">Select your bank</span>
              )}
              <Landmark className="w-5 h-5 text-body/40" />
            </button>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-start gap-3 p-3 rounded-xl ${message.type === 'success' ? 'bg-success/5 border border-success/20' : 'bg-error/5 border border-error/20'}`}>
            {message.type === 'success' ? (
              <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            )}
            <p className={`font-body text-sm ${message.type === 'success' ? 'text-success' : 'text-error'}`}>{message.text}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !accountNumber || !bankCode || !accountName.trim()}
            className="bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : hasBankDetails ? 'Update bank account' : 'Save bank account'}
          </button>
        </div>
      </div>
    </form>
  );
}
