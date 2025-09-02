
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';

// This is a critical check to ensure the client-side environment variables are loaded.
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.error(
        'Client-side Firebase environment variables are not set. ' +
        'Please check your .env file and ensure that all variables prefixed with NEXT_PUBLIC_ are correctly defined.'
    );
}

// This function ensures that we initialize the app only once
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };
  
  return initializeApp(firebaseConfig);
}
