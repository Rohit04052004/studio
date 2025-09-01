
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, the GOOGLE_APPLICATION_CREDENTIALS environment variable is automatically set.
    // When running locally, this is set in the .env.local file.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    db = admin.firestore();
    auth = admin.auth();
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  db = admin.app().firestore();
  auth = admin.app().auth();
}

export { db, auth };
