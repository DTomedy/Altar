import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

    // Always return success — don't reveal whether the email exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    const resetToken = jwt.sign({ userId: user.id, type: 'password-reset' }, getSecret(), { expiresIn: '1h' });
    const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'DM Sans', sans-serif; color: #2C2C2A; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3D1F6B; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 500;">Reset your Altar password</h1>
        <p style="font-size: 16px; line-height: 1.5;">We received a request to reset the password for your Altar account.</p>
        <div style="margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3D1F6B; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 50px; font-weight: 500; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #787878;">This link will expire in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({ to: email, subject: 'Reset your Altar password', html });
    } catch {
      console.error('[POST /api/auth/forgot-password] Failed to send email');
    }

    return NextResponse.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('[POST /api/auth/forgot-password]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
