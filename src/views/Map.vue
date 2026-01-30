<script setup lang="ts">
import { onMounted, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css' // WICHTIG: CSS importieren!
import { useLocation } from '../composables/useLocation'
import { landmarks } from '../data/landmarks'

const { coords, getBrowserLocation, calculateDistance } = useLocation()
let map: L.Map | null = null

const landmarksWithDistance = computed(() => {
  if (!coords.value.lat || !coords.value.lng) return []

  return landmarks
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

const initMap = () => {
  if (!coords.value.lat) return

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

  // Bens Wahrzeichen als Pins hinzufügen
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
    console.error("Konnte Standort nicht laden", err)
    // Fallback: Berlin Zentrum, falls GPS verweigert wird
    coords.value = { lat: 52.5200, lng: 13.4050 }
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
          :disabled="closestLandmark.distance > 50"
          class="card-button"
          :class="closestLandmark.distance <= 50 ? 'card-button--active' : 'card-button--disabled'"
        >
          {{ closestLandmark.distance <= 50 ? 'Stempel sammeln' : 'Zu weit weg' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  position: relative;
  height: calc(100vh - 56px); /* Platz für BottomNav */
  width: 100%;
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