import 'server-only';

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { LandingHeader } from '@/components/layout/LandingHeader';
import { LandingFooter } from '@/components/layout/LandingFooter';
import { CampaignSearch } from './CampaignSearch';

export const metadata: Metadata = {
  title: 'All Campaigns — Altar',
  description: 'Explore active campaigns on Altar. Find a campaign to support.',
};

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
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
    description: c.description,
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
            <CampaignSearch campaigns={campaignList} />
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
