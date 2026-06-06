# Skills/webhook-handler/webhook-handler.md — Altar

> Read before implementing or modifying Flutterwave webhook handling.

---

## Overview

The webhook handler is the **safety net** for all Flutterwave payment events. It fires when a contributor closes the browser before the client-side verify step completes, and also handles transfer completion notifications.

**Canonical implementation:** `Skills/flutterwave-integration/resources/webhook-handler.ts`
**Deploy to:** `app/api/webhooks/flutterwave/route.ts`

---

## Key Rules

1. **Always verify the webhook signature** — check the `verif-hash` header against `FLUTTERWAVE_WEBHOOK_HASH`. Never process an unverified webhook.
2. **Never double-credit** — check `contribution.status === 'SUCCESS'` before crediting a wallet. Flutterwave may redeliver the same event.
3. **Use `$transaction`** for all state-changing operations. If any step fails, all changes roll back.
4. **Validate with Zod** before processing the webhook payload. Never trust raw JSON from external sources.

---

## Event Routing

| Event | Purpose |
|---|---|
| `charge.completed` | A contribution payment succeeded. Credit the campaign owner's wallet. |
| `transfer.completed` | A withdrawal transfer settled or failed. Update the wallet transaction. |

All other events are acknowledged and ignored.

---

## Implementation

```ts
// app/api/webhooks/flutterwave/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { formatNaira } from '@/lib/formatters'
import Decimal from 'decimal.js'

// ── Zod schemas ──────────────────────────────────────────────────────────────

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

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const hash = req.headers.get('verif-hash')
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    console.error(JSON.stringify({ level: 'warn', event: 'webhook.unauthorized' }))
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' }
    }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    console.error(JSON.stringify({ level: 'error', event: 'webhook.parse_failed' }))
    return NextResponse.json({
      error: { code: 'BAD_REQUEST', message: 'Failed to parse webhook payload' }
    }, { status: 400 })
  }

  const parsed = webhookSchema.safeParse(raw)
  if (!parsed.success) {
    console.error(JSON.stringify({ level: 'error', event: 'webhook.validation_failed', details: parsed.error.flatten() }))
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook payload', details: parsed.error.flatten() }
    }, { status: 422 })
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

// ── Handler: charge.completed ────────────────────────────────────────────────

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

  // Verify amount with Decimal precision
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

    // Auto-fulfill wishlist item if fully funded
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

    // Auto-close goal campaign if target reached
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

// ── Handler: transfer.completed ──────────────────────────────────────────────

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

// ── Types ────────────────────────────────────────────────────────────────────

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
```

---

## Testing Locally

To test the webhook locally, expose your dev server with ngrok:

```bash
npx ngrok http 3000
```

Update the webhook URL in your Flutterwave dashboard to `https://<ngrok-url>/api/webhooks/flutterwave` and set `FLUTTERWAVE_WEBHOOK_HASH` to the dashboard-provided secret.
