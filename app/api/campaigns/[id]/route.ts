import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService, campaignRepository } from '@/lib/services';

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get('altar_token')?.value;
  if (!token) return null;
  const payload = authService.verifyToken(token);
  return payload?.userId ?? null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }, { status: 404 });
    }
    if (campaign.ownerId !== userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not your campaign' } }, { status: 403 });
    }
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json({ error: { code: 'INVALID_STATE', message: 'Only active campaigns can be ended' } }, { status: 422 });
    }

    await campaignRepository.update(id, { status: 'CLOSED' });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH /api/campaigns/[id]]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Campaign not found' } }, { status: 404 });
    }
    if (campaign.ownerId !== userId) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Not your campaign' } }, { status: 403 });
    }

    await campaignRepository.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/campaigns/[id]]', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }, { status: 500 });
  }
}
