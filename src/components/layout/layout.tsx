
'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { Header } from './header';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { LoaderCircle } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  const MainLayout = ({ children }: { children: React.ReactNode }) => (
     <SidebarProvider>
        <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
                <Header />
                <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
            </div>
        </div>
    </SidebarProvider>
  );

  const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // If on the landing page and not logged in, show simple layout
  if (isLandingPage && !user) {
    return <SimpleLayout>{children}</SimpleLayout>;
  }
  
  // For all authenticated pages (including landing page if logged in), show main layout
  if (user) {
     return <MainLayout>{children}</MainLayout>;
  }

  // Fallback for any other unauthenticated pages (should be redirected by middleware, but good to have)
  return <SimpleLayout>{children}</SimpleLayout>;
}
