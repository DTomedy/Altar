import 'server-only';

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Button, Badge } from '@/components/ui';
import { Share2, ExternalLink } from 'lucide-react';
import { formatNaira, formatDate } from '@/lib/formatters';

async function getCampaign(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      contributions: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      items: true,
    },
  });

  if (!campaign || campaign.ownerId !== payload.userId) return null;

  const raisedAgg = await prisma.contribution.aggregate({
    where: { campaignId: id, status: 'SUCCESS' },
    _sum: { amount: true },
  });
  const totalRaised = Number(raisedAgg._sum.amount || 0);
  const goal = campaign.goalAmount ? Number(campaign.goalAmount) : null;
  const percentage = goal && goal > 0 ? Math.min(Math.round((totalRaised / goal) * 100), 100) : 0;

  return { campaign, totalRaised, goal, percentage };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCampaign(id);

  if (!data) {
    notFound();
  }

  const { campaign, totalRaised, goal, percentage } = data;

  const statusVariant = (
    campaign.status === 'ACTIVE' ? 'primary' :
    campaign.status === 'GOAL_REACHED' ? 'success' : 'muted'
  ) as 'primary' | 'success' | 'muted';

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display font-medium text-2xl text-body">{campaign.title}</h1>
            <Badge variant={statusVariant}>
              {campaign.status === 'ACTIVE' ? 'Active' :
               campaign.status === 'GOAL_REACHED' ? 'Goal reached' :
               campaign.status === 'EXPIRED' ? 'Expired' : 'Closed'}
            </Badge>
          </div>
          <p className="font-body text-sm text-body/60">
            Created {formatDate(campaign.createdAt)}
            {campaign.deadline && ` · Deadline ${formatDate(campaign.deadline)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.slug && (
            <Link href={`/c/${campaign.slug}`} target="_blank">
              <Button variant="secondary">
                <ExternalLink className="w-5 h-5 mr-2" />
                View page
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-surface border border-default rounded-2xl p-5 mb-8">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="font-mono font-medium text-3xl text-primary">{formatNaira(totalRaised)}</p>
            {goal && (
              <p className="font-body text-sm text-body/60 mt-1">
                raised of {formatNaira(goal)} goal
              </p>
            )}
          </div>
          <p className="font-display font-medium text-lg text-body">{percentage}%</p>
        </div>
        {goal && (
          <div className="w-full bg-surface-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campaign info */}
        <div>
          <h2 className="font-display font-medium text-lg text-body mb-3">About this campaign</h2>
          <p className="font-body text-sm text-body/60 mb-6">{campaign.description}</p>

          {campaign.items.length > 0 && (
            <div>
              <h3 className="font-display font-medium text-base text-body mb-3">Wishlist items</h3>
              <div className="space-y-3">
                {campaign.items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface border border-default rounded-2xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-body font-medium text-sm text-body">{item.name}</p>
                      {item.isFulfilled && (
                        <Badge variant="success">Fulfilled</Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="font-body text-xs text-body/60 mb-2">{item.description}</p>
                    )}
                    <p className="font-mono font-medium text-sm text-primary">
                      {formatNaira(item.fundedAmount)} / {formatNaira(item.targetAmount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent contributions */}
        <div>
          <h2 className="font-display font-medium text-lg text-body mb-3">Recent gifts</h2>
          {campaign.contributions.length === 0 ? (
            <div className="bg-surface border border-default rounded-2xl p-5 text-center">
              <p className="font-body text-sm text-body/60">No gifts yet. Share your campaign to start receiving contributions.</p>
            </div>
          ) : (
            <div className="bg-surface border border-default rounded-2xl divide-y divide-border-soft">
              {campaign.contributions.map((contribution) => (
                <div key={contribution.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-body text-sm text-body">
                      {contribution.isAnonymous
                        ? 'Anonymous'
                        : contribution.displayName || 'A friend'}
                    </p>
                    <p className="font-body text-xs text-body/40">{formatDate(contribution.createdAt)}</p>
                  </div>
                  <p className="font-mono font-medium text-sm text-primary">{formatNaira(contribution.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
