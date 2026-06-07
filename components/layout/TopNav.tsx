import 'server-only';

import { cookies } from 'next/headers';
import { Bell } from 'lucide-react';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Avatar } from '@/components/ui';
import { PageTitle } from './PageTitle';

export async function TopNav() {
  const cookieStore = await cookies();
  const token = cookieStore.get('altar_token')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, email: true },
  });
  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-border-soft px-10 py-3 flex items-center justify-between">
      <PageTitle />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="font-body text-sm text-body/80 font-medium">{user.name}</span>
          <Avatar name={user.name} size="sm" />
        </div>

        <div className="w-px h-6 bg-border-soft" />

        <button className="relative text-body/40 hover:text-body transition-colors">
          <Bell className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
