
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Initialize without credentials in environments where the key isn't available
    // (like client-side). Services requiring auth will not work.
    console.warn("Firebase Admin SDK initialized without credentials. Admin features will not work.");
    admin.initializeApp();
  }
}


export const auth = admin.auth();
export const db = admin.firestore();
