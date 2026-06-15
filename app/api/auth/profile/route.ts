import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, userRepository, storageService } from '@/lib/services';

export async function PATCH(req: NextRequest) {
  try {
    const user = await authService.verifyAuthWithFallback(req);
    if (!user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const phone = formData.get('phone') as string | null;
    const profilePictureFile = formData.get('profilePicture') as File | null;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Name is required' } }, { status: 400 });
    }

    let profilePicture: string | undefined;

    if (profilePictureFile && profilePictureFile.size > 0) {
      if (profilePictureFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Profile picture must be under 2MB' } }, { status: 400 });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(profilePictureFile.type)) {
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Profile picture must be JPEG, PNG, or WebP' } }, { status: 400 });
      }

      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      const base64 = `data:${profilePictureFile.type};base64,${buffer.toString('base64')}`;
      profilePicture = await storageService.uploadPublicImage(base64, 'profiles');
    }

    const updateData: Record<string, string> = { name: name.trim() };
    if (phone !== null) updateData.phone = phone.trim() || '';
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updated = await userRepository.update(user.userId, updateData);

    return NextResponse.json({
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        profilePicture: updated.profilePicture,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/auth/profile]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
