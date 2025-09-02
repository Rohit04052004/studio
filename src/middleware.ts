
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/reports', '/assistant', '/history', '/profile'];
  const isProtectedRoute = protectedRoutes.some(path => pathname.startsWith(path));
  
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.includes(pathname);

  // If trying to access a protected route without a session, redirect to login
  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in, trying to access login/signup, redirect to dashboard
  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If the user is authenticated and at the root, redirect to their dashboard
  if (sessionCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If the user is NOT authenticated and at the root, allow them to see the landing page
  if (!sessionCookie && pathname === '/') {
    return NextResponse.next();
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|service-account.json).*)'],
};
