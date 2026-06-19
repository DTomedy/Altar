import 'server-only';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui';
import { GiveForm } from '@/components/contribution/GiveForm';
import { ShareButton } from '@/components/ui/ShareButton';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { cn } from '@/lib/utils';
import { formatNaira, formatDate } from '@/lib/formatters';
import { Gift, Users, CalendarDays, ShieldCheck } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getDaysLeft(deadline: Date): number {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

async function getCampaign(slug: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: {
      contributions: {
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      items: true,
    },
  });

  if (!campaign) return null;

  const raisedAgg = await prisma.contribution.aggregate({
    where: { campaignId: campaign.id, status: 'SUCCESS' },
    _sum: { amount: true },
  });
  const totalRaised = Number(raisedAgg._sum.amount || 0);
  const goal = campaign.goalAmount ? Number(campaign.goalAmount) : null;
  const percentage = goal && goal > 0 ? Math.min(Math.round((totalRaised / goal) * 100), 100) : 0;

  const contributorCount = await prisma.contribution.count({
    where: { campaignId: campaign.id, status: 'SUCCESS' },
  });

  return { campaign, totalRaised, goal, percentage, contributorCount };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCampaign(slug);
  if (!data) return { title: 'Campaign not found' };

  const { campaign } = data;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    title: `${campaign.title} — Altar`,
    description: campaign.description,
    openGraph: {
      title: `${campaign.title} — Altar`,
      description: campaign.description,
      url: `${appUrl}/c/${campaign.slug}`,
      siteName: 'Altar',
      locale: 'en_NG',
      type: 'website',
      ...(campaign.coverPhoto ? { images: [{ url: campaign.coverPhoto }] } : {}),
    },
  };
}

