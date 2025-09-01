
'use client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { Header } from './header';
import { usePathname } from 'next/navigation';

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';

  // For auth pages, render children without the main layout
  if (isAuthPage) {
    return <main>{children}</main>;
  }
  
  const MainLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex flex-col flex-1">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );

  // For landing page, render with a simplified layout (no sidebar if you prefer)
  if (isLandingPage) {
      return (
        <SidebarProvider>
         <MainLayout>{children}</MainLayout>
        </SidebarProvider>
      )
  }

  // Main application layout for authenticated users
  return (
    <SidebarProvider>
      <MainLayout>{children}</MainLayout>
    </SidebarProvider>
  );
}
