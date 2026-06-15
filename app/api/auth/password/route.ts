import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, userRepository } from '@/lib/services';

export async function PATCH(req: NextRequest) {
  try {
    const user = await authService.verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'All password fields are required' } }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters' } }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'New passwords do not match' } }, { status: 400 });
    }

    const dbUser = await userRepository.findById(user.userId);
    if (!dbUser) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    const isValid = await authService.verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } }, { status: 400 });
    }

    const newHash = await authService.hashPassword(newPassword);
    await userRepository.update(user.userId, { passwordHash: newHash });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('[PATCH /api/auth/password]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
