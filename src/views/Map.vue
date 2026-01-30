<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css' // WICHTIG: CSS importieren!
import { useRouter } from 'vue-router'
import { useLocation } from '../composables/useLocation'
import { useLandmarks } from '../composables/useLandmarks'
import { useStamps } from '../composables/useStamps'

const router = useRouter()
const { coords, getBrowserLocation, calculateDistance } = useLocation()
const { landmarks, loadLandmarks } = useLandmarks()
const { stamps, loadStamps } = useStamps()
const saveMessage = ref<string | null>(null)
let map: L.Map | null = null
let landmarkMarkers: L.Layer[] = []

const landmarksWithDistance = computed(() => {
  if (!coords.value.lat || !coords.value.lng || landmarks.value.length === 0) return []

  return landmarks.value
    .filter(landmark => landmark.location && typeof landmark.location.lat === 'number')
    .map(landmark => {
      const { lat, lng } = landmark.location
      return {
        ...landmark,
        distance: calculateDistance(
          coords.value.lat,
          coords.value.lng,
          lat,
          lng
        )
      }
    })
    .sort((a, b) => a.distance - b.distance)
})

const closestLandmark = computed(() => landmarksWithDistance.value[0])

const canCollect = computed(() => {
  return !!closestLandmark.value && closestLandmark.value.distance <= 100
})

const collectStamp = () => {
  if (!canCollect.value || !closestLandmark.value) return
  saveMessage.value = null
  router.push({
    name: 'Camera',
    query: { landmark: closestLandmark.value.name }
  })
}

const addLandmarkMarkers = () => {
  if (!map) return
  // vorhandene Landmark-Marker entfernen
  landmarkMarkers.forEach(m => map?.removeLayer(m))
  landmarkMarkers = []

  landmarks.value.forEach(landmark => {
    // Defensive check: sicherstellen dass location existiert
    if (!landmark.location || typeof landmark.location.lat !== 'number') {
      console.warn('Landmark ohne gültige Location:', landmark.name)
      return
    }
    
    const { lat, lng } = landmark.location
    const collected = stamps.value.includes(landmark.name)
    const color = collected ? '#22c55e' : '#f97316' // grün = erfasst, orange = noch nicht

    // Pin-Icon als SVG
    const pinIcon = L.divIcon({
      className: 'custom-pin',
      html: `
        <svg viewBox="0 0 24 36" width="28" height="42" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
          <circle cx="12" cy="12" r="5" fill="#fff"/>
          ${collected ? '<path d="M8.5 12l2 2L15.5 10" stroke="' + color + '" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
        </svg>
      `,
      iconSize: [28, 42],
      iconAnchor: [14, 42],
      popupAnchor: [0, -42]
    })

    const marker = L.marker([lat, lng], { icon: pinIcon })
      .addTo(map!)
      .bindPopup(`<b>${landmark.name}</b><br>${landmark.city}, ${landmark.country}`)

    landmarkMarkers.push(marker)
  })
}

const initMap = () => {
  if (!coords.value.lat) return
  // Verhindere doppelte Initialisierung
  if (map) return

  // Karte auf User-Standort zentrieren
  map = L.map('map').setView([coords.value.lat, coords.value.lng], 15)

  // OpenStreetMap Kacheln hinzufügen
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Blauen Punkt für den User setzen
  L.circleMarker([coords.value.lat, coords.value.lng], {
    radius: 8,
    fillColor: "#3b82f6",
    color: "#fff",
    weight: 2,
    fillOpacity: 1
  }).addTo(map).bindPopup("Du bist hier")

  // Landmark-Marker jetzt hinzufügen (abhängig von stamps)
  addLandmarkMarkers()
}

// Bei Änderungen an stamps oder landmarks Marker neu rendern
watch([stamps, landmarks], () => {
  addLandmarkMarkers()
})

onMounted(async () => {
  try {
    await getBrowserLocation()
    await Promise.all([loadStamps(), loadLandmarks()])
    initMap()
  } catch (err) {
    console.error("Konnte Standort nicht laden", err)
    // Fallback: Berlin Zentrum, falls GPS verweigert wird
    coords.value = { lat: 52.5200, lng: 13.4050 }
    await Promise.all([loadStamps(), loadLandmarks()])
    initMap()
  }
})
</script>

<template>
  <div class="map-container">
    <div id="map"></div>

    <div class="overlay-card">
      <div v-if="closestLandmark" class="card">
        <h2 class="card-title">{{ closestLandmark.name }}</h2>
        <p class="card-subtitle">
          {{ closestLandmark.city }}, {{ closestLandmark.country }} ·
          {{ closestLandmark.distance.toFixed(0) }} m entfernt
        </p>
        <button 
          :disabled="!canCollect"
          class="card-button"
          :class="canCollect ? 'card-button--active' : 'card-button--disabled'"
          @click="collectStamp"
        >
          {{ canCollect ? 'Stempel sammeln (Foto aufnehmen)' : 'Zu weit weg' }}
        </button>
        <p v-if="saveMessage" class="card-info">{{ saveMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  position: relative;
  height: calc(100vh - 56px); /* Platz für BottomNav */
  width: 100%;
  overflow: hidden;
}

#map {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.overlay-card {
  position: absolute;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  width: 90%;
  max-width: 420px;
  z-index: 1000;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border: 1px solid #e5e5e5;
}

.card-title {
  font-weight: 700;
  margin: 0 0 4px;
}

.card-subtitle {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px;
}

.card-button {
  width: 100%;
  padding: 8px 12px;
  border-radius: 999px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
}

.card-button--active {
  background-color: #22c55e;
  color: white;
}

.card-button--active:hover {
  background-color: #16a34a;
  transform: translateY(-1px);
}

.card-button--disabled {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>

<!-- Global styles for custom pin icons -->
<style>
.custom-pin {
  background: none !important;
  border: none !important;
}
</style>

