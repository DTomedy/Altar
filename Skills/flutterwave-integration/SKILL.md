# Skills/flutterwave-integration/SKILL.md — Altar

> Read before any payment initiation, verification, transfer, or webhook work.

---

## Overview

Altar uses Flutterwave as its **sole payment gateway**. All contribution payments flow through Flutterwave. Withdrawals are processed via Flutterwave's Transfer API to the campaign owner's linked bank account.

**API Reference:** https://developer.flutterwave.com/docs

---

## Environment Variables Required

```bash
FLUTTERWAVE_PUBLIC_KEY=     # Used client-side for Flutterwave inline JS
FLUTTERWAVE_SECRET_KEY=     # Used server-side only — never expose to client
FLUTTERWAVE_WEBHOOK_HASH=   # Used to verify incoming webhook signatures
NEXT_PUBLIC_FLW_PUBLIC_KEY= # Public key safe for client bundle
```

---

## Payment Flow — Step by Step

### Step 1 — Frontend initiates payment

The contributor's browser loads the Flutterwave inline payment modal. Never redirect to an external page — use the inline modal.

```tsx
// components/contribution/PaymentButton.tsx
'use client'
import Script from 'next/script'
import { formatNaira } from '@/lib/formatters'

interface PaymentButtonProps {
  amount: number
  campaignId: string
  wishlistItemId?: string
  displayName: string
  isAnonymous: boolean
  email: string        // Required by Flutterwave — use a platform email for anonymous donors
  onSuccess: (txRef: string) => void
  onClose: () => void
}

export function PaymentButton({
  amount, campaignId, wishlistItemId, displayName,
  isAnonymous, email, onSuccess, onClose
}: PaymentButtonProps) {

  // Generate tx_ref client-side — format: altar-{campaignId}-{random}
  const txRef = `altar-${campaignId}-${crypto.randomUUID()}`

  function handlePay() {
    // @ts-ignore — FlutterwaveCheckout is injected via Script tag
    FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLW_PUBLIC_KEY,
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      payment_options: 'card, banktransfer, ussd',
      customer: {
        email: isAnonymous ? 'anonymous@altar.app' : email,
        name: isAnonymous ? 'Anonymous' : displayName,
      },
      meta: {
        campaignId,
        wishlistItemId: wishlistItemId ?? null,
        isAnonymous,
        displayName: isAnonymous ? null : displayName,
      },
      customizations: {
        title: 'Altar',
        description: 'Give with intention.',
        logo: '/logo.png',
      },
      callback: (response: { tx_ref: string; status: string }) => {
        if (response.status === 'successful') {
          onSuccess(response.tx_ref)
        }
      },
      onclose: onClose,
    })
  }

  return (
    <>
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />
      <button
        onClick={handlePay}
        className="font-body font-medium rounded-full px-6 py-2.5 bg-primary text-white border-none cursor-pointer transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Give {formatNaira(amount)}
      </button>
    </>
  )
}
```

---

### Step 2 — Backend pre-registers the contribution (PENDING)

Before the user pays, create a PENDING contribution record so the transaction reference exists in the database.

```ts
// app/api/contributions/route.ts (POST)
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const createContributionSchema = z.object({
  campaignId: z.string().min(1),
  wishlistItemId: z.string().optional(),
  amount: z.number().positive(),
  isAnonymous: z.boolean(),
  displayName: z.string().optional(),
  message: z.string().optional(),
  txRef: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const parsed = createContributionSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 })
  }

  const { campaignId, wishlistItemId, amount, isAnonymous, displayName, message, txRef } = parsed.data

  // Validate campaign exists and is active
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } })
  if (!campaign || campaign.status !== 'ACTIVE') {
    return NextResponse.json({
      error: { code: 'CAMPAIGN_NOT_ACTIVE', message: 'Campaign is not active' }
    }, { status: 400 })
  }

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
  })

  return NextResponse.json({ data: { contributionId: contribution.id } }, { status: 201 })
}
```

---

### Step 3 — Frontend calls verify endpoint after modal callback

