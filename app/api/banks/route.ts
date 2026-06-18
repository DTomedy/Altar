import 'server-only';

import { NextResponse } from 'next/server';
import { getNigerianBanks } from '@/lib/flutterwave';

export async function GET() {
  try {
    const result = await getNigerianBanks();
    const banks: { code: string; name: string }[] = (result.data || []).map(
      (b: { code: string; name: string }) => ({ code: b.code, name: b.name })
    );
    return NextResponse.json({ data: banks });
  } catch {
    return NextResponse.json(
      { error: { code: 'BANK_FETCH_FAILED', message: 'Unable to fetch bank list' } },
      { status: 502 }
    );
  }
}
