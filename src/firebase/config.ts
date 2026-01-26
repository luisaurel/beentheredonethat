import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBG4bFoerfM-rPZQ6_euZWKZrwnvtq1S4E",
    authDomain: "beentheredonethat-b23fc.firebaseapp.com",
    projectId: "beentheredonethat-b23fc",
    storageBucket: "beentheredonethat-b23fc.firebasestorage.app",
    messagingSenderId: "410346896563",
    appId: "1:410346896563:web:28a4fd0f395290934004c6"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
