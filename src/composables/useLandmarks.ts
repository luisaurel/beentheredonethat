// src/composables/useLandmarks.ts
import { ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

// Landmark-Typ Definition
export interface Landmark {
  id: string
  name: string
  country: string
  city: string
  location: {
    lat: number
    lng: number
  }
}

// Globaler State (Singleton-Pattern wie bei useStamps)
const landmarks = ref<Landmark[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(false)

export function useLandmarks() {
  const loadLandmarks = async () => {
    // Nicht erneut laden, wenn bereits geladen
    if (isLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const landmarksCollection = collection(db, 'landmarks')
      const snapshot = await getDocs(landmarksCollection)
      
      landmarks.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Landmark[]
      
      isLoaded.value = true
    } catch (e: any) {
      console.error('Fehler beim Laden der Landmarks:', e)
      error.value = e.message ?? 'Konnte Landmarks nicht laden'
    } finally {
      loading.value = false
    }
  }

  // Erzwingt Neuladen (z.B. nach Änderungen)
  const reloadLandmarks = async () => {
    isLoaded.value = false
    await loadLandmarks()
  }

  return { 
    landmarks, 
    loading, 
    error, 
    isLoaded,
    loadLandmarks, 
    reloadLandmarks 
  }
}
