
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2m3v7D8qjiK4C3SE3rLzH_NJbaE24304",
  authDomain: "chatverse-v8eax.firebaseapp.com",
  projectId: "chatverse-v8eax",
  storageBucket: "chatverse-v8eax.appspot.com",
  messagingSenderId: "895330788794",
  appId: "1:895330788794:web:0c2587553c246ab3ae2983"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


export { app, auth, db, storage };
