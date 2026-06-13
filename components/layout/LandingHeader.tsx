import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui';

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between py-6 max-w-7xl mx-auto w-full px-12">
      <Link href="/">
        <Image src="/logo/Altar Logo_white.svg" alt="Altar" width={115} height={32} className="h-8 w-auto" priority />
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/auth">
          <Button variant="secondary" className="text-white hover:bg-transparent">Log in</Button>
        </Link>
        <Link href="/auth?mode=register">
          <Button variant="ghost">Get started</Button>
        </Link>
      </div>
    </header>
  );
}
