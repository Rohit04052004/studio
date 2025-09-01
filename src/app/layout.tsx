
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/layout';
import { AuthProvider } from '@/hooks/use-auth';

export const metadata: Metadata = {
  title: 'MedReport',
  description: 'Your AI-powered medical assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-sans antialiased', 'min-h-screen bg-background')}>
        <AuthProvider>
            <Layout>{children}</Layout>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
