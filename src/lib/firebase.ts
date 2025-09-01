
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "medreport-clarity",
  "appId": "1:775990169875:web:f615cdbb6c03bd228d4ae6",
  "storageBucket": "medreport-clarity.firebasestorage.app",
  "apiKey": "AIzaSyDUmevArXKdJHLcJf3ShhmXEAMtRn72cTQ",
  "authDomain": "medreport-clarity.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "775990169875"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else if (getApps().length > 0) {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

// @ts-ignore
export { app, db, auth };
