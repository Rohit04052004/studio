
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    cookies().delete('firebaseIdToken');
    
    const response = NextResponse.json({ success: true });
    
    return response;
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
