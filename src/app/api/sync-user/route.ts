
import { db, auth } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  if (!auth || !db) {
    return NextResponse.json({ error: 'Firebase admin not initialized.' }, { status: 500 });
  }

  try {
    const { idToken, firstName, lastName } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    const userRef = db.collection('users').doc(uid);

    const data = {
      uid,
      email,
      firstName,
      lastName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Use set with merge:true to create or update the document
    await userRef.set(data, { merge: true });

    return NextResponse.json({ success: true, message: 'User synced successfully.' });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
