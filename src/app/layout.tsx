
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/layout';
import { useState, useEffect, ReactNode } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { AuthContext, useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (auth) {
      const unsubscribe = onIdTokenChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
        if (!user && pathname !== '/login' && pathname !== '/signup' && pathname !== '/') {
            router.push('/login');
        }
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [auth, router, pathname]);

  return (
    <AuthContext.Provider value={{ user, auth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>MedReport</title>
        <meta name="description" content="Your AI-powered medical assistant" />
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
