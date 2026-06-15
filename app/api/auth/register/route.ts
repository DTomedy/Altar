import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { authService, emailService, userRepository } from '@/lib/services';
import { RegisterSchema } from '@/lib/validators';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

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

    const passwordHash = await authService.hashPassword(password);
    const user = await userRepository.create({ email, passwordHash, name, phone });

    if (!user) {
      return NextResponse.json({ error: { code: 'CONFLICT', message: 'An account with this email already exists' } }, { status: 409 });
    }

    try {
      const emailToken = jwt.sign({ userId: user.id, type: 'email-verify' }, getSecret(), { expiresIn: '24h' });
      await emailService.sendVerificationEmail(email, emailToken);
    } catch (emailErr) {
      console.error('[POST /api/auth/register] Failed to send verification email:', emailErr);
    }

    return NextResponse.json({
      message: 'Account created. Check your email to verify your account.',
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
