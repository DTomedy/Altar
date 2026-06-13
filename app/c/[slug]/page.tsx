import 'server-only';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { Badge, Button } from '@/components/ui';
import { GiveForm } from '@/components/contribution/GiveForm';
import { formatNaira, formatDate } from '@/lib/formatters';
import { Gift } from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
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

  return { campaign, totalRaised, goal, percentage };
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

  const { campaign, totalRaised, goal, percentage } = data;
  const isActive = campaign.status === 'ACTIVE';
  const isExpired = campaign.status === 'EXPIRED';
  const isGoalReached = campaign.status === 'GOAL_REACHED';
  const hasGoal = goal !== null;

  const statusText = isActive ? 'Active' : isGoalReached ? 'Goal reached' : isExpired ? 'Expired' : 'Closed';

  return (
    <div className="min-h-screen bg-page">
      {/* Navbar */}
      <div className="bg-primary w-full px-12">
        <header className="flex items-center justify-between py-6 max-w-7xl mx-auto w-full">
          <img src="/logo/Altar Logo_white.svg" alt="Altar" className="h-8 w-auto" />
          <div className="flex items-center gap-4">
            <Link href="/auth">
              <Button variant="secondary" className="text-white hover:bg-transparent">Log in</Button>
            </Link>
            <Link href="/auth?mode=register">
              <Button variant="ghost">Get started</Button>
            </Link>
          </div>
        </header>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {!isActive && !isGoalReached ? (
          /* Inactive campaign state */
          <div className="max-w-lg mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-muted" />
            </div>
            <h1 className="font-display font-medium text-xl text-body mb-2">{campaign.title}</h1>
            <p className="font-body text-sm text-body/60 mb-2">
              {isExpired
                ? 'This campaign has ended.'
                : isGoalReached
                  ? 'This campaign has reached its goal.'
                  : 'This campaign is no longer active.'}
            </p>
            <span className="inline-flex items-center font-body font-medium text-xs px-3 py-1 rounded-full bg-surface-muted text-muted">
              {statusText}
            </span>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cover photo */}
              {campaign.coverPhoto && (
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={campaign.coverPhoto}
                    alt={campaign.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Title & status */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-display font-medium text-3xl text-body">{campaign.title}</h1>
                  <Badge variant={isActive ? 'primary' : 'success'}>{statusText}</Badge>
                </div>
                {campaign.deadline && (
                  <p className="font-body text-sm text-body/60">
                    {isExpired ? 'Ended' : 'Ends'} {formatDate(campaign.deadline)}
                  </p>
                )}
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
                      const itemPercentage = itemTarget > 0 ? Math.min(Math.round((itemFunded / itemTarget) * 100), 100) : 0;
                      return (
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
                          <p className="font-mono font-medium text-sm text-primary mb-2">
                            {formatNaira(itemFunded)} / {formatNaira(itemTarget)}
                          </p>
                          <div className="w-full bg-surface-muted rounded-full h-1.5">
                            <div
                              className="bg-primary rounded-full h-1.5"
                              style={{ width: `${itemPercentage}%` }}
                            />
                          </div>
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
                        <p className="font-mono font-medium text-sm text-primary">{formatNaira(contribution.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar — Give form */}
            <div className="mt-8 lg:mt-0">
              <div className="lg:sticky lg:top-8">
                <GiveForm
                  campaignId={campaign.id}
                  campaignTitle={campaign.title}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-primary py-8 px-12 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/logo/Altar Logo_white.svg" alt="Altar" className="h-6 w-auto" />
          <p className="font-body text-xs text-white/60 text-center">
            Give with intention. &copy; {new Date().getFullYear()} Altar. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
