<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useStamps } from '../composables/useStamps'
import { useLandmarks } from '../composables/useLandmarks'

const { stamps, stampPhotos, loadStamps } = useStamps()
const { landmarks, loadLandmarks } = useLandmarks()

// Gallery modal state
const selectedLandmark = ref<{ name: string; city: string; country: string } | null>(null)
const currentImageIndex = ref(0)

const collectedLandmarks = computed(() => {
  if (!stamps.value.length || !landmarks.value.length) return []
  return landmarks.value.filter(l => stamps.value.includes(l.name))
})

const getStampPhotos = (landmarkName: string): string[] => stampPhotos.value[landmarkName] ?? []
const getFirstPhoto = (landmarkName: string): string | null => getStampPhotos(landmarkName)[0] ?? null
const getPhotoCount = (landmarkName: string): number => getStampPhotos(landmarkName).length

const selectedPhotos = computed(() => {
  if (!selectedLandmark.value) return []
  return getStampPhotos(selectedLandmark.value.name)
})

const openGallery = (landmark: { name: string; city: string; country: string }) => {
  selectedLandmark.value = landmark
  currentImageIndex.value = 0
}

const closeGallery = () => {
  selectedLandmark.value = null
  currentImageIndex.value = 0
}

const nextImage = () => {
  if (currentImageIndex.value < selectedPhotos.value.length - 1) {
    currentImageIndex.value++
  }
}

const prevImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

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
        @click="openGallery(landmark)"
      >
        <div v-if="getFirstPhoto(landmark.name)" class="stamp-image-wrap">
          <img :src="getFirstPhoto(landmark.name)!" :alt="landmark.name" class="stamp-image" />
          <span v-if="getPhotoCount(landmark.name) > 1" class="photo-count">
            {{ getPhotoCount(landmark.name) }}
          </span>
        </div>
        <div v-else class="stamp-image-placeholder">📷</div>
        <h2 class="stamp-name">{{ landmark.name }}</h2>
        <p class="stamp-location">
          {{ landmark.city }}, {{ landmark.country }}
        </p>
      </article>
    </div>

    <!-- Gallery Modal -->
    <div v-if="selectedLandmark" class="gallery-overlay" @click.self="closeGallery">
      <div class="gallery-modal">
        <button class="gallery-close" @click="closeGallery">✕</button>
        
        <h2 class="gallery-title">{{ selectedLandmark.name }}</h2>
        <p class="gallery-subtitle">{{ selectedLandmark.city }}, {{ selectedLandmark.country }}</p>
        
        <div v-if="selectedPhotos.length" class="gallery-content">
          <button 
            v-if="selectedPhotos.length > 1" 
            class="gallery-nav gallery-nav--prev" 
            :disabled="currentImageIndex === 0"
            @click="prevImage"
          >
            ‹
          </button>
          
          <div class="gallery-image-wrap">
            <img :src="selectedPhotos[currentImageIndex]" :alt="selectedLandmark.name" class="gallery-image" />
          </div>
          
          <button 
            v-if="selectedPhotos.length > 1" 
            class="gallery-nav gallery-nav--next" 
            :disabled="currentImageIndex === selectedPhotos.length - 1"
            @click="nextImage"
          >
            ›
          </button>
        </div>
        
        <p v-if="selectedPhotos.length > 1" class="gallery-counter">
          {{ currentImageIndex + 1 }} / {{ selectedPhotos.length }}
        </p>
      </div>
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
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.stamp-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.stamp-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #e5e7eb;
}

.stamp-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
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

/* Gallery Modal */
.gallery-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.gallery-modal {
  background: #1e293b;
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  padding: 20px;
  position: relative;
}

.gallery-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.gallery-title {
  color: #f9fafb;
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  padding-right: 40px;
}

.gallery-subtitle {
  color: #94a3b8;
  font-size: 13px;
  margin: 0 0 16px;
}

.gallery-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gallery-image-wrap {
  flex: 1;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-nav {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.gallery-nav:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.gallery-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.gallery-counter {
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
  margin: 12px 0 0;
}
</style>