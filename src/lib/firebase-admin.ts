
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (!admin.apps.length) {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY_BASE64
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY_BASE64) {
    console.error('Missing required Firebase Admin SDK environment variables.');
  } else {
    try {
      const privateKey = Buffer.from(FIREBASE_PRIVATE_KEY_BASE64, 'base64').toString('utf-8');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_PROJECT_ID,
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });

      console.log('Firebase Admin SDK initialized successfully.');
      db = admin.firestore();
      auth = admin.auth();

    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error.message);
      // Log the full error for more details, which can be helpful
      console.error(error);
    }
  }
} else {
    db = admin.firestore();
    auth = admin.auth();
}

export { db, auth };
