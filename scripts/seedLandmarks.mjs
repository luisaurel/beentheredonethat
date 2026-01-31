// scripts/seedLandmarks.mjs
// Führe aus mit: node scripts/seedLandmarks.mjs

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBG4bFoerfM-rPZQ6_euZWKZrwnvtq1S4E",
  authDomain: "beentheredonethat-b23fc.firebaseapp.com",
  projectId: "beentheredonethat-b23fc",
  storageBucket: "beentheredonethat-b23fc.firebasestorage.app",
  messagingSenderId: "410346896563",
  appId: "1:410346896563:web:28a4fd0f395290934004c6"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Die bestehenden Landmark-Daten
const landmarks = [
  {
    name: "DHBW",
    country: "Deutschland",
    city: "Mosbach",
    location: {
      lat: 49.35175,
      lng: 9.14853
    }
  },
  {
    name: "Eiffel Tower",
    country: "France",
    city: "Paris",
    location: {
      lat: 48.8584,
      lng: 2.2945
    }
  },
  {
    name: "Colosseum",
    country: "Italy",
    city: "Rome",
    location: {
      lat: 41.8902,
      lng: 12.4922
    }
  },
  {
    name: "Brandenburg Gate",
    country: "Germany",
    city: "Berlin",
    location: {
      lat: 52.5163,
      lng: 13.3777
    }
  },
  {
    name: "Sagrada Familia",
    country: "Spain",
    city: "Barcelona",
    location: {
      lat: 41.4036,
      lng: 2.1744
    }
  },
  {
    name: "Big Ben",
    country: "United Kingdom",
    city: "London",
    location: {
      lat: 51.5007,
      lng: -0.1246
    }
  },
  {
    name: "Statue of Liberty",
    country: "USA",
    city: "New York",
    location: {
      lat: 40.6892,
      lng: -74.0445
    }
  },
  {
    name: "Christ the Redeemer",
    country: "Brazil",
    city: "Rio de Janeiro",
    location: {
      lat: -22.9519,
      lng: -43.2105
    }
  },
  {
    name: "Sydney Opera House",
    country: "Australia",
    city: "Sydney",
    location: {
      lat: -33.8568,
      lng: 151.2153
    }
  }
]

async function seedLandmarks() {
  console.log('🚀 Starte Landmark-Upload zu Firestore...\n')

  const landmarksCollection = collection(db, 'landmarks')

  for (const landmark of landmarks) {
    // Erstelle eine ID aus dem Namen (lowercase, Leerzeichen durch Bindestriche ersetzen)
    const id = landmark.name.toLowerCase().replace(/\s+/g, '-')
    
    const docRef = doc(landmarksCollection, id)
    await setDoc(docRef, landmark)
    
    console.log(`✅ ${landmark.name} (${landmark.city}, ${landmark.country})`)
  }

  console.log(`\n🎉 Fertig! ${landmarks.length} Landmarks in Firestore gespeichert.`)
  process.exit(0)
}

seedLandmarks().catch((error) => {
  console.error('❌ Fehler beim Seeden:', error)
  process.exit(1)
})
