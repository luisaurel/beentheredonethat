export type GeocodeResult = {
  country: string | null
  countryCode: string | null
  region: string | null
  city: string | null
  geoResolved: boolean
}

const CACHE_KEY = 'reverseGeocodeCache_v1'
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7 // 7 Tage

function quantizeCoord(n: number) {
  return Math.round(n * 10000) / 10000 // 4 Dezimalstellen
}

function loadCache(): Record<string, { ts: number; value: GeocodeResult }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, { ts: number; value: GeocodeResult }>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const key = `${quantizeCoord(lat)},${quantizeCoord(lng)}`
  const cache = loadCache()
  const cached = cache[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.value
  }

  // Nominatim reverse geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`

    const res = await fetch(url, {
      headers: {
        // Don't set User-Agent (forbidden in browser), but set Accept-Language and Referer is handled by browser automatically
        'Accept-Language': 'en'
      }
    })

    if (!res.ok) throw new Error('Reverse geocode failed')

    const data = await res.json()
    const address = data.address || {}

    const country = address.country ?? null
    const countryCode = (address.country_code ?? null) ? (address.country_code as string).toUpperCase() : null
    const region = address.state ?? address.region ?? null
    const city = address.city ?? address.town ?? address.village ?? address.hamlet ?? address.county ?? null

    const result: GeocodeResult = {
      country,
      countryCode,
      region,
      city,
      geoResolved: true
    }

    cache[key] = { ts: Date.now(), value: result }
    saveCache(cache)
    return result
  } catch (e) {
    // Fallback: nicht geresolved
    const fallback: GeocodeResult = {
      country: null,
      countryCode: null,
      region: null,
      city: null,
      geoResolved: false
    }
    // Cache negative result to avoid repeated failing requests
    const cacheEntry = loadCache()
    cacheEntry[key] = { ts: Date.now(), value: fallback }
    saveCache(cacheEntry)
    return fallback
  }
}
