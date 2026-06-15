import { NextRequest, NextResponse } from 'next/server';
import { contributionRepository, paymentService } from '@/lib/services';
import { VerifyContributionSchema } from '@/lib/validators';
import Decimal from 'decimal.js';

const AMOUNT_TOLERANCE = 0.01;

export async function POST(req: NextRequest) {
  const parsed = VerifyContributionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 });
  }

  const { txRef } = parsed.data;

  const contribution = await contributionRepository.findByTxRef(txRef);
  if (!contribution) {
    return NextResponse.json({
      error: { code: 'NOT_FOUND', message: 'Contribution not found' }
    }, { status: 404 });
  }

  if (contribution.status === 'SUCCESS') {
    return NextResponse.json({ data: { alreadyVerified: true } });
  }

  if (contribution.status === 'FAILED') {
    return NextResponse.json({
      error: { code: 'ALREADY_FAILED', message: 'This payment attempt has failed' }
    }, { status: 400 });
  }

  let flwResponse: { status: string; data?: { status?: string; currency?: string; amount?: number; id?: number } };
  try {
    flwResponse = await paymentService.verifyTransaction(txRef) as typeof flwResponse;
  } catch {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });
    return NextResponse.json({
      error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' }
    }, { status: 400 });
  }

  if (
    flwResponse.status !== 'success' ||
    flwResponse.data?.status !== 'successful' ||
    flwResponse.data?.currency !== 'NGN'
  ) {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });
    return NextResponse.json({
      error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' }
    }, { status: 400 });
  }

  const paidAmount = new Decimal(flwResponse.data!.amount!);
  const expectedAmount = new Decimal(contribution.amount);
  const allowedMin = expectedAmount.mul(1 - AMOUNT_TOLERANCE);
  const allowedMax = expectedAmount.mul(1 + AMOUNT_TOLERANCE);

  if (paidAmount.lessThan(allowedMin) || paidAmount.greaterThan(allowedMax)) {
    await contributionRepository.update(contribution.id, { status: 'FAILED' });
    return NextResponse.json({
      error: { code: 'AMOUNT_MISMATCH', message: `Paid amount (${paidAmount}) does not match expected amount (${expectedAmount})` }
    }, { status: 400 });
  }

  await contributionRepository.update(contribution.id, {
    status: 'SUCCESS',
    flwTxId: String(flwResponse.data!.id!),
  });

  return NextResponse.json({ data: { success: true } });
}
