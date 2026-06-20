import 'server-only';

import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { CampaignCard } from '@/components/landing/CampaignCard';
import { CampaignSearch } from './CampaignSearch';

export const metadata: Metadata = {
  title: 'All Campaigns — Altar',
  description: 'Explore active campaigns on Altar. Find a campaign to support.',
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CampaignsPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'ACTIVE',
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
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

  const campaignList = campaigns.map((c) => ({
    slug: c.slug,
    title: c.title,
    coverPhoto: c.coverPhoto,
    goalAmount: c.goalAmount ? Number(c.goalAmount) : null,
    totalRaised: raisedMap.get(c.id) || 0,
    donorCount: donorCountMap.get(c.id) || 0,
  }));

  return (
    <div className="flex flex-col flex-1">
      <div className="bg-primary w-full">
        <LandingHeader />
      </div>

      <main className="flex-1">
        <div className="bg-page w-full">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
              <h1
                className="font-heading font-medium text-body"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
              >
                All Campaigns
              </h1>
              <CampaignSearch />
            </div>

            {q && (
              <p className="font-body text-sm text-body/70 mb-6">
                {campaignList.length} result{campaignList.length !== 1 ? 's' : ''} for &ldquo;{q}&rdquo;
              </p>
            )}

            {campaignList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <h3 className="font-display font-medium text-xl text-body mb-2">No campaigns found</h3>
                <p className="font-body text-sm text-body/70 max-w-sm mb-6">
                  {q
                    ? `No active campaigns match "${q}". Try a different search term.`
                    : 'There are no active campaigns right now. Check back later.'}
                </p>
                {q && (
                  <Link href="/campaigns">
                    <Button variant="secondary">Clear search</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaignList.map((campaign) => (
                  <CampaignCard key={campaign.slug} {...campaign} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
