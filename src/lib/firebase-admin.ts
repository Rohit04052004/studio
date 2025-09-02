import * as admin from 'firebase-admin';

// This function will initialize the admin app if it's not already initialized
// and return the auth and firestore services.
export function getAdminInstances() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing Firebase Admin SDK credentials. Please check your .env file.');
        return { db: null, auth: null };
    }

    if (!admin.apps.length) {
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
            // Return nulls if initialization fails
            return { db: null, auth: null };
        }
    }

    const db = admin.firestore();
    const auth = admin.auth();
    
    return { db, auth };
}
