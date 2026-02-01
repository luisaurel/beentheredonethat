// src/composables/useOverpass.ts
import { ref } from 'vue'

export interface OverpassLandmark {
  id: string
  osmId: number
  name: string
  location: {
    lat: number
    lng: number
  }
  type: string // z.B. 'attraction', 'monument', 'museum'
  source: 'overpass'
}

export interface BoundingBox {
  south: number
  west: number
  north: number
  east: number
}

// Overpass API Endpoint
const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

// Cache für bereits geladene Bereiche
const landmarkCache = new Map<string, OverpassLandmark[]>()
const loading = ref(false)
const error = ref<string | null>(null)

// Erzeugt Cache-Key aus gerundeten Bounds (reduziert API-Calls)
function getCacheKey(bounds: BoundingBox): string {
  const precision = 2 // ~1km Genauigkeit
  return [
    bounds.south.toFixed(precision),
    bounds.west.toFixed(precision),
    bounds.north.toFixed(precision),
    bounds.east.toFixed(precision)
  ].join(',')
}

// Baut die Overpass-Query für Wahrzeichen
function buildQuery(bounds: BoundingBox): string {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
  
  return `
    [out:json][timeout:25];
    (
      node["tourism"="attraction"](${bbox});
      node["historic"="monument"](${bbox});
      node["historic"="castle"](${bbox});
      node["historic"="memorial"](${bbox});
      node["man_made"="tower"]["tourism"](${bbox});
      node["tourism"="museum"](${bbox});
      node["tourism"="artwork"](${bbox});
      way["tourism"="attraction"](${bbox});
      way["historic"="castle"](${bbox});
    );
    out center body;
  `
}

// Parst Overpass-Response zu Landmark-Array
function parseResponse(data: any): OverpassLandmark[] {
  const elements = data.elements || []
  
  return elements
    .filter((el: any) => {
      // Nur Elemente mit Namen behalten
      return el.tags?.name
    })
    .map((el: any) => {
      // Für ways/relations: center-Koordinaten verwenden
      const lat = el.lat ?? el.center?.lat
      const lng = el.lon ?? el.center?.lon
      
      if (!lat || !lng) return null
      
      // Typ bestimmen
      let type = 'attraction'
      if (el.tags?.historic) type = el.tags.historic
      else if (el.tags?.tourism) type = el.tags.tourism
      else if (el.tags?.man_made) type = el.tags.man_made
      
      return {
        id: `osm-${el.id}`,
        osmId: el.id,
        name: el.tags.name,
        location: { lat, lng },
        type,
        source: 'overpass' as const
      }
    })
    .filter(Boolean) as OverpassLandmark[]
}

export function useOverpass() {
  /**
   * Lädt Wahrzeichen für einen gegebenen Kartenausschnitt
   */
  const fetchLandmarksInBounds = async (bounds: BoundingBox): Promise<OverpassLandmark[]> => {
    const cacheKey = getCacheKey(bounds)
    
    // Cache-Hit?
    if (landmarkCache.has(cacheKey)) {
      return landmarkCache.get(cacheKey)!
    }
    
    loading.value = true
    error.value = null
    
    try {
      const query = buildQuery(bounds)
      
      const response = await fetch(OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `data=${encodeURIComponent(query)}`
      })
      
      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`)
      }
      
      const data = await response.json()
      const landmarks = parseResponse(data)
      
      // In Cache speichern
      landmarkCache.set(cacheKey, landmarks)
      
      return landmarks
    } catch (e: any) {
      console.error('Overpass API Fehler:', e)
      error.value = e.message ?? 'Konnte Wahrzeichen nicht laden'
      return []
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Leert den Cache (z.B. bei Speicherproblemen)
   */
  const clearCache = () => {
    landmarkCache.clear()
  }
  
  return {
    fetchLandmarksInBounds,
    clearCache,
    loading,
    error
  }
}
