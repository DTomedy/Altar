import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, campaignRepository, storageService } from '@/lib/services';
import { CreateCampaignSchema } from '@/lib/validators';
import { generateUniqueSlug } from '@/lib/slugs';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get('altar_token')?.value;
  if (!token) return null;
  const payload = authService.verifyToken(token);
  return payload?.userId ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { success: allowed } = await rateLimit({ key: `create-campaign:${userId}`, limit: 10, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } }, { status: 429 });
    }

    const body = await req.json();
    const parsed = CreateCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
    }

    const { title, description, type, goalAmount, deadline, coverPhoto, allowOverflow } = parsed.data;

    const coverPhotoUrl = await storageService.uploadPublicImage(coverPhoto, 'campaigns');

    const slug = await generateUniqueSlug(title, async (s: string) => {
      const existing = await campaignRepository.findBySlug(s);
      return existing !== null;
    });

    await prisma.wallet.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    const campaign = await campaignRepository.create({
      slug,
      title,
      description,
      type,
      coverPhoto: coverPhotoUrl,
      goalAmount: goalAmount ?? null,
      deadline: deadline ? new Date(deadline) : null,
      allowOverflow,
      ownerId: userId,
    });

    return NextResponse.json({ id: campaign.id, slug: campaign.slug }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/campaigns]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
