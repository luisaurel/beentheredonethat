<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useStamps } from '../composables/useStamps'
import { useLandmarks } from '../composables/useLandmarks'

const { stamps, stampPhotos, loadStamps } = useStamps()
const { landmarks, loadLandmarks } = useLandmarks()

const collectedLandmarks = computed(() => {
  if (!stamps.value.length || !landmarks.value.length) return []
  return landmarks.value.filter(l => stamps.value.includes(l.name))
})

const getStampPhoto = (landmarkName: string) => stampPhotos.value[landmarkName] ?? null

onMounted(async () => {
  await Promise.all([loadStamps(), loadLandmarks()])
})
</script>

<template>
  <div class="profile-page">
    <h1 class="profile-title">Deine Briefmarken</h1>

    <div v-if="!collectedLandmarks.length" class="empty-state">
      <p>Noch keine Briefmarken gesammelt.</p>
      <p class="empty-hint">Besuche Orte auf der Karte und sammle Stempel!</p>
    </div>

    <div v-else class="stamps-grid">
      <article 
        v-for="landmark in collectedLandmarks" 
        :key="landmark.name"
        class="stamp-card"
      >
        <div v-if="getStampPhoto(landmark.name)" class="stamp-image-wrap">
          <img :src="getStampPhoto(landmark.name)!" :alt="landmark.name" class="stamp-image" />
        </div>
        <div v-else class="stamp-image-placeholder">📷</div>
        <h2 class="stamp-name">{{ landmark.name }}</h2>
        <p class="stamp-location">
          {{ landmark.city }}, {{ landmark.country }}
        </p>
      </article>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 24px 16px 80px;
  max-width: 420px;
  margin: 0 auto;
}

.profile-title {
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 20px;
  color: #f9fafb;
}

.empty-state {
  background: #111827;
  border-radius: 16px;
  padding: 18px 16px;
  border: 1px dashed #4b5563;
  color: #e5e7eb;
  font-size: 14px;
}

.empty-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
}

.stamps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stamp-card {
  background: #f9fafb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid #e5e7eb;
}

.stamp-image-wrap {
  width: 100%;
  aspect-ratio: 4/3;
  background: #e5e7eb;
}

.stamp-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.stamp-image-placeholder {
  width: 100%;
  aspect-ratio: 4/3;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.stamp-card .stamp-name,
.stamp-card .stamp-location {
  padding: 0 10px;
}

.stamp-card .stamp-name {
  padding-top: 8px;
}

.stamp-name {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
}

.stamp-location {
  margin: 0 0 10px;
  font-size: 12px;
  color: #6b7280;
}
</style>