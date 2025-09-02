import * as admin from 'firebase-admin';

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
    } catch (error: any) {
      console.error('Firebase Admin SDK initialization error:', error.message);
    }
  } else {
    console.error('Missing Firebase Admin SDK credentials in .env file.');
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
