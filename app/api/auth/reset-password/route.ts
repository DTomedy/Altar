import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

interface ResetPayload {
  userId: string;
  type: string;
}

const Schema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
    }

    const { token, password } = parsed.data;

    let payload: ResetPayload;
    try {
      payload = jwt.verify(token, getSecret()) as ResetPayload;
    } catch {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired reset token' } }, { status: 401 });
    }

    if (payload.type !== 'password-reset') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid reset token' } }, { status: 401 });
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error) {
    console.error('[POST /api/auth/reset-password]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
