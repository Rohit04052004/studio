
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

// This handles both logging in (POST) and logging out (DELETE)
export async function POST(req: Request) {
  if (!auth) {
      return new Response(JSON.stringify({ status: 'error', message: 'Firebase Admin not initialized.' }), { status: 500 });
  }
  try {
    const body = await req.json();
    const { idToken } = body;
    if (!idToken) {
        return new Response(JSON.stringify({ status: 'error', message: 'ID token is required.' }), { status: 400 });
    }
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    
    cookies().set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
    
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (error) {
    console.error("Session login error:", error);
    return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), { status: 401 });
  }
}

export async function DELETE() {
  try {
    cookies().delete('session');
    return new Response(JSON.stringify({ status: 'success' }), { status: 200 });
  } catch (error) {
    console.error("Session logout error:", error);
    return new Response(JSON.stringify({ status: 'error', message: 'Logout failed.' }), { status: 500 });
  }
}
