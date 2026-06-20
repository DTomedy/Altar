import 'server-only';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui';
import { CampaignCard } from './CampaignCard';

async function getActiveCampaigns() {
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  if (campaigns.length === 0) return [];

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

  return campaigns.map((c) => ({
    slug: c.slug,
    title: c.title,
    coverPhoto: c.coverPhoto,
    goalAmount: c.goalAmount ? Number(c.goalAmount) : null,
    totalRaised: raisedMap.get(c.id) || 0,
    donorCount: donorCountMap.get(c.id) || 0,
  }));
}

export async function PublicCampaignsSection() {
  const campaigns = await getActiveCampaigns();

  if (campaigns.length === 0) return null;

  return (
    <div className="bg-page w-full">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 sm:mb-12 gap-4">
          <h2
            className="font-heading font-medium text-body"
            style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)' }}
          >
            Active Campaigns
          </h2>
          <Link href="/campaigns">
            <Button variant="secondary">View all</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.slug} {...campaign} />
          ))}
        </div>
      </section>
    </div>
  );
}
