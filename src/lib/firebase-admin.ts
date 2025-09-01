
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config(); // Ensure environment variables are loaded

function getAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        console.warn(
          'Firebase Admin SDK not initialized. Missing FIREBASE_SERVICE_ACCOUNT_KEY. Admin features will be unavailable.'
        );
        return null;
    }
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    return null;
  }
}

function getDb() {
    const app = getAdminApp();
    if (!app) return null;
    return admin.firestore(app);
}

function getAuth() {
    const app = getAdminApp();
    if (!app) return null;
    return admin.auth(app);
}

export const db = getDb();
export const auth = getAuth();
