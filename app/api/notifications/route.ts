import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MarkReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await authService.verifyAuthWithFallback(req);
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  const [notifications, totalUnread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({
      where: { userId: user.userId, isRead: false },
    }),
  ]);

  return NextResponse.json({ data: { notifications, totalUnread } });
}

export async function PATCH(req: NextRequest) {
  const user = await authService.verifyAuthWithFallback(req);
  if (!user) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }

  const parsed = MarkReadSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } }, { status: 422 });
  }

  const { ids, all } = parsed.data;

  if (all) {
    await prisma.notification.updateMany({
      where: { userId: user.userId, isRead: false },
      data: { isRead: true },
    });
  } else if (ids && ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, userId: user.userId },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ data: { success: true } });
}
