
import * as admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json';

let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    db = admin.firestore();
    auth = admin.auth();
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.message);
  }
} else {
  db = admin.firestore();
  auth = admin.auth();
}

export { db, auth };
