import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateContributionSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `contributions:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' }
    }, { status: 429 });
  }

  const parsed = CreateContributionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 });
  }

  const { campaignId, wishlistItemId, amount, isAnonymous, displayName, message, } = parsed.data;

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== 'ACTIVE') {
    return NextResponse.json({
      error: { code: 'CAMPAIGN_NOT_ACTIVE', message: 'Campaign is not active' }
    }, { status: 400 });
  }

  const txRef = `altar-${campaignId}-${crypto.randomUUID()}`;

  const contribution = await prisma.contribution.create({
    data: {
      campaignId,
      wishlistItemId: wishlistItemId ?? null,
      amount,
      isAnonymous,
      displayName: isAnonymous ? null : displayName,
      message,
      flwTxRef: txRef,
      status: 'PENDING',
    }
  });

  return NextResponse.json({ data: { contributionId: contribution.id, txRef } }, { status: 201 });
}
