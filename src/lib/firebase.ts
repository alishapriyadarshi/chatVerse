// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "chatverse-v8eax",
  "appId": "1:895330788794:web:0c2587553c246ab3ae2983",
  "storageBucket": "chatverse-v8eax.firebasestorage.app",
  "apiKey": "AIzaSyA2m3v7D8qjiK4C3SE3rLzH_NJbaE24304",
  "authDomain": "chatverse-v8eax.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "895330788794"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);


export { app, auth };
