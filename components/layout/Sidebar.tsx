'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import { LayoutDashboard, Gift, Wallet, Settings, LogOut, X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from './SidebarProvider';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/campaigns', label: 'Campaigns', icon: Gift },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, open, close } = useSidebar();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleLinkClick = useCallback(() => {
    close();
  }, [close]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between p-6">
          <Image src="/logo/Altar Logo.svg" alt="Altar" width={100} height={28} className="h-7 w-auto" priority />
        <button
          onClick={close}
          className="lg:hidden p-2 text-body/60 hover:text-body transition-colors rounded-lg hover:bg-ghost"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
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
              onClick={handleLinkClick}
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
          onClick={handleLinkClick}
          className="flex items-center gap-3 font-body font-medium px-3 py-2.5 rounded-xl transition-colors text-sm text-muted hover:text-error hover:bg-error/5"
        >
          <LogOut className="w-5 h-5" />
          Log out
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Floating hamburger — mobile only, shown when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={open}
          className="lg:hidden fixed top-3 left-3 z-40 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-border-soft text-body/60 hover:text-body hover:bg-ghost shadow-sm"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-surface flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:min-h-screen lg:border-r lg:border-border-soft',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
