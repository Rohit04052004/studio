
import * as admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json';

// This function will initialize the admin app if it's not already initialized
// and return the auth and firestore services.
export function getAdminInstances() {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount as any),
                databaseURL: "https://medreport-clarity.firebaseio.com"
            });
        } catch (error: any) {
            console.error('Firebase Admin SDK initialization error:', error.message);
            // Return nulls if initialization fails
            return { db: null, auth: null };
        }
    }

    const db = admin.firestore();
    const auth = admin.auth();
    
    return { db, auth };
}
