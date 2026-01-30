<template>
  <div class="map-container h-screen w-full relative">
    <div id="map" class="h-full w-full"></div>

    <div class="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-sm">
      <div v-if="closestLandmark" class="bg-white p-4 rounded-2xl shadow-xl border border-gray-200">
        <h2 class="font-bold">{{ closestLandmark.name }}</h2>
        <p class="text-xs text-gray-500">{{ closestLandmark.distance.toFixed(0) }}m entfernt</p>
        <button 
          :disabled="closestLandmark.distance > 50"
          class="w-full mt-2 py-2 rounded-lg font-bold transition-all"
          :class="closestLandmark.distance <= 50 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'"
        >
          {{ closestLandmark.distance <= 50 ? 'Stempel sammeln' : 'Zu weit weg' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css' // WICHTIG: CSS importieren!
import { useLocation } from '../composables/useLocation'
import { landmarks } from '../data/landmarks'

const { coords, getBrowserLocation, calculateDistance } = useLocation()
let map: L.Map | null = null

// Distanz-Logik
const landmarksWithDistance = computed(() => {
  return landmarks.map(l => ({
    ...l,
    distance: calculateDistance(coords.value.lat, coords.value.lng, l.lat, l.lng)
  })).sort((a, b) => a.distance - b.distance)
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
    L.marker([landmark.lat, landmark.lng])
      .addTo(map!)
      .bindPopup(`<b>${landmark.name}</b><br>${landmark.description}`)
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

<style>
/* Sicherstellen, dass die Karte den ganzen Platz einnimmt */
#map { z-index: 1; }
</style>