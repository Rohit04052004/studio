
'use client';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Layout } from '@/components/layout/layout';
import { useState, useEffect, ReactNode } from 'react';
import { getAuth, onIdTokenChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { AuthContext } from '@/hooks/use-auth';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
