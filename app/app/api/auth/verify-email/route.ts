import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

interface EmailVerifyPayload {
  userId: string;
  type: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Verification token is required' } }, { status: 422 });
    }

    let payload: EmailVerifyPayload;
    try {
      payload = jwt.verify(token, getSecret()) as EmailVerifyPayload;
    } catch {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired verification token' } }, { status: 401 });
    }

    if (payload.type !== 'email-verify') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid verification token' } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: payload.userId },
      data: { emailVerified: true, kycLevel: user.kycLevel < 1 ? 1 : user.kycLevel },
    });

    // Redirect to dashboard with success message
    const redirectUrl = new URL('/dashboard', req.url);
    redirectUrl.searchParams.set('verified', 'true');
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('[GET /api/auth/verify-email]', error);
    return NextResponse.redirect(new URL('/auth?mode=login&error=verification_failed', req.url));
  }
}
