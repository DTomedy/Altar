import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { resolveBankAccount } from '@/lib/flutterwave';

export async function POST(req: NextRequest) {
  try {
    const { accountNumber, bankCode } = await req.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Account number and bank code are required' } },
        { status: 422 }
      );
    }

    const result = await resolveBankAccount(accountNumber, bankCode);

    return NextResponse.json({
      data: {
        accountNumber,
        bankCode,
        accountName: result.data?.account_name || 'Unknown',
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'RESOLVE_FAILED', message: 'Could not verify account details' } },
      { status: 502 }
    );
  }
}
