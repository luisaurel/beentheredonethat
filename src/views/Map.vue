<script setup lang="ts">
import { onMounted, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLocation } from '../composables/useLocation'
import { landmarks } from '../data/landmarks'
import AppShell from '../AppShell.vue'

const { coords, getBrowserLocation, calculateDistance } = useLocation()
let map: L.Map | null = null

const landmarksWithDistance = computed(() => {
  if (!coords.value.lat || !coords.value.lng) return []

  return landmarks
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

const initMap = () => {
  if (!coords.value.lat) return

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

  landmarks.forEach(landmark => {
    const { lat, lng } = landmark.location
    L.marker([lat, lng])
      .addTo(map!)
      .bindPopup(`<b>${landmark.name}</b><br>${landmark.city}, ${landmark.country}`)
  })
}

onMounted(async () => {
  try {
    await getBrowserLocation()
    initMap()
  } catch (err) {
    console.error('Konnte Standort nicht laden', err)
    coords.value = { lat: 52.52, lng: 13.405 }
    initMap()
  }
})
</script>

<template>
  <AppShell title="Karte">
    <!-- Wichtig: "map-page" sorgt dafür, dass wir das Padding nur hier entfernen -->
    <div class="map-page">
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
              :disabled="closestLandmark.distance > 50"
              class="card-button"
              :class="closestLandmark.distance <= 50 ? 'card-button--active' : 'card-button--disabled'"
            >
              {{ closestLandmark.distance <= 50 ? 'Stempel sammeln' : 'Zu weit weg' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* 1) Der “komische Rand” kommt meistens vom padding in AppShell .content.
   Wir ziehen das wieder ab, nur auf dieser Seite. */
.map-page {
  margin: -16px; /* entfernt das content-padding links/rechts/oben */
  /* unten: content hat padding-bottom für nav + 16px -> wir neutralisieren das */
  margin-bottom: calc(-1 * (var(--nav-height) + 16px + env(safe-area-inset-bottom)));
}

/* 2) Jetzt die Map-Fläche exakt auf den sichtbaren Bereich setzen (ohne Topbar & Nav) */
.map-container {
  position: relative;
  height: calc(100vh - 52px - var(--nav-height) - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  width: 100%;
  overflow: hidden; /* schneidet Leaflet-Ränder sauber ab */
  background: #fff;
}

/* 3) Leaflet-DIV randlos */
#map {
  height: 100%;
  width: 100%;
  background: #fff;
}

/* Overlay Card bleibt gleich, nur bottom passend zur Nav */
.overlay-card {
  position: absolute;
  left: 50%;
  bottom: calc(var(--nav-height) + 16px + env(safe-area-inset-bottom));
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
