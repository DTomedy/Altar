'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/wallet': 'Wallet',
  '/dashboard/settings': 'Settings',
};

export function PageTitle() {
  const pathname = usePathname();
  const title = titles[pathname] || 'Dashboard';

  return (
    <h1 className="font-display font-medium text-xl text-body">{title}</h1>
  );
}
