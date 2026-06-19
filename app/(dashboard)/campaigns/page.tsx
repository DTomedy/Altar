import 'server-only';

import Link from 'next/link';
import { Gift, Plus, Users, Clock } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui';
import { CampaignActions } from '@/components/campaign/CampaignActions';
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

async function getCampaigns() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const campaigns = await prisma.campaign.findMany({
    where: { ownerId: payload.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
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

  const summaries: CampaignSummary[] = campaigns.map((c) => ({
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

  return summaries;
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  if (campaigns === null) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="font-body text-sm text-error">Could not load campaigns. Please sign in again.</p>
        <Link href="/auth" className="mt-4 text-primary underline underline-offset-2 font-body text-sm">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-medium text-2xl text-body">Campaigns</h1>
          <p className="font-body text-sm text-body/60 mt-1">Manage all your campaigns in one place.</p>
        </div>
        <Link href="/campaigns/new">
          <Button variant="primary">
            <Plus className="w-5 h-5 mr-2" />
            New campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface border border-default rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-ghost flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-display font-medium text-xl text-body mb-2">No campaigns yet</h3>
          <p className="font-body text-sm text-body/60 max-w-sm mb-6">
            Create your first wishlist or goal campaign to get started.
          </p>
          <Link href="/campaigns/new">
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
                <div className="bg-surface border border-border-soft rounded-2xl p-5 hover:border-primary/30 transition-colors h-full flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-display font-medium text-base text-body line-clamp-1">{campaign.title}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-ghost text-primary'
                            : campaign.status === 'GOAL_REACHED'
                              ? 'bg-success/10 text-success'
                              : campaign.status === 'CLOSED'
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
                    <span className="font-display font-medium text-base text-primary">{formatNaira(campaign.totalRaised)}</span>
                    <span className="font-body text-xs text-muted flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {campaign.donorCount} donor{campaign.donorCount !== 1 ? 's' : ''}
                    </span>
                    {campaign.daysLeft !== null && campaign.daysLeft > 0 && (
                      <span className="font-body text-xs text-error flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {campaign.daysLeft} day{campaign.daysLeft !== 1 ? 's' : ''} left
                      </span>
                    )}
                    {campaign.daysLeft !== null && campaign.daysLeft <= 0 && (
                      <span className="font-body text-xs text-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Ended
                      </span>
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
  );
}
