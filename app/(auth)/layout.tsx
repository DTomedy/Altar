import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-center py-8">
        <Link href="/" className="font-display font-medium text-2xl text-primary">
          Altar
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
