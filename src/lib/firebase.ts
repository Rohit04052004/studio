
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "medreport-clarity",
  "appId": "1:775990169875:web:f615cdbb6c03bd228d4ae6",
  "storageBucket": "medreport-clarity.firebasestorage.app",
  "apiKey": "AIzaSyDUmevArXKdJHLcJf3ShhmXEAMtRn72cTQ",
  "authDomain": "medreport-clarity.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "775990169875"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

auth.setPersistence({ type: 'LOCAL' });

export { app, db, auth };
