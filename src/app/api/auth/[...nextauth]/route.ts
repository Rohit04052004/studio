
import { auth as adminAuth } from 'firebase-admin';
import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  if (!auth) {
      return new Response(JSON.stringify({ status: 'error', message: 'Firebase Admin not initialized.' }), { status: 500 });
  }
  try {
    const body = await req.json();
    const { idToken } = body;
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
    return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), { status: 401 });
  }
}
