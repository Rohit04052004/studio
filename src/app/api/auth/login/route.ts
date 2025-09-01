
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { idToken } = await request.json()

  if (!idToken) {
    return new Response(JSON.stringify({ error: 'ID token is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const maxAge = 60 * 60 * 24 * 5; // 5 days
    
    cookies().set('firebaseIdToken', idToken, {
      maxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error setting cookie:', error);
    return new Response(JSON.stringify({ error: 'Failed to set session cookie' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
