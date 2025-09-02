
'use client';

import { useState, useEffect } from 'react';
import { getFirebaseApp, getFirebaseAuth } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

interface FirebaseServices {
  app: FirebaseApp | null;
  auth: Auth | null;
}

let firebaseInstance: FirebaseServices | null = null;

function initializeFirebase(): FirebaseServices {
  if (typeof window !== 'undefined') {
    if (!firebaseInstance) {
      const app = getFirebaseApp();
      const auth = getFirebaseAuth();
      firebaseInstance = { app, auth };
    }
    return firebaseInstance;
  }
  return { app: null, auth: null };
}

export function useFirebase(): FirebaseServices {
  const [firebase, setFirebase] = useState<FirebaseServices>({ app: null, auth: null });

  useEffect(() => {
    // This effect runs only on the client, ensuring Firebase is initialized there.
    setFirebase(initializeFirebase());
  }, []);

  return firebase;
}
