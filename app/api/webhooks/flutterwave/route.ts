import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { paymentLogRepository } from '@/lib/services';
import { formatNaira } from '@/lib/formatters';
import Decimal from 'decimal.js';

const chargeSchema = z.object({
  id: z.number(),
  tx_ref: z.string(),
  flw_ref: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_type: z.string().optional(),
  customer: z.object({ email: z.string(), name: z.string() }),
});

const transferSchema = z.object({
  id: z.number(),
  reference: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  account_number: z.string(),
  bank_name: z.string(),
});

const webhookSchema = z.object({
  event: z.string(),
  data: z.union([chargeSchema, transferSchema]),
});

const FLW_SECRET = process.env.FLUTTERWAVE_WEBHOOK_HASH;

async function handleChargeCompleted(data: z.infer<typeof chargeSchema>) {
  const { tx_ref, status, amount, currency, id: flwTxId, payment_type } = data;

  if (status !== 'successful' || currency !== 'NGN') {
    return NextResponse.json({ data: { received: true } });
  }

  const contribution = await prisma.contribution.findUnique({
    where: { flwTxRef: tx_ref },
    include: { campaign: { select: { ownerId: true, minAmount: true, maxAmount: true } } },
  });

  if (!contribution || contribution.status === 'FAILED') {
    return NextResponse.json({ data: { received: true } });
  }

  const campaignMin = Number(contribution.campaign?.minAmount ?? 500);
  const campaignMax = Number(contribution.campaign?.maxAmount ?? 10_000_000);
  if (amount < campaignMin || amount > campaignMax) {
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { status: 'FAILED' },
    });

    void paymentLogRepository.create({
      flwTxRef: tx_ref,
      flwTxId: String(flwTxId),
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      amountExpected: Number(contribution.amount),
      amountPaid: amount,
      outcome: 'AMOUNT_MISMATCH',
      failureReason: `Webhook: paid ₦${amount} outside campaign range (₦${campaignMin} – ₦${campaignMax})`,
    });

    return NextResponse.json({ data: { received: true } });
  }

  if (new Decimal(amount).lessThan(contribution.amount)) {
    await prisma.contribution.update({
      where: { id: contribution.id },
      data: { status: 'FAILED' },
    });

    void paymentLogRepository.create({
      flwTxRef: tx_ref,
      flwTxId: String(flwTxId),
      campaignId: contribution.campaignId,
      contributionId: contribution.id,
      amountExpected: Number(contribution.amount),
      amountPaid: amount,
      outcome: 'AMOUNT_MISMATCH',
      failureReason: `Webhook: paid ₦${amount}, expected ₦${Number(contribution.amount)}`,
    });

    return NextResponse.json({ data: { received: true } });
  }

  const ownerId = contribution.campaign.ownerId;
  const isPending = contribution.status === 'PENDING';

  await prisma.$transaction(async (tx) => {
    if (isPending) {
      await tx.contribution.update({
        where: { id: contribution.id },
        data: { status: 'SUCCESS', flwTxId: String(flwTxId) },
      });
    } else if (!contribution.flwTxId) {
      await tx.contribution.update({
        where: { id: contribution.id },
        data: { flwTxId: String(flwTxId) },
      });
    }

    const existingTx = await tx.walletTransaction.findFirst({
      where: { description: { endsWith: `[${tx_ref}]` } },
    });

    if (existingTx) {
      return;
    }

    const wallet = await tx.wallet.upsert({
      where: { userId: ownerId },
      update: { balance: { increment: contribution.amount } },
      create: { userId: ownerId, balance: contribution.amount },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: contribution.amount,
        description: `Gift received — ${formatNaira(contribution.amount)} via ${payment_type ?? 'card'} [${tx_ref}]`,
        status: 'COMPLETED',
      },
    });

    if (contribution.wishlistItemId) {
      const item = await tx.wishlistItem.update({
        where: { id: contribution.wishlistItemId },
        data: { fundedAmount: { increment: contribution.amount } },
      });

      if (new Decimal(item.fundedAmount).gte(item.targetAmount)) {
        await tx.wishlistItem.update({
          where: { id: item.id },
          data: { isFulfilled: true },
        });
      }
    }

    const campaign = await tx.campaign.findUnique({
      where: { id: contribution.campaignId },
      select: { type: true, goalAmount: true, allowOverflow: true },
    });

    if (campaign?.type === 'GOAL' && campaign.goalAmount && !campaign.allowOverflow) {
      const totalRaised = await tx.contribution.aggregate({
        where: { campaignId: contribution.campaignId, status: 'SUCCESS' },
        _sum: { amount: true },
      });

      const raised = totalRaised._sum.amount ?? new Decimal(0);
      if (new Decimal(raised).gte(campaign.goalAmount)) {
        await tx.campaign.update({
          where: { id: contribution.campaignId },
          data: { status: 'GOAL_REACHED' },
        });
      }
    }
  });

  void paymentLogRepository.create({
    flwTxRef: tx_ref,
    flwTxId: String(flwTxId),
    campaignId: contribution.campaignId,
    contributionId: contribution.id,
    amountExpected: Number(contribution.amount),
    amountPaid: amount,
    outcome: 'SUCCESS',
  });

  return NextResponse.json({ data: { received: true } });
}

async function handleTransferCompleted(data: z.infer<typeof transferSchema>) {
  if (!data.reference.startsWith('altar-withdrawal-')) {
    return NextResponse.json({ data: { received: true } });
  }

  const newStatus = data.status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED';

  await prisma.walletTransaction.updateMany({
    where: { description: { contains: data.reference } },
    data: { status: newStatus },
  });

  return NextResponse.json({ data: { received: true } });
}

export async function POST(req: NextRequest) {
  const hash = req.headers.get('verif-hash');
  if (!hash || !FLW_SECRET || hash !== FLW_SECRET) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' },
    }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({
      error: { code: 'BAD_REQUEST', message: 'Failed to parse webhook payload' },
    }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload' },
    }, { status: 422 });
  }

  const { event, data } = parsed.data;

  switch (event) {
    case 'charge.completed':
      return handleChargeCompleted(data as z.infer<typeof chargeSchema>);
    case 'transfer.completed':
      return handleTransferCompleted(data as z.infer<typeof transferSchema>);
    default:
      return NextResponse.json({ data: { received: true } });
  }
}
