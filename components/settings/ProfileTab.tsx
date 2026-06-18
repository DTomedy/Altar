'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui';
import { Camera, Upload, Check, AlertCircle } from 'lucide-react';

interface ProfileTabProps {
  initialName: string;
  initialPhone: string | null;
  initialEmail: string;
  initialProfilePicture: string | null;
}

export function ProfileTab({ initialName, initialPhone, initialEmail, initialProfilePicture }: ProfileTabProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone || '');
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(initialProfilePicture);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Profile picture must be under 2MB' });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Profile picture must be JPEG, PNG, or WebP' });
      return;
    }

    setProfilePictureFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setProfilePicturePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }

      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Failed to update profile');
      }

      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setProfilePictureFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-surface border border-default rounded-2xl p-5 space-y-6">
        {/* Profile picture */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full bg-ghost flex items-center justify-center overflow-hidden shrink-0">
            {profilePicturePreview ? (
              <Image src={profilePicturePreview} alt="Profile" width={64} height={64} className="w-full h-full object-cover" unoptimized />
            ) : (
              <Camera className="w-6 h-6 text-accent" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 font-body font-semibold text-sm text-primary hover:text-primary-hover transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload photo
            </button>
            <p className="font-body text-xs text-body/40 mt-0.5">JPEG, PNG, or WebP. Max 2MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Name */}
        <Input
          label="Full name"
          id="settings-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Phone */}
        <Input
          label="Phone number"
          id="settings-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+234 800 000 0000"
        />

        {/* Email (read-only) */}
        <div>
          <label className="block font-body text-sm text-body/80 mb-1.5 font-semibold">Email</label>
          <div className="w-full border border-border-soft rounded-xl px-4 py-3 font-body text-body bg-surface-muted cursor-not-allowed flex items-center justify-between">
            <span>{initialEmail}</span>
            <span className="font-body text-xs text-body/40">Cannot be changed</span>
          </div>
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
            disabled={saving || !name.trim()}
            className="bg-primary text-white font-body font-semibold px-6 py-2.5 rounded-full hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
