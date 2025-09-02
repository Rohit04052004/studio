
import * as admin from 'firebase-admin';

// This function will initialize the admin app if it's not already initialized
// and return the auth and firestore services.
export function getAdminInstances() {
    let app;
    if (!admin.apps.length) {
        try {
            const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
            if (!serviceAccountBase64) {
                throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
            }
            
            const decodedServiceAccount = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(decodedServiceAccount);

            app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://medreport-clarity.firebaseio.com"
            });
        } catch (error: any) {
            console.error('Firebase Admin SDK initialization error:', error.message);
            // Return nulls if initialization fails
            return { db: null, auth: null };
        }
    } else {
        app = admin.app();
    }

    const db = admin.firestore(app);
    const auth = admin.auth(app);
    
    return { db, auth };
}
