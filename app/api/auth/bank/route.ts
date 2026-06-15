import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, userRepository } from '@/lib/services';

export async function PATCH(req: NextRequest) {
  try {
    const user = await authService.verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const { bankAccountNumber, bankCode, bankName, bankAccountName } = body;

    if (!bankAccountNumber || !bankCode || !bankName || !bankAccountName) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'All bank account fields are required' } }, { status: 400 });
    }

    if (!/^\d{10}$/.test(bankAccountNumber)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Bank account number must be 10 digits' } }, { status: 400 });
    }

    const updated = await userRepository.update(user.userId, {
      bankAccountNumber: bankAccountNumber.trim(),
      bankCode: bankCode.trim(),
      bankName: bankName.trim(),
      bankAccountName: bankAccountName.trim().toUpperCase(),
    });

    return NextResponse.json({
      bank: {
        bankAccountNumber: updated.bankAccountNumber,
        bankCode: updated.bankCode,
        bankName: updated.bankName,
        bankAccountName: updated.bankAccountName,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/auth/bank]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
