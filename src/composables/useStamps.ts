import { ref } from 'vue'
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'

const stamps = ref<string[]>([])
const stampPhotos = ref<Record<string, string[]>>({}) // landmarkName -> array of photoUrls
const loading = ref(false)
const error = ref<string | null>(null)

export function useStamps() {
  const { user } = useAuth()

  const loadStamps = async () => {
    if (!user.value) return
    loading.value = true
    error.value = null

    try {
      const userRef = doc(db, 'users', user.value.uid)
      const snap = await getDoc(userRef)
      if (snap.exists()) {
        const data = snap.data() as { stamps?: string[]; stampPhotos?: Record<string, string | string[]> }
        stamps.value = data.stamps ?? []
        
        // Backward compatibility: convert single strings to arrays
        const rawPhotos = data.stampPhotos ?? {}
        const normalizedPhotos: Record<string, string[]> = {}
        for (const [key, value] of Object.entries(rawPhotos)) {
          if (typeof value === 'string') {
            normalizedPhotos[key] = [value]
          } else if (Array.isArray(value)) {
            normalizedPhotos[key] = value
          }
        }
        stampPhotos.value = normalizedPhotos
      } else {
        stamps.value = []
        stampPhotos.value = {}
      }
    } catch (e: any) {
      error.value = e.message ?? 'Konnte Stempel nicht laden'
    } finally {
      loading.value = false
    }
  }

  const addStamp = async (stampName: string, photoUrl?: string) => {
    if (!user.value) {
      throw new Error('Kein Benutzer eingeloggt')
    }

    error.value = null
    const userRef = doc(db, 'users', user.value.uid)

    // Append new photo to existing array
    const existingPhotos = stampPhotos.value[stampName] ?? []
    const newPhotosArray = photoUrl ? [...existingPhotos, photoUrl] : existingPhotos
    const newPhotos = photoUrl ? { ...stampPhotos.value, [stampName]: newPhotosArray } : undefined
    
    const updates: Record<string, unknown> = {
      stamps: arrayUnion(stampName)
    }
    if (newPhotos) updates.stampPhotos = newPhotos

    await setDoc(userRef, updates, { merge: true })

    if (!stamps.value.includes(stampName)) {
      stamps.value.push(stampName)
    }
    if (photoUrl) {
      stampPhotos.value = { ...stampPhotos.value, [stampName]: newPhotosArray }
    }
  }

  return { stamps, stampPhotos, loading, error, loadStamps, addStamp }
}

