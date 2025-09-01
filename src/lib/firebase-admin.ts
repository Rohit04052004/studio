
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config();

let app: admin.app.App | null = null;

function getAdminApp() {
  if (app) {
    return app;
  }

  if (admin.apps.length > 0) {
    app = admin.app();
    return app;
  }

  let serviceAccount;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
      console.warn(
        'Firebase Admin SDK service account key not found. Admin features will be unavailable.'
      );
      return null;
    }
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    return null;
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return app;
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', error);
    return null;
  }
}

function getDb() {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  return admin.firestore(adminApp);
}

function getAuth() {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  return admin.auth(adminApp);
}

export { getDb, getAuth };
