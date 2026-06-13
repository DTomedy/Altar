import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { VerifyContributionSchema } from '@/lib/validators';
import Decimal from 'decimal.js';

const AMOUNT_TOLERANCE = 0.01; // 1% tolerance for minor variations

export async function POST(req: NextRequest) {
  const parsed = VerifyContributionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 });
  }

  const { txRef } = parsed.data;

  const contribution = await prisma.contribution.findUnique({ where: { flwTxRef: txRef } });
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

  const flwResponse = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
  );
  const flwData = await flwResponse.json();

  if (
    flwData.status !== 'success' ||
    flwData.data?.status !== 'successful' ||
    flwData.data?.currency !== 'NGN'
  ) {
    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: 'FAILED' } });
    return NextResponse.json({
      error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' }
    }, { status: 400 });
  }

  const paidAmount = new Decimal(flwData.data.amount);
  const expectedAmount = new Decimal(contribution.amount);
  const allowedMin = expectedAmount.mul(1 - AMOUNT_TOLERANCE);
  const allowedMax = expectedAmount.mul(1 + AMOUNT_TOLERANCE);

  if (paidAmount.lessThan(allowedMin) || paidAmount.greaterThan(allowedMax)) {
    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: 'FAILED' } });
    return NextResponse.json({
      error: { code: 'AMOUNT_MISMATCH', message: `Paid amount (${paidAmount}) does not match expected amount (${expectedAmount})` }
    }, { status: 400 });
  }

  // Mark as SUCCESS — wallet credit is handled by the webhook
  await prisma.contribution.update({
    where: { id: contribution.id },
    data: { status: 'SUCCESS', flwTxId: String(flwData.data.id) }
  });

  return NextResponse.json({ data: { success: true } });
}
