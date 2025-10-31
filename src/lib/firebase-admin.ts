
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApps } from 'firebase-admin/app';
import fs from 'fs';

let adminApp: App | undefined;

function initializeAdminApp() {
  if (getApps().length > 0) {
    return admin.app();
  }

  // Check for service account file for local development
  const serviceAccountPath = './service-account.json';
  if (fs.existsSync(serviceAccountPath)) {
    console.log('Initializing Firebase Admin with service account file...');
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  }

  // Otherwise, use Application Default Credentials for cloud environments
  console.log('Initializing Firebase Admin with Application Default Credentials...');
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

try {
  adminApp = initializeAdminApp();
} catch (error) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // `adminApp` will be undefined, and subsequent db/auth calls will fail.
}


const db = adminApp ? admin.firestore() : null;
const auth = adminApp ? admin.auth() : null;

if (!db || !auth) {
    console.warn("Firebase db or auth service is not available. Check initialization logs for errors.");
}


export { db, auth };
