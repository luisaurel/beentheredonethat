<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useLocation } from '../composables/useLocation'
import { landmarks } from '../data/landmarks'

const { coords, getBrowserLocation, calculateDistance } = useLocation()

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

const closestLandmark = computed(() => landmarksWithDistance.value[0] || null)

onMounted(async () => {
  try {
    await getBrowserLocation()
  } catch (err) {
    console.error('Standort-Zugriff verweigert', err)
  }
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold mb-4">Wahrzeichen in der Nähe</h1>

    <div v-if="closestLandmark" class="border p-4 rounded-lg shadow">
      <h2 class="font-bold text-lg">
        {{ closestLandmark.name }}
      </h2>
      <p class="text-sm text-gray-600 mb-2">
        {{ closestLandmark.city }}, {{ closestLandmark.country }}
      </p>

      <div class="mt-4">
        <p class="text-sm">
          Entfernung:
          <strong>{{ closestLandmark.distance.toFixed(0) }} Meter</strong>
        </p>

        <button
          :disabled="closestLandmark.distance > 50"
          class="w-full mt-2 p-3 rounded font-bold transition"
          :class="closestLandmark.distance <= 50 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'"
        >
          {{ closestLandmark.distance <= 50 ? 'Jetzt einchecken!' : 'Zu weit entfernt' }}
        </button>
      </div>
    </div>

    <div class="mt-8 text-xs text-gray-400 border-t pt-2">
      Dein Standort: {{ coords.lat.toFixed(5) }}, {{ coords.lng.toFixed(5) }}
    </div>
  </div>
</template>