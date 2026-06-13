import Link from 'next/link';
import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-center py-8">
        <Link href="/">
          <Image src="/logo/Altar Logo.svg" alt="Altar" width={100} height={28} className="h-7 w-auto" />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
    </div>
  );
}
