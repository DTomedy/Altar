import 'server-only';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { Badge, ShareButton, BackButton } from '@/components/ui';
import { formatNaira, formatDate, formatDateTime } from '@/lib/formatters';

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
        take: 50,
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
      <BackButton />
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
          <p className="font-body text-sm text-body/70">
            Created {formatDate(campaign.createdAt)}
            {campaign.deadline && ` · Deadline ${formatDate(campaign.deadline)}`}
          </p>
        </div>
        <div className="flex gap-2">
          {campaign.slug && (
            <>
              <ShareButton
                url={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/c/${campaign.slug}`}
                title={campaign.title}
              />
            </>
          )}
        </div>
      </div>

      {/* Cover image */}
      {campaign.coverPhoto && (
        <div className="rounded-2xl overflow-hidden mb-6">
          <Image
            src={campaign.coverPhoto}
            alt={campaign.title}
            width={1200}
            height={600}
            className="w-full h-64 object-cover"
            sizes="(max-width: 768px) 100vw, 66vw"
          />
        </div>
      )}

      {/* Progress + Description side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Progress */}
        <div className="bg-surface border border-default rounded-2xl p-5">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-display font-medium text-3xl text-primary">{formatNaira(totalRaised)}</p>
              {goal && (
                <p className="font-body text-sm text-body/70 mt-1">
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

        {/* Description */}
        <div className="bg-surface border border-default rounded-2xl p-5">
          <h2 className="font-display font-medium text-lg text-body mb-3">About this campaign</h2>
          <p className="font-body text-sm text-body/70 leading-relaxed">{campaign.description}</p>
        </div>
      </div>

      {/* Wishlist items */}
      {campaign.items.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display font-medium text-lg text-body mb-3">Wishlist items</h2>
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
                  <p className="font-body text-xs text-body/70 mb-2">{item.description}</p>
                )}
                <p className="font-display font-medium text-sm text-primary">
                  {formatNaira(item.fundedAmount)} / {formatNaira(item.targetAmount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Donors table */}
      <div className="bg-surface border border-default rounded-2xl p-5">
        <h2 className="font-display font-medium text-lg text-body mb-4">Gifts received</h2>

        {campaign.contributions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-body text-sm text-body/70">No gifts yet. Share your campaign to start receiving contributions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border-soft">
                  <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                    Donor
                  </th>
                  <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-right px-5 py-3">
                    Amount
                  </th>
                  <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                    Date & time
                  </th>
                  <th className="font-body text-xs text-body/70 font-medium uppercase tracking-wider text-left px-5 py-3">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {campaign.contributions.map((contribution) => (
                  <tr key={contribution.id} className="hover:bg-ghost/30 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-body text-sm text-body">
                        {contribution.isAnonymous
                          ? 'Anonymous'
                          : contribution.displayName || 'A friend'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-display font-medium text-sm text-body">
                        {formatNaira(contribution.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-body text-sm text-body/70">
                        {formatDateTime(contribution.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-body text-sm text-body/70 max-w-[200px] block truncate" title={contribution.message ?? undefined}>
                        {contribution.message || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
