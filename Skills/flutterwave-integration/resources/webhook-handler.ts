// Skills/flutterwave-integration/resources/webhook-handler.ts
// Full Flutterwave webhook handler — referenced by rules/security.md and Skills/flutterwave-integration/SKILL.md.
//
// Copy to: app/api/webhooks/flutterwave/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { formatNaira } from '@/lib/formatters'
import Decimal from 'decimal.js'

const chargeSchema = z.object({
  id: z.number(),
  tx_ref: z.string(),
  flw_ref: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_type: z.string().optional(),
  customer: z.object({ email: z.string(), name: z.string() }),
})

const transferSchema = z.object({
  id: z.number(),
  reference: z.string(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
  account_number: z.string(),
  bank_name: z.string(),
})

const webhookSchema = z.object({
  event: z.string(),
  data: z.union([chargeSchema, transferSchema]),
})

export async function POST(req: NextRequest) {
  const hash = req.headers.get('verif-hash')
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    console.error(JSON.stringify({ level: 'warn', event: 'webhook.unauthorized' }))
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' } },
      { status: 401 }
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    console.error(JSON.stringify({ level: 'error', event: 'webhook.parse_failed' }))
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Failed to parse webhook payload' } },
      { status: 400 }
    )
  }

  const parsed = webhookSchema.safeParse(raw)
  if (!parsed.success) {
    console.error(JSON.stringify({ level: 'error', event: 'webhook.validation_failed', details: parsed.error.flatten() }))
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload', details: parsed.error.flatten() } },
      { status: 422 }
    )
  }

  const { event, data } = parsed.data

  switch (event) {
    case 'charge.completed':
      return handleChargeCompleted(data as FlutterwaveChargeData)
    case 'transfer.completed':
      return handleTransferCompleted(data as FlutterwaveTransferData)
    default:
      return NextResponse.json({ data: { received: true } })
  }
}

async function handleChargeCompleted(data: FlutterwaveChargeData) {
  const { tx_ref, status, amount, currency, id: flwTxId } = data

  if (status !== 'successful' || currency !== 'NGN') {
    return NextResponse.json({ data: { received: true } })
  }

  const contribution = await prisma.contribution.findUnique({
    where: { flwTxRef: tx_ref },
    include: { campaign: { select: { ownerId: true } } },
  })

  if (!contribution) {
    console.warn(JSON.stringify({ level: 'warn', event: 'webhook.contribution_not_found', txRef: tx_ref }))
    return NextResponse.json({ data: { received: true } })
  }

  if (contribution.status === 'SUCCESS') {
    return NextResponse.json({ data: { received: true } })
  }

  if (new Decimal(amount).lessThan(contribution.amount)) {
    console.error(JSON.stringify({
      level: 'error', event: 'webhook.amount_mismatch', txRef: tx_ref,
      expected: contribution.amount.toString(), received: amount,
    }))
    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: 'FAILED' } })
    return NextResponse.json({ data: { received: true } })
  }

  const ownerId = contribution.campaign.ownerId

  await prisma.$transaction(async (tx) => {
    await tx.contribution.update({
      where: { id: contribution.id },
      data: { status: 'SUCCESS', flwTxId: String(flwTxId) },
    })

    const wallet = await tx.wallet.upsert({
      where: { userId: ownerId },
      update: { balance: { increment: contribution.amount } },
      create: { userId: ownerId, balance: contribution.amount },
    })

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: contribution.amount,
        description: `Gift received — ${formatNaira(contribution.amount)} via ${data.payment_type ?? 'card'}`,
        status: 'COMPLETED',
      },
    })

    if (contribution.wishlistItemId) {
      const item = await tx.wishlistItem.update({
        where: { id: contribution.wishlistItemId },
        data: { fundedAmount: { increment: contribution.amount } },
      })

      if (new Decimal(item.fundedAmount).gte(item.targetAmount)) {
        await tx.wishlistItem.update({
          where: { id: item.id },
          data: { isFulfilled: true },
        })
      }
    }

    const campaign = await tx.campaign.findUnique({
      where: { id: contribution.campaignId },
      select: { type: true, goalAmount: true, allowOverflow: true },
    })

    if (campaign?.type === 'GOAL' && campaign.goalAmount && !campaign.allowOverflow) {
      const totalRaised = await tx.contribution.aggregate({
        where: { campaignId: contribution.campaignId, status: 'SUCCESS' },
        _sum: { amount: true },
      })

      const raised = totalRaised._sum.amount ?? new Decimal(0)
      if (new Decimal(raised).gte(campaign.goalAmount)) {
        await tx.campaign.update({
          where: { id: contribution.campaignId },
          data: { status: 'GOAL_REACHED' },
        })
      }
    }
  })

  console.info(JSON.stringify({
    level: 'info', event: 'webhook.charge_credited',
    txRef: tx_ref, amount: contribution.amount.toString(),
  }))
  return NextResponse.json({ data: { received: true } })
}

async function handleTransferCompleted(data: FlutterwaveTransferData) {
  if (!data.reference.startsWith('altar-withdrawal-')) {
    return NextResponse.json({ data: { received: true } })
  }

  const newStatus = data.status === 'SUCCESSFUL' ? 'COMPLETED' : 'FAILED'

  await prisma.walletTransaction.updateMany({
    where: { description: { contains: data.reference } },
    data: { status: newStatus },
  })

  console.info(JSON.stringify({
    level: 'info', event: 'webhook.transfer_updated',
    reference: data.reference, status: newStatus,
  }))
  return NextResponse.json({ data: { received: true } })
}

interface FlutterwaveChargeData {
  id: number
  tx_ref: string
  flw_ref: string
  status: string
  amount: number
  currency: string
  payment_type?: string
  customer: { email: string; name: string }
}

interface FlutterwaveTransferData {
  id: number
  reference: string
  status: string
  amount: number
  currency: string
  account_number: string
  bank_name: string
}
