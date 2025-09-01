
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (!admin.apps.length) {
  try {
    // When running locally, this relies on the GOOGLE_APPLICATION_CREDENTIALS
    // environment variable. In a deployed environment (like App Hosting), this
    // is configured automatically.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    db = admin.firestore();
    auth = admin.auth();
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
    // You can set db and auth to null or handle the error as you see fit.
    db = null;
    auth = null;
  }
} else {
  db = admin.app().firestore();
  auth = admin.app().auth();
}

export { db, auth };
