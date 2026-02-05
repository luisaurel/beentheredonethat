import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Offline-Persistenz aktivieren
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Fehler: Mehrere Tabs geöffnet
        console.warn('Offline-Persistenz fehlgeschlagen: Mehrere Tabs geöffnet');
    } else if (err.code == 'unimplemented') {
        // Fehler: Browser unterstützt Feature nicht
        console.warn('Offline-Persistenz wird vom Browser nicht unterstützt');
    }
});

export const auth = getAuth(app);
