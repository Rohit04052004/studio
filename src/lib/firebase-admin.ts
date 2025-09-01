
import * as admin from 'firebase-admin';
import { config } from 'dotenv';

config();

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
     console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;
const auth = admin.apps.length ? admin.auth() : null;

export { db, auth };