```ts
// app/api/contributions/verify/route.ts (POST)
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import Decimal from 'decimal.js'

const verifySchema = z.object({
  txRef: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const parsed = verifySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 })
  }

  const { txRef } = parsed.data

  // 1. Fetch the contribution record
  const contribution = await prisma.contribution.findUnique({ where: { flwTxRef: txRef } })
  if (!contribution) {
    return NextResponse.json({
      error: { code: 'NOT_FOUND', message: 'Contribution not found' }
    }, { status: 404 })
  }
  if (contribution.status === 'SUCCESS') {
    return NextResponse.json({ data: { alreadyVerified: true } })
  }

  // 2. Verify with Flutterwave — CRITICAL: always verify server-side
  const flwResponse = await fetch(
    `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
    { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
  )
  const flwData = await flwResponse.json()

  if (
    flwData.status !== 'success' ||
    flwData.data?.status !== 'successful' ||
    flwData.data?.currency !== 'NGN'
  ) {
    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: 'FAILED' } })
    return NextResponse.json({
      error: { code: 'VERIFICATION_FAILED', message: 'Payment verification failed' }
    }, { status: 400 })
  }

  // Verify amount matches (use Decimal for precision)
  const paidAmount = new Decimal(flwData.data.amount)
  if (paidAmount.lessThan(contribution.amount)) {
    await prisma.contribution.update({ where: { id: contribution.id }, data: { status: 'FAILED' } })
    return NextResponse.json({
      error: { code: 'AMOUNT_MISMATCH', message: 'Paid amount is less than expected' }
    }, { status: 400 })
  }

  // 3. Credit wallet and update contribution atomically
  await prisma.$transaction(async (tx) => {
    await tx.contribution.update({
      where: { id: contribution.id },
      data: { status: 'SUCCESS', flwTxId: String(flwData.data.id) }
    })

    const campaign = await tx.campaign.findUnique({ where: { id: contribution.campaignId } })
    if (!campaign) throw new Error('Campaign not found')

    await tx.wallet.upsert({
      where: { userId: campaign.ownerId },
      update: { balance: { increment: contribution.amount } },
      create: { userId: campaign.ownerId, balance: contribution.amount }
    })

    const wallet = await tx.wallet.findUnique({ where: { userId: campaign.ownerId } })
    if (!wallet) throw new Error('Wallet not found')

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: contribution.amount,
        description: `Contribution via ${flwData.data.payment_type}`,
      }
    })

    // Update wishlist item funded amount if applicable
    if (contribution.wishlistItemId) {
      await tx.wishlistItem.update({
        where: { id: contribution.wishlistItemId },
        data: { fundedAmount: { increment: contribution.amount } }
      })
    }
  })

  return NextResponse.json({ data: { success: true } })
}
```

---

### Step 4 — Webhook as the safety net

The webhook handles cases where the user closes the browser before Step 3 completes. See `Skills/flutterwave-integration/resources/webhook-handler.ts` for the full implementation.

```ts
// app/api/webhooks/flutterwave/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  // 1. Verify webhook signature — non-negotiable
  const hash = req.headers.get('verif-hash')
  if (!hash || hash !== process.env.FLUTTERWAVE_WEBHOOK_HASH) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid webhook signature' }
    }, { status: 401 })
  }

  const event = await req.json()

  // Only process successful charge events
  if (event.event !== 'charge.completed' || event.data.status !== 'successful') {
    return NextResponse.json({ data: { received: true } })
  }

  const txRef = event.data.tx_ref

  // 2. Idempotency check — skip if already processed
  const contribution = await prisma.contribution.findUnique({ where: { flwTxRef: txRef } })
  if (!contribution || contribution.status === 'SUCCESS') {
    return NextResponse.json({ data: { received: true } })
  }

  // 3. Credit wallet atomically
  await prisma.$transaction(async (tx) => {
    await tx.contribution.update({
      where: { id: contribution.id },
      data: { status: 'SUCCESS', flwTxId: String(event.data.id) }
    })

    const campaign = await tx.campaign.findUnique({ where: { id: contribution.campaignId } })
    if (!campaign) throw new Error('Campaign not found')

    await tx.wallet.upsert({
      where: { userId: campaign.ownerId },
      update: { balance: { increment: contribution.amount } },
      create: { userId: campaign.ownerId, balance: contribution.amount }
    })
  })

  return NextResponse.json({ data: { received: true } })
}
```

**Important:** The verify endpoint and the webhook may both attempt to credit the same transaction. Both check `contribution.status === 'SUCCESS'` before crediting to prevent double-credit.

---

## Withdrawal via Transfer API

Withdrawals require KYC Level 2+ and deduct a 3% platform fee (deducted from the withdrawn amount at the time of transfer).

### Transfer utility (`lib/flutterwave.ts`)

```ts
// lib/flutterwave.ts
export async function initiateTransfer(params: {
  accountNumber: string
  bankCode: string
  amount: number
  narration: string
  reference: string
}) {
  const response = await fetch('https://api.flutterwave.com/v3/transfers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account_bank: params.bankCode,
      account_number: params.accountNumber,
      amount: params.amount,
      currency: 'NGN',
      narration: params.narration,
      reference: params.reference,
      debit_currency: 'NGN',
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Transfer failed: ${error.message || response.statusText}`)
  }

  return response.json()
}
```

### Withdrawal route handler (`app/api/wallet/withdraw/route.ts`)

```ts
// app/api/wallet/withdraw/route.ts (POST)
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyAuth } from '@/lib/auth'
import { initiateTransfer } from '@/lib/flutterwave'
import Decimal from 'decimal.js'

const PLATFORM_FEE_RATE = 0.03

const withdrawSchema = z.object({
  accountNumber: z.string().regex(/^\d{10}$/),
  bankCode: z.string().min(1),
  amount: z.number().positive(),
})

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) {
    return NextResponse.json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    }, { status: 401 })
  }

  const parsed = withdrawSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() }
    }, { status: 422 })
  }

  const { accountNumber, bankCode, amount } = parsed.data

  // 1. KYC check — must be Level 2 or higher
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } })
  if (!dbUser || dbUser.kycLevel < 2) {
    return NextResponse.json({
      error: { code: 'KYC_REQUIRED', message: 'KYC Level 2 required for withdrawal' }
    }, { status: 403 })
  }

  // 2. Balance check
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } })
  if (!wallet || new Decimal(wallet.balance).lessThan(amount)) {
    return NextResponse.json({
      error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient wallet balance' }
    }, { status: 400 })
  }

  const reference = `wd-${user.userId}-${Date.now()}`
  const fee = Math.round(amount * PLATFORM_FEE_RATE)
  const netAmount = amount - fee

  // 3. Debit wallet and log transaction (atomic)
  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { userId: user.userId },
      data: { balance: { decrement: amount } }
    })

    const walletRecord = await tx.wallet.findUnique({ where: { userId: user.userId } })
    if (!walletRecord) throw new Error('Wallet not found')

    await tx.walletTransaction.create({
      data: {
        walletId: walletRecord.id,
        type: 'DEBIT',
        amount,
        description: `Withdrawal ref: ${reference} — ₦${amount} to ${accountNumber} (fee: ₦${fee})`,
      }
    })
  })

  // 4. Initiate Flutterwave transfer
  try {
    await initiateTransfer({
      accountNumber,
      bankCode,
      amount: netAmount,
      narration: 'Altar withdrawal',
      reference,
    })
    return NextResponse.json({ data: { reference, amount: netAmount, fee } })
  } catch (error) {
    // Refund the wallet if transfer fails
    await prisma.wallet.update({
      where: { userId: user.userId },
      data: { balance: { increment: amount } }
    })
    return NextResponse.json({
      error: { code: 'TRANSFER_FAILED', message: 'Withdrawal failed, funds returned to wallet' }
    }, { status: 502 })
  }
}
```

---

## Supported Payment Methods

Pass these in `payment_options` on the Flutterwave inline config:
- `card` — Debit/credit card
- `banktransfer` — Direct bank transfer
- `ussd` — USSD (works on all Nigerian networks)
- `mobilemoney` — Mobile money where applicable

---

## Resources

- Full webhook handler: `Skills/flutterwave-integration/resources/webhook-handler.ts`
- Flutterwave API docs: https://developer.flutterwave.com/docs
- Flutterwave dashboard (test/live keys): https://dashboard.flutterwave.com