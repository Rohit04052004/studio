
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Force load environment variables from .env file
config();

let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
  serviceAccount = null;
}


if (!admin.apps.length) {
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
       console.error('Firebase Admin SDK initialization error:', error);
    }
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

// Explicitly export services or null if not initialized to make checks easier.
export const auth = isInitialized ? admin.auth() : null;
export const db = isInitialized ? admin.firestore() : null;
