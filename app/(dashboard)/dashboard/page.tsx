import 'server-only';

import Link from 'next/link';
import { Gift, Plus, TrendingUp, Activity, Layers } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui';
import { CampaignModal } from '@/components/campaign/CampaignModal';
import { CampaignActions } from '@/components/campaign/CampaignActions';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { formatNaira } from '@/lib/formatters';

interface CampaignSummary {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  totalRaised: number;
  donorCount: number;
  goalAmount: number | null;
  daysLeft: number | null;
  slug: string;
}

async function getUserData() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      kycLevel: true,
      onboardingViewed: true,
    },
  });

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: payload.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const campaignIds = campaigns.map((c) => c.id);
  const contributionsAgg = await prisma.contribution.groupBy({
    by: ['campaignId'],
    where: { campaignId: { in: campaignIds }, status: 'SUCCESS' },
    _sum: { amount: true },
    _count: { id: true },
  });

  const raisedMap = new Map<string, number>();
  const donorCountMap = new Map<string, number>();
  for (const row of contributionsAgg) {
    raisedMap.set(row.campaignId, Number(row._sum.amount) || 0);
    donorCountMap.set(row.campaignId, row._count.id);
  }

  const campaignSummaries: CampaignSummary[] = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    type: c.type,
    totalRaised: raisedMap.get(c.id) || 0,
    donorCount: donorCountMap.get(c.id) || 0,
    goalAmount: c.goalAmount ? Number(c.goalAmount) : null,
    daysLeft: c.deadline
      ? Math.ceil((new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    slug: c.slug,
  }));

  const totalRaised = campaignSummaries.reduce((sum, c) => sum + c.totalRaised, 0);
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;

  return { user, campaigns: campaignSummaries, totalRaised, activeCount, totalCampaigns: campaigns.length };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  const data = await getUserData();

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-body text-sm text-error">Could not load dashboard. Please sign in again.</p>
        <Link href="/auth" className="mt-4 text-primary underline underline-offset-2 font-body text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  const { user, campaigns, totalRaised, activeCount, totalCampaigns } = data;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-medium text-2xl text-body">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="font-body text-sm text-body/60 mt-1">Here&apos;s what&apos;s happening with your campaigns.</p>
        </div>
        <Link href="/dashboard?create=1">
          <Button variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            New campaign
          </Button>
        </Link>
      </div>

      {verified === 'true' && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-success/10 border border-success/20 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="font-body text-sm font-medium text-body">Email verified successfully</p>
            <p className="font-body text-xs text-body/60">Your account is now fully active. Welcome to Altar!</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full border border-border-soft flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="font-body text-xs text-muted font-medium uppercase tracking-wider">Total raised</p>
          </div>
          <p className="font-display font-medium text-2xl text-primary">{formatNaira(totalRaised)}</p>
        </div>
        <div className="bg-surface border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full border border-border-soft flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <p className="font-body text-xs text-muted font-medium uppercase tracking-wider">Active campaigns</p>
          </div>
          <p className="font-display font-medium text-2xl text-body">{activeCount}</p>
        </div>
        <div className="bg-surface border border-border-soft rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full border border-border-soft flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <p className="font-body text-xs text-muted font-medium uppercase tracking-wider">Total campaigns</p>
          </div>
          <p className="font-display font-medium text-2xl text-body">{totalCampaigns}</p>
        </div>
      </div>

      {/* Campaign list */}
      <div>
        <h2 className="font-display font-medium text-xl text-body mb-4">Your campaigns</h2>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface border border-default rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-ghost flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display font-medium text-xl text-body mb-2">No campaigns yet</h3>
            <p className="font-body text-sm text-body/60 max-w-sm mb-6">
              Create your first wishlist or goal campaign to get started.
            </p>
            <Link href="/dashboard?create=1">
              <Button variant="primary">
                <Plus className="w-5 h-5 mr-2" />
                Create a campaign
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campaigns.map((campaign) => {
              const percentage = campaign.goalAmount && campaign.goalAmount > 0
                ? Math.min(Math.round((campaign.totalRaised / campaign.goalAmount) * 100), 100)
                : 0;

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="bg-surface border border-default rounded-2xl p-5 hover:border-primary/30 transition-colors h-full flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display font-medium text-base text-body line-clamp-1">{campaign.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full ${
                            campaign.status === 'ACTIVE'
                              ? 'bg-ghost text-primary'
                              : campaign.status === 'GOAL_REACHED'
                                ? 'bg-success/10 text-success'
                                : 'bg-surface-muted text-muted'
                          }`}
                        >
                          {campaign.status === 'ACTIVE'
                            ? 'In progress'
                            : campaign.status === 'GOAL_REACHED'
                              ? 'Goal reached'
                              : campaign.status === 'CLOSED'
                                ? 'Completed'
                                : 'Expired'}
                        </span>
                        <CampaignActions campaignId={campaign.id} campaignStatus={campaign.status} />
                      </div>
                    </div>

                    <p className="font-body text-xs text-body/50 line-clamp-2 mb-3 flex-1">{campaign.description}</p>

                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono font-medium text-base text-primary">{formatNaira(campaign.totalRaised)}</span>
                      <span className="font-body text-xs text-muted">
                        {campaign.donorCount} donor{campaign.donorCount !== 1 ? 's' : ''}
                      </span>
                      {campaign.daysLeft !== null && campaign.daysLeft > 0 && (
                        <span className="font-body text-xs text-muted">{campaign.daysLeft} day{campaign.daysLeft !== 1 ? 's' : ''} left</span>
                      )}
                      {campaign.daysLeft !== null && campaign.daysLeft <= 0 && (
                        <span className="font-body text-xs text-muted">Ended</span>
                      )}
                    </div>

                    {campaign.type === 'GOAL' && campaign.goalAmount && campaign.goalAmount > 0 && (
                      <div>
                        <div className="w-full bg-surface-muted rounded-full h-1.5">
                          <div
                            className="bg-primary rounded-full h-1.5 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <CampaignModal />
      {user && !user.onboardingViewed && <OnboardingTour />}
    </div>
  );
}
