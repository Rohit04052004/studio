
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  "projectId": "medreport-clarity",
  "appId": "1:775990169875:web:f615cdbb6c03bd228d4ae6",
  "storageBucket": "medreport-clarity.firebasestorage.app",
  "apiKey": "AIzaSyDUmevArXKdJHLcJf3ShhmXEAMtRn72cTQ",
  "authDomain": "medreport-clarity.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "775990169875"
};

// This function ensures that we initialize the app only once
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}
