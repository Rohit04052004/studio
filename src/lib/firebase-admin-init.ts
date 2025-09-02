
import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
      db = admin.firestore();
      auth = admin.auth();
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error);
    }
  } else {
    console.error('Missing Firebase Admin SDK credentials in .env file. Initialization skipped.');
  }
} else {
    db = admin.firestore();
    auth = admin.auth();
}


export { db, auth };
