'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui';
import { Check, AlertCircle } from 'lucide-react';

export function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Current password is required' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update password');
      }

      setMessage({ type: 'success', text: 'Password updated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-surface border border-gray-200 rounded-2xl p-5 space-y-6">
        <p className="font-body text-sm text-body/60">
          Your password must be at least 8 characters long.
        </p>

        <Input
          label="Current password"
          id="settings-current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <Input
          label="New password"
          id="settings-new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />

        <Input
          label="Confirm new password"
          id="settings-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

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
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="bg-primary text-white font-body font-medium px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>
    </form>
  );
}
