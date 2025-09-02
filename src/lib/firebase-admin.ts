
import * as admin from 'firebase-admin';
import serviceAccountInfo from '../../serviceAccountKey.json';

// This function will initialize the admin app if it's not already initialized
// and return the auth and firestore services.
export function getAdminInstances() {
    if (!admin.apps.length) {
        try {
            // The service account object has to be parsed and the private key's newlines have to be replaced
            // to be correctly interpreted by the Firebase Admin SDK.
            const serviceAccount = serviceAccountInfo as admin.ServiceAccount
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
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
