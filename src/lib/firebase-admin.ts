
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

let db: admin.firestore.Firestore | null = null;
try {
  db = admin.firestore();
} catch (e) {
  console.error('Failed to get Firestore instance:', e);
}

let auth: admin.auth.Auth | null = null;
try {
  auth = admin.auth();
} catch (e) {
  console.error('Failed to get Auth instance:', e);
}

export { db, auth };
