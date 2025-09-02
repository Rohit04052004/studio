import { auth, db } from '@/lib/firebase-admin-init';

// This is a proxy file to export the initialized services.
// All server-side code should import db and auth from this file.

export { db, auth };
