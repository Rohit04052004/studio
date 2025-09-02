
import * as admin from 'firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
  }
}

let db;
try {
  db = admin.firestore();
} catch (error) {
  console.error('Firestore initialization error:', error);
}

let auth;
try {
  auth = admin.auth();
} catch (error) {
  console.error('Auth initialization error:', error);
}


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
