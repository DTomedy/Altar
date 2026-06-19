import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contributionRepository, paymentService, paymentLogRepository, campaignRepository } from '@/lib/services';
import { VerifyContributionSchema } from '@/lib/validators';
import { formatNaira } from '@/lib/formatters';
import Decimal from 'decimal.js';

export async function POST(req: NextRequest) {
  const parsed = VerifyContributionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
      { status: 422 },
    );
  }

  const { txRef } = parsed.data;

  const contribution = await contributionRepository.findByTxRef(txRef);
  if (!contribution) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Contribution not found' } },
      { status: 404 },
    );
  }

  if (contribution.status === 'SUCCESS') {
    return NextResponse.json({ data: { alreadyVerified: true } });
  }

  if (contribution.status === 'FAILED') {
    return NextResponse.json(
      { error: { code: 'ALREADY_FAILED', message: 'This payment attempt has failed' } },
      { status: 400 },
    );
  }

  // ── Validate contribution amount against campaign range ───────────────────
  const campaign = await campaignRepository.findById(contribution.campaignId);
  if (campaign) {
    const campaignMin = Number(campaign.minAmount);
    const campaignMax = Number(campaign.maxAmount);
    const contribAmount = Number(contribution.amount);
    if (contribAmount < campaignMin || contribAmount > campaignMax) {
      await contributionRepository.update(contribution.id, { status: 'FAILED' });
      void paymentLogRepository.create({
        flwTxRef: txRef,
        campaignId: contribution.campaignId,
        contributionId: contribution.id,
        amountExpected: contribAmount,
        outcome: 'FAILED',
        failureReason: `Amount ${formatNaira(contribAmount)} outside campaign range (${formatNaira(campaignMin)} – ${formatNaira(campaignMax)})`,
      });
      return NextResponse.json(
        { error: { code: 'AMOUNT_OUT_OF_RANGE', message: 'Contribution amount is outside the allowed range for this campaign' } },
        { status: 422 },
      );
    }
  }

  // ── Verify with Flutterwave (server-side — non-negotiable) ────────────────
  let flwResponse: {
    status: string;
    data?: {
      status?: string;
      currency?: string;
      amount?: number;
      id?: number;
      payment_type?: string;
    };
  };

  try {
    flwResponse = (await paymentService.verifyTransaction(txRef)) as typeof flwResponse;
  } catch {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });

    void paymentLogRepository.create({
      flwTxRef: txRef,
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      amountExpected: Number(contribution.amount),
      outcome: 'VERIFICATION_ERROR',
      failureReason: 'Flutterwave API call failed',
    });

    return NextResponse.json(
      { error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' } },
      { status: 400 },
    );
  }

  if (
    flwResponse.status !== 'success' ||
    flwResponse.data?.status !== 'successful' ||
    flwResponse.data?.currency !== 'NGN'
  ) {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });

    void paymentLogRepository.create({
      flwTxRef: txRef,
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      amountExpected: Number(contribution.amount),
      amountPaid: flwResponse.data?.amount ?? null,
      outcome: 'FAILED',
      failureReason: `Flutterwave status: ${flwResponse.data?.status ?? 'unknown'}, currency: ${flwResponse.data?.currency ?? 'unknown'}`,
    });

    return NextResponse.json(
      { error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' } },
      { status: 400 },
    );
  }

  // ── Amount check: paidAmount must be >= expectedAmount ────────────────────
  // No tolerance band. Overpayment is allowed. Underpayment is always rejected.
  const paidAmount = new Decimal(flwResponse.data!.amount!);
  const expectedAmount = new Decimal(contribution.amount);

  if (paidAmount.lessThan(expectedAmount)) {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });

    void paymentLogRepository.create({
      flwTxRef: txRef,
      flwTxId: String(flwResponse.data!.id!),
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      amountExpected: Number(contribution.amount),
      amountPaid: flwResponse.data!.amount!,
      outcome: 'AMOUNT_MISMATCH',
      failureReason: `Paid ₦${paidAmount.toFixed(2)}, expected ₦${expectedAmount.toFixed(2)}`,
    });

    return NextResponse.json(
      {
        error: {
          code: 'AMOUNT_MISMATCH',
          message: `Amount paid (₦${paidAmount.toFixed(2)}) is less than the expected amount (₦${expectedAmount.toFixed(2)})`,
        },
      },
      { status: 400 },
    );
  }

  // ── All checks passed — mark SUCCESS ─────────────────────────────────────
  await contributionRepository.update(contribution.id, {
    status: 'SUCCESS',
    flwTxId: String(flwResponse.data!.id!),
  });

  // Update wishlist item fundedAmount if this contribution targets a specific item
  if (contribution.wishlistItemId) {
    await prisma.wishlistItem.update({
      where: { id: contribution.wishlistItemId },
      data: { fundedAmount: { increment: contribution.amount } },
    });

    const updatedItem = await prisma.wishlistItem.findUnique({
      where: { id: contribution.wishlistItemId },
      select: { fundedAmount: true, targetAmount: true },
    });

    if (updatedItem && Number(updatedItem.fundedAmount) >= Number(updatedItem.targetAmount)) {
      await prisma.wishlistItem.update({
        where: { id: contribution.wishlistItemId },
        data: { isFulfilled: true },
      });
    }
  }

  void paymentLogRepository.create({
    flwTxRef: txRef,
    flwTxId: String(flwResponse.data!.id!),
    campaignId: contribution.campaignId,
    contributionId: contribution.id,
    amountExpected: Number(contribution.amount),
    amountPaid: flwResponse.data!.amount!,
    outcome: 'SUCCESS',
  });

  return NextResponse.json({ data: { success: true } });
}
