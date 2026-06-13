import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthWithFallback } from '@/lib/auth';
import { uploadPublicImage } from '@/lib/cloudinary';

export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuthWithFallback(req);
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
      profilePicture = await uploadPublicImage(base64, 'profiles');
    }

    const updateData: Record<string, string> = { name: name.trim() };
    if (phone !== null) updateData.phone = phone.trim() || '';
    if (profilePicture) updateData.profilePicture = profilePicture;

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('[PATCH /api/auth/profile]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
