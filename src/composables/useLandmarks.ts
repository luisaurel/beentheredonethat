// src/composables/useLandmarks.ts
import { ref, computed } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useOverpass, type BoundingBox } from './useOverpass'

// Landmark-Typ Definition (erweitert für beide Quellen)
export interface Landmark {
  id: string
  name: string
  country?: string  // Optional, da Overpass nicht immer Land hat
  city?: string     // Optional
  location: {
    lat: number
    lng: number
  }
  source: 'firebase' | 'overpass'
  osmId?: number
}

// Globaler State (Singleton-Pattern)
const firebaseLandmarks = ref<Landmark[]>([])
const overpassLandmarks = ref<Landmark[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isLoaded = ref(false)

// Nur Overpass-Landmarks (Firebase wird nicht mehr verwendet)
const landmarks = computed<Landmark[]>(() => overpassLandmarks.value)

// Overpass composable instanziieren
const { fetchLandmarksInBounds, loading: overpassLoading } = useOverpass()

export function useLandmarks() {
  /**
   * Lädt Firebase-Landmarks (einmalig)
   */
  const loadLandmarks = async () => {
    // Nicht erneut laden, wenn bereits geladen
    if (isLoaded.value) return

    loading.value = true
    error.value = null

    try {
      const landmarksCollection = collection(db, 'landmarks')
      const snapshot = await getDocs(landmarksCollection)
      
      firebaseLandmarks.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'firebase' as const
      })) as Landmark[]
      
      isLoaded.value = true
    } catch (e: any) {
      console.error('Fehler beim Laden der Landmarks:', e)
      error.value = e.message ?? 'Konnte Landmarks nicht laden'
    } finally {
      loading.value = false
    }
  }

  /**
   * Lädt Overpass-Landmarks für einen Kartenausschnitt
   */
  const loadLandmarksForBounds = async (bounds: BoundingBox) => {
    try {
      const osLandmarks = await fetchLandmarksInBounds(bounds)
      
      // Overpass-Landmarks in Landmark-Format konvertieren
      overpassLandmarks.value = osLandmarks.map((ol): Landmark => ({
        id: ol.id,
        name: ol.name,
        location: ol.location,
        source: 'overpass',
        osmId: ol.osmId
      }))
    } catch (e: any) {
      console.error('Fehler beim Laden von Overpass-Landmarks:', e)
    }
  }

  // Erzwingt Neuladen (z.B. nach Änderungen)
  const reloadLandmarks = async () => {
    isLoaded.value = false
    await loadLandmarks()
  }

  return { 
    landmarks, 
    firebaseLandmarks,
    overpassLandmarks,
    loading: computed(() => loading.value || overpassLoading.value), 
    error, 
    isLoaded,
    loadLandmarks, 
    loadLandmarksForBounds,
    reloadLandmarks 
  }
}
