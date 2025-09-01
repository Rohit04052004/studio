
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountString) {
    try {
      const decodedServiceAccount = Buffer.from(serviceAccountString, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(decodedServiceAccount);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully.');
      db = admin.firestore();
      auth = admin.auth();
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error.message);
    }
  } else {
    console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  }
} else {
  db = admin.firestore();
  auth = admin.auth();
}

export { db, auth };
