'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gift, Wallet, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard?create=1', label: 'Campaigns', icon: Gift },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-surface border-r border-border-soft flex flex-col shrink-0">
      <div className="p-6">
        <Link href="/">
          <Image src="/logo/Altar Logo.svg" alt="Altar" width={100} height={28} className="h-7 w-auto" priority />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 font-body font-medium px-3 py-2.5 rounded-xl transition-colors text-sm',
                isActive
                  ? 'bg-ghost text-primary'
                  : 'text-body hover:text-primary hover:bg-ghost'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border-soft">
        <Link
          href="/api/auth/logout"
          prefetch={false}
          className="flex items-center gap-3 font-body font-medium px-3 py-2.5 rounded-xl transition-colors text-sm text-muted hover:text-error hover:bg-error/5"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </Link>
      </div>
    </aside>
  );
}
