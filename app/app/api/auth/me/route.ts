import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthWithFallback } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        emailVerified: true,
        kycLevel: true,
        kycStatus: true,
        bankAccountNumber: true,
        bankCode: true,
        bankName: true,
        bankAccountName: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('[GET /api/auth/me]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