export default async function PublicCampaignPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCampaign(slug);

  if (!data) {
    notFound();
  }

  const { campaign, totalRaised, goal, percentage, contributorCount } = data;
  const isActive = campaign.status === 'ACTIVE';
  const isExpired = campaign.status === 'EXPIRED';
  const isGoalReached = campaign.status === 'GOAL_REACHED';
  const hasGoal = goal !== null;
  const isAcceptingContributions = isActive || isGoalReached;

  const statusText = isActive ? 'Active' : isGoalReached ? 'Goal reached' : isExpired ? 'Expired' : 'Closed';
  const daysLeft = campaign.deadline ? getDaysLeft(campaign.deadline) : 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const campaignUrl = `${appUrl}/c/${campaign.slug}`;

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <div className="bg-primary w-full">
        <LandingHeader />
      </div>

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        {isExpired ? (
          /* Expired campaign */
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-muted" />
            </div>
            <h1 className="font-display font-medium text-xl text-body mb-2">{campaign.title}</h1>
            <p className="font-body text-sm text-body/60 mb-2">
              This campaign has ended.
            </p>
            {totalRaised > 0 && (
              <p className="font-display font-medium text-xl text-body mb-4">
                {formatNaira(totalRaised)} raised
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full bg-surface-muted text-muted">
                {statusText}
              </span>
              {campaign.deadline && (
                <span className="font-body text-xs text-body/40">
                  Ended {formatDate(campaign.deadline)}
                </span>
              )}
            </div>
            <ShareButton url={campaignUrl} label="Share link" title={campaign.title} />
          </div>
        ) : isAcceptingContributions ? (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover photo */}
              {campaign.coverPhoto && (
                <div className="rounded-2xl overflow-hidden">
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

              {/* Title & status */}
              <div>
                <div className="flex items-start gap-3 mb-2">
                  <h1 className="font-display font-medium text-3xl text-body flex-1">{campaign.title}</h1>
                  <Badge variant={isActive ? 'primary' : 'success'}>
                    {isGoalReached ? 'Goal reached' : 'Active'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-body text-sm text-body/60">
                  {campaign.deadline && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {daysLeft > 0 ? `${daysLeft} days left` : `Ended ${formatDate(campaign.deadline)}`}
                    </span>
                  )}
                  {contributorCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      {contributorCount} {contributorCount === 1 ? 'gift' : 'gifts'}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress card */}
              <div className="bg-surface border border-default rounded-2xl p-5">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <p className="font-display font-medium text-3xl text-primary">{formatNaira(totalRaised)}</p>
                    {hasGoal && (
                      <p className="font-body text-sm text-body/60 mt-1">
                        raised of {formatNaira(goal)} goal
                      </p>
                    )}
                  </div>
                  {hasGoal && (
                    <p className="font-display font-medium text-lg text-body">{percentage}%</p>
                  )}
                </div>
                {hasGoal && (
                  <div className="w-full bg-surface-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
              </div>

              {isGoalReached && (
                <div className="flex items-start gap-3 p-4 bg-success/5 border border-success/20 rounded-2xl">
                  <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-body font-medium text-sm text-body">Goal reached</p>
                    <p className="font-body text-xs text-body/60 mt-0.5">
                      This campaign reached its goal. Gifts beyond the goal go directly to the campaign owner.
                    </p>
                  </div>
                </div>
              )}

              {/* About */}
              <div>
                <h2 className="font-display font-medium text-lg text-body mb-3">About this campaign</h2>
                <p className="font-body text-sm text-body/60 whitespace-pre-line">{campaign.description}</p>
              </div>

              {/* Wishlist items */}
              {campaign.items.length > 0 && (
                <div>
                  <h3 className="font-display font-medium text-lg text-body mb-3">Wishlist items</h3>
                  <div className="space-y-3">
                    {campaign.items.map((item) => {
                      const itemFunded = Number(item.fundedAmount);
                      const itemTarget = Number(item.targetAmount);
                      const itemRemaining = Math.max(0, itemTarget - itemFunded);
                      const itemPercentage = itemTarget > 0 ? Math.min(Math.round((itemFunded / itemTarget) * 100), 100) : 0;
                      const isPaid = item.isFulfilled;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'bg-surface border rounded-2xl p-4',
                            isPaid ? 'border-border-soft opacity-60' : 'border-default'
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className={cn(
                                'font-body font-medium text-sm truncate',
                                isPaid ? 'text-muted' : 'text-body'
                              )}>
                                {item.name}
                              </p>
                              {item.description && (
                                <span className="font-body text-xs text-body/40 truncate hidden sm:inline">
                                  — {item.description}
                                </span>
                              )}
                            </div>
                            {isPaid && (
                              <Badge variant="success">Paid</Badge>
                            )}
                          </div>

                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-display font-medium text-base text-primary">{formatNaira(itemTarget)}</span>
                            {itemFunded > 0 && (
                              <span className="font-body text-xs text-body/60">
                                {formatNaira(itemFunded)} paid
                              </span>
                            )}
                          </div>

                          {isPaid ? (
                            <p className="font-body text-xs text-success">Fully paid</p>
                          ) : itemFunded > 0 ? (
                            <>
                              <p className="font-body text-xs text-body/60 mb-2">
                                {formatNaira(itemFunded)} of {formatNaira(itemTarget)} paid —{' '}
                                <span className="text-primary font-medium">{formatNaira(itemRemaining)} remaining</span>
                              </p>
                              <div className="w-full bg-surface-muted rounded-full h-1.5">
                                <div
                                  className="bg-primary rounded-full h-1.5"
                                  style={{ width: `${itemPercentage}%` }}
                                />
                              </div>
                            </>
                          ) : (
                            <p className="font-body text-xs text-body/60">
                              Full amount — {formatNaira(itemRemaining)} remaining
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent gifts */}
              <div>
                <h2 className="font-display font-medium text-lg text-body mb-3">Recent gifts</h2>
                {campaign.contributions.length === 0 ? (
                  <div className="bg-surface border border-default rounded-2xl p-5 text-center">
                    <p className="font-body text-sm text-body/60">Be the first to leave a gift.</p>
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
                        <p className="font-display font-medium text-sm text-primary">{formatNaira(contribution.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — Give form + trust signals */}
            <div className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-8 space-y-4">
                <GiveForm
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                  items={campaign.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    targetAmount: Number(item.targetAmount),
                    fundedAmount: Number(item.fundedAmount),
                    isFulfilled: item.isFulfilled,
                  }))}
                  minAmount={Number(campaign.minAmount)}
                  maxAmount={Number(campaign.maxAmount)}
                />

                {/* Trust badge */}
                <div className="flex items-center gap-2 justify-center py-3">
                  <ShieldCheck className="w-4 h-4 text-success" />
                  <p className="font-body text-xs text-body/50">
                    Secured by <span className="font-medium text-body/70">Flutterwave</span>
                  </p>
                </div>

                {/* Share */}
                <div className="text-center">
                  <ShareButton url={campaignUrl} label="Share this campaign" title={campaign.title} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Closed campaign */
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-muted" />
            </div>
            <h1 className="font-display font-medium text-xl text-body mb-2">{campaign.title}</h1>
            <p className="font-body text-sm text-body/60 mb-2">
              This campaign is no longer accepting gifts.
            </p>
            {totalRaised > 0 && (
              <p className="font-display font-medium text-xl text-body mb-4">
                {formatNaira(totalRaised)} raised
              </p>
            )}
            <span className="inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full bg-surface-muted text-muted">
              {statusText}
            </span>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
