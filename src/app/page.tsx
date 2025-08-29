import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1">
        <DashboardClient />
      </main>
    </div>
  );
}
