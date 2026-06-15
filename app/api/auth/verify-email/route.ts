import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authService, userRepository } from '@/lib/services';

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
      return NextResponse.redirect(new URL('/verify-email?error=missing', req.url));
    }

    let payload: EmailVerifyPayload;
    try {
      payload = jwt.verify(token, getSecret()) as EmailVerifyPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        return NextResponse.redirect(new URL('/verify-email?error=expired', req.url));
      }
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
    }

    if (payload.type !== 'email-verify') {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
    }

    const newKycLevel = user.kycLevel < 1 ? 1 : user.kycLevel;
    await userRepository.update(payload.userId, { emailVerified: true, kycLevel: newKycLevel });

    const authToken = authService.signToken({ userId: user.id, email: user.email, kycLevel: newKycLevel, emailVerified: true });

    const response = NextResponse.json({ success: true });
    response.cookies.set('altar_token', authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('[GET /api/auth/verify-email]', error);
    return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url));
  }
}
