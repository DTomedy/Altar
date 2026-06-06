import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, verifyPassword } from '@/lib/auth';
import { LoginSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = await rateLimit({ key: `login:${ip}`, limit: 5, windowMs: 15 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please try again later.' } }, { status: 429 });
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }, { status: 401 });
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json({ error: { code: 'ACCOUNT_LOCKED', message: `Account locked. Try again in ${remainingMin} minutes.` } }, { status: 429 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const updates: Record<string, unknown> = { failedLoginAttempts: newAttempts };
      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await prisma.user.update({ where: { id: user.id }, data: updates });

      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }, { status: 401 });
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    if (!user.emailVerified) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Please verify your email before signing in. Check your inbox for the verification link.' } }, { status: 403 });
    }

    const token = signToken({ userId: user.id, email: user.email, kycLevel: user.kycLevel, emailVerified: user.emailVerified });
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        kycLevel: user.kycLevel,
        kycStatus: user.kycStatus,
      },
    });

    response.cookies.set('altar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
