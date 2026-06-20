import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { MobileNav } from './MobileNav';

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between py-6 max-w-7xl mx-auto w-full px-4 sm:px-12">
      <Link href="/">
        <Image src="/logo/Altar Logo_white.svg" alt="Altar" width={115} height={32} className="h-8 w-auto" priority />
      </Link>
      <nav className="hidden md:flex items-center gap-6">
        <Link href="/#features" className="font-body text-sm text-white/80 hover:text-white transition-colors">
          Features
        </Link>
        <Link href="/#how-it-works" className="font-body text-sm text-white/80 hover:text-white transition-colors">
          How it works
        </Link>
        <Link href="/campaigns" className="font-body text-sm text-white/80 hover:text-white transition-colors">
          Campaigns
        </Link>
      </nav>
      <div className="hidden md:flex items-center gap-4">
        <Link href="/auth">
          <Button variant="secondary" className="text-white hover:bg-transparent">Log in</Button>
        </Link>
        <Link href="/auth?mode=register">
          <Button variant="ghost">Get started</Button>
        </Link>
      </div>
      <MobileNav />
    </header>
  );
}
