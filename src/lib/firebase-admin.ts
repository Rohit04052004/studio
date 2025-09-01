
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
    // In a production or deployed environment, you must provide a service account.
    // The app will not function correctly without it.
    console.warn(
      'Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT_KEY. Admin features will be unavailable.'
    );
  }
}

// We need to check if the app was initialized before exporting the services.
const isInitialized = admin.apps.length > 0;

export const auth = isInitialized ? admin.auth() : ({} as admin.auth.Auth);
export const db = isInitialized ? admin.firestore() : ({} as admin.firestore.Firestore);
