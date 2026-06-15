import { NextRequest, NextResponse } from 'next/server';
import {
  campaignRepository,
  contributionRepository,
  paymentLogRepository,
} from '@/lib/services';
import { CreateContributionSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { formatNaira } from '@/lib/formatters';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const MIN_CONTRIBUTION = 500;
const MAX_CONTRIBUTION = 10_000_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `contributions:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429 },
    );
  }

  const parsed = CreateContributionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  const { campaignId, wishlistItemId, amount, isAnonymous, displayName, message } = parsed.data;

  // ── Campaign validation ───────────────────────────────────────────────────
  const campaign = await campaignRepository.findById(campaignId);
  if (!campaign || campaign.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: { code: 'CAMPAIGN_NOT_ACTIVE', message: 'Campaign is not active' } },
      { status: 400 },
    );
  }

  // ── Server-side price guard ───────────────────────────────────────────────
  // Validate amount against global bounds AND campaign-specific range.
  if (amount < MIN_CONTRIBUTION || amount > MAX_CONTRIBUTION) {
    return NextResponse.json(
      {
        error: {
          code: 'AMOUNT_OUT_OF_RANGE',
          message: `Contribution must be between ₦${MIN_CONTRIBUTION.toLocaleString()} and ₦${MAX_CONTRIBUTION.toLocaleString()}`,
        },
      },
      { status: 422 },
    );
  }

  const campaignMin = Number(campaign.minAmount);
  const campaignMax = Number(campaign.maxAmount);
  if (amount < campaignMin || amount > campaignMax) {
    return NextResponse.json(
      {
        error: {
          code: 'CAMPAIGN_AMOUNT_RANGE',
          message: `Gifts for this campaign must be between ${formatNaira(campaignMin)} and ${formatNaira(campaignMax)}`,
        },
      },
      { status: 422 },
    );
  }

  // ── Wishlist item validation (server-side) ────────────────────────────────
  // If a wishlistItemId is provided, verify the item belongs to this campaign
  // and that it has not already been fulfilled.
  if (wishlistItemId) {
    const item = await prisma.wishlistItem.findUnique({
      where: { id: wishlistItemId },
      select: { campaignId: true, isFulfilled: true, targetAmount: true },
    });

    if (!item || item.campaignId !== campaignId) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: 'Wishlist item not found on this campaign' } },
        { status: 404 },
      );
    }

    if (item.isFulfilled) {
      return NextResponse.json(
        { error: { code: 'ITEM_FULFILLED', message: 'This wishlist item has already been fulfilled' } },
        { status: 400 },
      );
    }
  }

  // ── Create contribution + write INITIATED log (non-atomic but best-effort) ─
  const txRef = `altar-${campaignId}-${crypto.randomUUID()}`;

  const contribution = await contributionRepository.create({
    campaignId,
    wishlistItemId: wishlistItemId ?? null,
    amount,
    isAnonymous,
    displayName: isAnonymous ? null : displayName,
    message,
    flwTxRef: txRef,
  });

  // Fire-and-forget: log the initiation. Do not block the response on this.
  void paymentLogRepository.create({
    flwTxRef: txRef,
    campaignId,
    contributionId: contribution.id,
    amountExpected: amount,
    outcome: 'INITIATED',
    ipAddress: ip,
  });

  return NextResponse.json({ data: { contributionId: contribution.id, txRef } }, { status: 201 });
}
