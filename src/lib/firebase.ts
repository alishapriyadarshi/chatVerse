// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA2m3v7D8qjiK4C3SE3rLzH_NJbaE24304",
  authDomain: "chatverse-v8eax.firebaseapp.com",
  projectId: "chatverse-v8eax",
  storageBucket: "chatverse-v8eax.appspot.com",
  messagingSenderId: "895330788794",
  appId: "1:895330788794:web:0c2587553c246ab3ae2983"
};

// Initialize Firebase for client-side using a singleton pattern
const getFirebaseApp = () => {
    if (!getApps().length) {
        return initializeApp(firebaseConfig);
    }
    return getApp();
};

const app: FirebaseApp = getFirebaseApp();
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
