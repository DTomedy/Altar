import Link from 'next/link';
import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="bg-primary py-8 px-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
        <Image src="/logo/Altar Logo_white.svg" alt="Altar" width={85} height={24} className="h-6 w-auto" />
        <div className="flex items-center gap-6">
          <Link href="/terms" className="font-body text-xs text-white hover:text-white/80 transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="font-body text-xs text-white hover:text-white/80 transition-colors">
            Privacy Policy
          </Link>
        </div>
        <p className="font-body text-xs text-white/60 text-center">
          Give with intention. &copy; {new Date().getFullYear()} Altar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
