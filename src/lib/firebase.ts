import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBjtlSS7hAzGot0PS_qEmXLci0mBloHISc",
    authDomain: "cach-6ebd3.firebaseapp.com",
    projectId: "cach-6ebd3",
    storageBucket: "cach-6ebd3.firebasestorage.app",
    messagingSenderId: "379255642460",
    appId: "1:379255642460:web:d9bdfe0a09d324fc3c4999",
    measurementId: "G-8VJEJPSLW9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
