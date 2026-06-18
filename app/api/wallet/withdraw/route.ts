import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthWithFallback } from '@/lib/auth';
import { WithdrawSchema } from '@/lib/validators';
import { initiateTransfer } from '@/lib/flutterwave';
import { canWithdraw } from '@/lib/kyc';
import { rateLimit } from '@/lib/rate-limit';
import Decimal from 'decimal.js';

const PLATFORM_FEE_RATE = 0.03;

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { success: allowed } = await rateLimit({
      key: `withdraw:${user.userId}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!allowed) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many withdrawal attempts. Try again later.' } },
        { status: 429 }
      );
    }

    const parsed = WithdrawSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
        { status: 422 }
      );
    }

    const { accountNumber, bankCode, amount } = parsed.data;

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || !canWithdraw(dbUser.kycLevel, amount)) {
      return NextResponse.json(
        { error: { code: 'KYC_REQUIRED', message: 'KYC Level 2 required for withdrawals up to ₦500,000' } },
        { status: 403 }
      );
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.userId } });
    if (!wallet || new Decimal(wallet.balance).lessThan(amount)) {
      return NextResponse.json(
        { error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient wallet balance' } },
        { status: 400 }
      );
    }

    const reference = `altar-withdrawal-${user.userId}-${Date.now()}`;
    const fee = Math.round(amount * PLATFORM_FEE_RATE);
    const netAmount = amount - fee;

    await prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId: user.userId },
        data: { balance: { decrement: amount } },
      });

      const walletRecord = await tx.wallet.findUnique({ where: { userId: user.userId } });
      if (!walletRecord) throw new Error('Wallet not found');

      await tx.walletTransaction.create({
        data: {
          walletId: walletRecord.id,
          type: 'DEBIT',
          amount,
          description: `Withdrawal ref: ${reference} — ₦${amount} to ${accountNumber} (fee: ₦${fee})`,
          status: 'PENDING',
        },
      });
    });

    try {
      await initiateTransfer({
        accountNumber,
        bankCode,
        amount: netAmount,
        narration: 'Altar withdrawal',
        reference,
      });

      return NextResponse.json({ data: { reference, amount: netAmount, fee } });
    } catch {
      await prisma.wallet.update({
        where: { userId: user.userId },
        data: { balance: { increment: amount } },
      });

      return NextResponse.json(
        { error: { code: 'TRANSFER_FAILED', message: 'Withdrawal failed. Funds have been returned to your wallet.' } },
        { status: 502 }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('[POST /api/wallet/withdraw]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message } }, { status: 500 });
  }
}
