
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import { getApps } from 'firebase-admin/app';
import path from 'path';
import fs from 'fs';

let adminApp: App;

if (getApps().length === 0) {
  const serviceAccountPath = path.resolve('./service-account.json');
  
  try {
    if (fs.existsSync(serviceAccountPath)) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
    } else {
      console.warn("service-account.json not found, attempting to use Application Default Credentials.");
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    // We are not throwing the error here to avoid crashing the server
    // The db and auth exports will be null, and handled in the actions/routes.
  }
} else {
  adminApp = admin.app();
}

const db = adminApp! ? admin.firestore(adminApp) : null;
const auth = adminApp! ? admin.auth(adminApp) : null;

export { db, auth };
