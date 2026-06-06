import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { signToken, hashPassword } from '@/lib/auth';
import { RegisterSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = await rateLimit({ key: `register:${ip}`, limit: 3, windowMs: 60 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' } }, { status: 429 });
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
    }

    const { email, password, name, phone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'An account with this email already exists' } }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, phone },
    });

    const token = signToken({ userId: user.id, email: user.email, kycLevel: user.kycLevel });
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        kycLevel: user.kycLevel,
        kycStatus: user.kycStatus,
      },
    }, { status: 201 });

    response.cookies.set('altar_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    try {
      const emailToken = jwt.sign({ userId: user.id, type: 'email-verify' }, getSecret(), { expiresIn: '24h' });
      await sendVerificationEmail(email, emailToken);
    } catch {
      console.error('[POST /api/auth/register] Failed to send verification email');
    }

    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
