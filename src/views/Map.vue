<script setup lang="ts">
import AppShell from '../AppShell.vue'
import { onMounted, onUnmounted, computed, ref, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'vue-router'
import { useLocation } from '../composables/useLocation'
import { useLandmarks } from '../composables/useLandmarks'
import { useStamps } from '../composables/useStamps'

const router = useRouter()
const { coords, getBrowserLocation, calculateDistance } = useLocation()
const { landmarks, loadLandmarks, loadLandmarksForBounds, loading: landmarksLoading } = useLandmarks()
const { stamps, loadStamps } = useStamps()

const saveMessage = ref<string | null>(null)
let map: L.Map | null = null
let landmarkMarkers: L.Layer[] = []
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const landmarksWithDistance = computed(() => {
  if (!coords.value.lat || !coords.value.lng || landmarks.value.length === 0) return []

  return landmarks.value
    .filter(landmark => landmark.location && typeof landmark.location.lat === 'number')
    .map(landmark => {
      const { lat, lng } = landmark.location
      return {
        ...landmark,
        distance: calculateDistance(coords.value.lat, coords.value.lng, lat, lng)
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
  router.push({ name: 'Camera', query: { landmark: closestLandmark.value.name } })
}


// Lädt Overpass-Landmarks für aktuellen Kartenausschnitt
const loadOverpassLandmarks = async () => {
  if (!map) return
  
  const bounds = map.getBounds()
  await loadLandmarksForBounds({
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast()
  })
}

// Debounced Version für Map-Events
const debouncedLoadOverpass = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadOverpassLandmarks, 500)
}

const addLandmarkMarkers = () => {
  if (!map) return

  landmarkMarkers.forEach(m => map?.removeLayer(m))
  landmarkMarkers = []

  landmarks.value.forEach(landmark => {
    if (!landmark.location || typeof landmark.location.lat !== 'number') return

    const { lat, lng } = landmark.location
    const collected = stamps.value.includes(landmark.name)
    
    // Unterschiedliche Farben: Orange = nicht besucht, Grün = besucht, Blau = Overpass
    let color = '#f97316' // Orange für Firebase
    if (collected) {
      color = '#22c55e' // Grün wenn gesammelt
    } else if (landmark.source === 'overpass') {
      color = '#3b82f6' // Blau für Overpass-Landmarks
    }

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

    // Popup-Text anpassen für Overpass-Landmarks
    const popupText = landmark.city && landmark.country
      ? `<b>${landmark.name}</b><br>${landmark.city}, ${landmark.country}`
      : `<b>${landmark.name}</b>`

    const marker = L.marker([lat, lng], { icon: pinIcon })
      .addTo(map!)
      .bindPopup(popupText)

    landmarkMarkers.push(marker)
  })
}

const initMap = async () => {
  if (!coords.value.lat || map) return

  await nextTick()

  map = L.map('map').setView([coords.value.lat, coords.value.lng], 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  L.circleMarker([coords.value.lat, coords.value.lng], {
    radius: 8,
    fillColor: '#3b82f6',
    color: '#fff',
    weight: 2,
    fillOpacity: 1
  }).addTo(map).bindPopup('Du bist hier')

  addLandmarkMarkers()
  
  // Overpass-Landmarks für initialen Ausschnitt laden
  await loadOverpassLandmarks()

  // Event-Listener für Map-Bewegung
  map.on('moveend', debouncedLoadOverpass)
  map.on('zoomend', debouncedLoadOverpass)

  setTimeout(() => map?.invalidateSize(), 200)
}

watch([stamps, landmarks], () => addLandmarkMarkers())

onMounted(async () => {
  try {
    await getBrowserLocation()
    await Promise.all([loadStamps(), loadLandmarks()])
    await initMap()
  } catch (err) {
    console.error('Konnte Standort nicht laden', err)
    coords.value = { lat: 52.52, lng: 13.405, accuracy: 0 }
    await Promise.all([loadStamps(), loadLandmarks()])
    await initMap()
  }
})

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (map) {
    map.off('moveend', debouncedLoadOverpass)
    map.off('zoomend', debouncedLoadOverpass)
  }
})
</script>

<template>
  <AppShell title="Karte" class="map-shell">
    <div class="map-container">
      <div id="map"></div>

      <!-- Loading Indicator -->
      <div v-if="landmarksLoading" class="loading-indicator">
        <span class="loading-spinner"></span>
        Lade Wahrzeichen...
      </div>

      <div class="overlay-card">
        <div v-if="closestLandmark" class="card">
          <h2 class="card-title">{{ closestLandmark.name }}</h2>
          <p class="card-subtitle">
            <template v-if="closestLandmark.city && closestLandmark.country">
              {{ closestLandmark.city }}, {{ closestLandmark.country }} ·
            </template>
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
  </AppShell>
</template>

<style scoped>
/* Map soll wirklich edge-to-edge sein */
:deep(.map-shell .topbar),
:deep(.map-shell .bottom-nav) {
  border: none !important;
}

:deep(.map-shell .content) {
  padding: 0 !important;
  padding-bottom: 0 !important;
  overflow: hidden !important;
}

.map-container {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.loading-indicator {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.camera-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.camera-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.camera-btn:active {
  transform: scale(0.95);
}

.camera-btn-icon {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

#map {
  height: 100%;
  width: 100%;
}

.overlay-card {
  position: absolute;
  left: 50%;
  bottom: calc(var(--nav-height) + 12px + env(safe-area-inset-bottom));
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
}

.card-button--active {
  background-color: black;
  color: white;
}

.card-button--disabled {
  background-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>

<style>
.custom-pin {
  background: none !important;
  border: none !important;
}
</style>
