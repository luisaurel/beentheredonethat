import { ref } from 'vue'

export function useLocation() {
  const coords = ref({ lat: 0, lng: 0 })
  const locationError = ref<string | null>(null)

  const getBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        locationError.value = "Geolocation wird nicht unterstützt."
        reject(locationError.value)
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          coords.value = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          resolve(coords.value)
        },
        (err) => {
          locationError.value = err.message
          reject(err.message)
        },
        { enableHighAccuracy: true } // Wichtig für präzise Check-ins!
      )
    })
  }

  // Die Haversine-Formel zur Distanzberechnung (in Metern)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Erdradius in Metern
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distanz in Metern
  }

  return { coords, locationError, getBrowserLocation, calculateDistance }
}