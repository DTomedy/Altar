'use client';

import { usePathname } from 'next/navigation';

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/wallet': 'Wallet',
  '/settings': 'Settings',
};

export function PageTitle() {
  const pathname = usePathname();
  const title = titles[pathname] || 'Dashboard';

  return (
    <h1 className="font-display font-semibold text-xl text-body">{title}</h1>
  );
}
