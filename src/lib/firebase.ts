
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration.
const firebaseConfig = {
    apiKey: "AIzaSyDUmevArXKdJHLcJf3ShhmXEAMtRn72cTQ",
    authDomain: "medreport-clarity.firebaseapp.com",
    projectId: "medreport-clarity",
    storageBucket: "medreport-clarity.appspot.com",
    messagingSenderId: "775990169875",
    appId: "1:775990169875:web:f615cdbb6c03bd228d4ae6"
};

// This function ensures that we initialize the app only once
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
    return getAuth(getFirebaseApp());
}
