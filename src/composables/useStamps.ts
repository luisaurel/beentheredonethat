import { ref } from 'vue'
import { doc, getDoc, setDoc, updateDoc, arrayUnion, addDoc, collection, getDocs, serverTimestamp, deleteDoc, arrayRemove, deleteField } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './useAuth'
import { reverseGeocode } from './useReverseGeocode'

type StampEntry = {
  id?: string
  name: string
  photoUrl?: string | null
  lat?: number | null
  lng?: number | null
  accuracy?: number | null
  country?: string | null
  countryCode?: string | null
  region?: string | null
  city?: string | null
  geoResolved?: boolean
  createdAt?: any
}

const stamps = ref<string[]>([])
const stampPhotos = ref<Record<string, string[]>>({}) // landmarkName -> array of photoUrls
const stampEntries = ref<StampEntry[]>([])
const collectedCountries = ref<Record<string, { name: string; firstCollectedAt: any }>>({})
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
        const data = snap.data() as { stamps?: string[]; stampPhotos?: Record<string, string | string[]>; collectedCountries?: Record<string, { name: string; firstCollectedAt: any }> }
        stamps.value = data.stamps ?? []
        collectedCountries.value = data.collectedCountries ?? {}
        
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
        collectedCountries.value = {}
      }

      // Load detailed stamps from subcollection users/{uid}/stamps
      const stampsCol = collection(db, 'users', user.value.uid, 'stamps')
      const snapStamps = await getDocs(stampsCol)
      stampEntries.value = snapStamps.docs.map(d => ({ id: d.id, ...(d.data() as any) }))

    } catch (e: any) {
      error.value = e.message ?? 'Konnte Stempel nicht laden'
    } finally {
      loading.value = false
    }
  }

  const addStamp = async (stampName: string, photoUrl?: string, location?: { lat: number; lng: number; accuracy?: number }) => {
    if (!user.value) {
      throw new Error('Kein Benutzer eingeloggt')
    }

    error.value = null
    const userRef = doc(db, 'users', user.value.uid)

    // If location missing, try to get current location
    let loc = location
    if (!loc && 'geolocation' in navigator) {
      try {
        loc = await new Promise<{ lat: number; lng: number; accuracy?: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude, accuracy: position.coords.accuracy }),
            (err) => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          )
        })
      } catch {
        // ignore location error - we'll still save stamp without geo
        loc = undefined
      }
    }

    // Try reverse geocoding if we have a location
    let geo = { country: null as string | null, countryCode: null as string | null, region: null as string | null, city: null as string | null, geoResolved: false }
    if (loc) {
      try {
        geo = await reverseGeocode(loc.lat, loc.lng)
      } catch (e) {
        // keep geoResolved false
        geo = { country: null, countryCode: null, region: null, city: null, geoResolved: false }
      }
    }

    // Persist a stamp document in subcollection
    const stampDoc: StampEntry = {
      name: stampName,
      photoUrl: photoUrl ?? null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      accuracy: loc?.accuracy ?? null,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region ?? null,
      city: geo.city ?? null,
      geoResolved: geo.geoResolved,
      createdAt: serverTimestamp()
    }

    // Save stamp document and get its ID so we can associate it with a country
    let stampId: string | null = null
    try {
      const docRef = await addDoc(collection(db, 'users', user.value.uid, 'stamps'), stampDoc)
      stampId = docRef.id
    } catch (e: any) {
      console.error('Konnte Stamp-Dokument nicht speichern', e)
    }

    // Append new photo to existing array (existing behaviour)
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

    // Update collectedCountries if we have a countryCode; also record this stampId under the country
    if (geo.countryCode) {
      const code = geo.countryCode
      try {
        const snap = await getDoc(userRef)
        const existing = snap.exists() ? (snap.data()?.collectedCountries ?? {}) : {}

        if (!existing[code]) {
          const countryObj = { name: geo.country ?? code, firstCollectedAt: serverTimestamp(), stamps: stampId ? [stampId] : [] }
          try {
            // Use updateDoc with field path to avoid overwriting the whole collectedCountries map
            await updateDoc(userRef, { [`collectedCountries.${code}`]: countryObj })
          } catch (e) {
            // If update fails because doc doesn't exist yet, fall back to setDoc merge
            await setDoc(userRef, { collectedCountries: { [code]: countryObj } }, { merge: true })
          }
          collectedCountries.value = { ...collectedCountries.value, [code]: countryObj }
        } else {
          // Ensure stamp id is added to stamps array for that country
          if (stampId) {
            try {
              await updateDoc(userRef, { [`collectedCountries.${code}.stamps`]: arrayUnion(stampId) })
            } catch (e) {
              console.error('Konnte stamps Array in collectedCountries nicht aktualisieren', e)
            }
            // Update local reactive copy if present
            const local = collectedCountries.value[code] ?? { name: existing[code].name ?? code, firstCollectedAt: existing[code].firstCollectedAt ?? null, stamps: [] }
            const localStamps = Array.isArray(local.stamps) ? local.stamps : (existing[code].stamps ?? [])
            if (!localStamps.includes(stampId)) {
              collectedCountries.value = { ...collectedCountries.value, [code]: { ...local, stamps: [...localStamps, stampId] } }
            }
          }
        }
      } catch (e) {
        console.error('Konnte collectedCountries nicht aktualisieren', e)
      }
    }

    // Refresh local state to ensure counts / lists are up-to-date
    try {
      await loadStamps()
    } catch (e) {
      // ignore
    }
  }

  const deleteStamp = async (stampId: string) => {
    if (!user.value) throw new Error('Kein Benutzer eingeloggt')
    if (!stampId) return

    try {
      const stampRef = doc(db, 'users', user.value.uid, 'stamps', stampId)
      const snap = await getDoc(stampRef)
      if (!snap.exists()) return
      const data = snap.data() as any
      const { photoUrl, name, countryCode } = data

      // delete stamp document
      await deleteDoc(stampRef)

      const userRef = doc(db, 'users', user.value.uid)

      // remove stampId from collectedCountries.{code}.stamps
      if (countryCode) {
        try {
          await updateDoc(userRef, { [`collectedCountries.${countryCode}.stamps`]: arrayRemove(stampId) })
          // reload user doc to check if stamps array is now empty -> remove country entry if empty
          const afterSnap = await getDoc(userRef)
          const after = afterSnap.exists() ? (afterSnap.data()?.collectedCountries ?? {}) : {}
          const arr = after?.[countryCode]?.stamps ?? []
          if (!arr || arr.length === 0) {
            // remove the whole country entry
            await updateDoc(userRef, { [`collectedCountries.${countryCode}`]: deleteField() })
          }
        } catch (e) {
          console.error('Konnte collectedCountries nicht anpassen', e)
        }
      }

      // Remove photoUrl from users.{uid}.stampPhotos[name]
      if (photoUrl && name) {
        try {
          const snapUser = await getDoc(userRef)
          const userData = snapUser.exists() ? snapUser.data() : {}
          const rawPhotos: Record<string, string[] | string> = userData?.stampPhotos ?? {}
          const arr = Array.isArray(rawPhotos[name]) ? rawPhotos[name].slice() : (typeof rawPhotos[name] === 'string' ? [rawPhotos[name]] : [])
          const filtered = arr.filter((u: string) => u !== photoUrl)
          const newPhotos = { ...rawPhotos, [name]: filtered }
          // if empty array remove the key
          if (filtered.length === 0) delete newPhotos[name]
          await setDoc(userRef, { stampPhotos: newPhotos }, { merge: true })
        } catch (e) {
          console.error('Konnte stampPhotos nicht aktualisieren', e)
        }
      }

      // Refresh local cache
      await loadStamps()
    } catch (e) {
      console.error('Löschen fehlgeschlagen', e)
      throw e
    }
  }

  // Utility: Rebuild collectedCountries from existing stamps (in case prior bug overwrote map)
  const rebuildCollectedCountries = async () => {
    if (!user.value) throw new Error('Kein Benutzer eingeloggt')
    const map: Record<string, { name: string; firstCollectedAt: any; stamps: string[] }> = {}
    // Ensure stampEntries is loaded
    await loadStamps()
    for (const s of stampEntries.value) {
      if (!s.countryCode) continue
      const code = s.countryCode
      if (!map[code]) {
        map[code] = { name: s.country ?? code, firstCollectedAt: s.createdAt ?? serverTimestamp(), stamps: [] }
      }
      map[code].stamps.push(s.id!)
      // pick earliest createdAt
      try {
        const t = s.createdAt?.toMillis ? s.createdAt.toMillis() : 0
        const cur = map[code].firstCollectedAt?.toMillis ? map[code].firstCollectedAt.toMillis() : 0
        if (t && cur) {
          if (t < cur) map[code].firstCollectedAt = s.createdAt
        }
      } catch {
        // ignore
      }
    }

    const userRef = doc(db, 'users', user.value.uid)
    try {
      await setDoc(userRef, { collectedCountries: map }, { merge: true })
      collectedCountries.value = map
    } catch (e) {
      console.error('Konnte collectedCountries nicht rebuilden', e)
    }
  }

  return { stamps, stampPhotos, stampEntries, collectedCountries, loading, error, loadStamps, addStamp, deleteStamp, rebuildCollectedCountries }
}


