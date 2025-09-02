
import * as admin from 'firebase-admin';

// This function will initialize the admin app if it's not already initialized
// and return the auth and firestore services.
export function getAdminInstances() {
    if (!admin.apps.length) {
        try {
            const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
            if (!serviceAccountString) {
                throw new Error("The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
            }
            
            const serviceAccount = JSON.parse(serviceAccountString);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
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
