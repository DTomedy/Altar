import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-center py-8">
        <Link href="/">
          <img src="/logo/Altar Logo.svg" alt="Altar" className="h-7 w-auto" />
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
