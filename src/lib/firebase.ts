// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "chatverse-v8eax",
  "appId": "1:895330788794:web:0c2587553c246ab3ae2983",
  "storageBucket": "chatverse-v8eax.appspot.com",
  "apiKey": "AIzaSyDj7i04MjkQ3ckwUWjcNt6zvImL6cQ7FH4",
  "authDomain": "chatverse-v8eax.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "895330788794"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
