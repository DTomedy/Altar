import 'server-only';

import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { CampaignForm } from '@/components/campaign/CampaignForm';

async function getUserKycLevel() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload.kycLevel;
}

export default async function NewCampaignPage() {
  const kycLevel = await getUserKycLevel();

  if (kycLevel === null) {
    redirect('/auth');
  }

  if (kycLevel < 1) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-petal flex items-center justify-center mb-4">
          <span className="font-display font-medium text-2xl text-primary">!</span>
        </div>
        <h1 className="font-display font-medium text-2xl text-body mb-2">Verify your identity</h1>
        <p className="font-body text-sm text-body/60 max-w-sm mb-6">
          You need to verify your email address before creating campaigns.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-medium text-2xl text-body mb-1">Create a campaign</h1>
      <p className="font-body text-sm text-body/60 mb-8">
        Start a birthday wishlist or a goal fundraiser.
      </p>
      <CampaignForm />
    </div>
  );
}
