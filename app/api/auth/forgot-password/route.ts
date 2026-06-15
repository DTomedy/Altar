import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { userRepository, emailService } from '@/lib/services';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

import { z } from 'zod';

const Schema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limitResult = await rateLimit({ key: `forgot-password:${ip}`, limit: 3, windowMs: 60 * 60 * 1000 });
    if (!limitResult.success) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }, { status: 429 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
    }

    const { email } = parsed.data;

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = jwt.sign({ userId: user.id, type: 'password-reset' }, getSecret(), { expiresIn: '1h' });

    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch {
      console.error('[POST /api/auth/forgot-password] Failed to send email');
    }

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
