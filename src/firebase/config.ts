import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyBG4bFoerfM-rPZQ6_euZWKZrwnvtq1S4E",
    authDomain: "beentheredonethat-b23fc.firebaseapp.com",
    projectId: "beentheredonethat-b23fc",
    messagingSenderId: "410346896563",
    appId: "1:410346896563:web:28a4fd0f395290934004c6"
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
