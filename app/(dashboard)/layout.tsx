import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        {children}
      </main>
    </div>
  );
}
