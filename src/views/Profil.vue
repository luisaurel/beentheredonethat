<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '../AppShell.vue'

import pisa1 from '../assets/pisa1.jpg'
import editIcon from '../assets/edit.png'

import { useStamps } from '../composables/useStamps'
import { useLandmarks } from '../composables/useLandmarks'

type Profile = {
  name: string
  bio: string
  avatarDataUrl: string
}

const STORAGE_KEY = 'profile_v1'

// --- Profil (Edit + LocalStorage) ---
const profile = ref<Profile>({
  name: 'Mia Maus',
  bio: 'Travel-Lover 🌍❤️',
  avatarDataUrl: pisa1
})

const isEditing = ref(false)
const formName = ref('')
const formBio = ref('')
const formAvatarDataUrl = ref<string>('')

const openEdit = () => {
  formName.value = profile.value.name
  formBio.value = profile.value.bio
  formAvatarDataUrl.value = profile.value.avatarDataUrl
  isEditing.value = true
}

const closeEdit = () => {
  isEditing.value = false
}

const saveEdit = () => {
  profile.value = {
    name: formName.value.trim() || profile.value.name,
    bio: formBio.value,
    avatarDataUrl: formAvatarDataUrl.value || profile.value.avatarDataUrl
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
  isEditing.value = false
}

const onPickAvatar = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result === 'string') formAvatarDataUrl.value = result
  }
  reader.readAsDataURL(file)
  input.value = ''
}

// --- Daten aus Firebase/Composables (neue Funktionalität) ---
const { stamps, stampPhotos, loadStamps } = useStamps()
const { landmarks, loadLandmarks } = useLandmarks()

// Modal fürs Bild-Gallery (pro Landmark mehrere Fotos)
const selectedLandmark = ref<{ name: string; city: string; country: string } | null>(null)
const currentImageIndex = ref(0)

const collectedLandmarks = computed(() => {
  if (!stamps.value.length || !landmarks.value.length) return []
  return landmarks.value.filter(l => stamps.value.includes(l.name))
})

const getStampPhotos = (landmarkName: string): string[] => stampPhotos.value[landmarkName] ?? []
const getFirstPhoto = (landmarkName: string): string | null => getStampPhotos(landmarkName)[0] ?? null

// Für das Grid: wir zeigen pro gesammeltem Landmark das erste Foto (oder fallback)
const galleryTiles = computed(() => {
  return collectedLandmarks.value.map(l => ({
    name: l.name,
    city: l.city,
    country: l.country,
    thumb: getFirstPhoto(l.name) || profile.value.avatarDataUrl,
    hasPhotos: getStampPhotos(l.name).length > 0
  }))
})

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
  if (currentImageIndex.value < selectedPhotos.value.length - 1) currentImageIndex.value++
}

const prevImage = () => {
  if (currentImageIndex.value > 0) currentImageIndex.value--
}

onMounted(async () => {
  // Profil aus LocalStorage laden
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const saved = JSON.parse(raw) as Profile
      if (saved?.name && saved?.avatarDataUrl) profile.value = saved
    } catch {
      // ignore
    }
  }

  // Stamps + Landmarks laden
  await Promise.all([loadStamps(), loadLandmarks()])
})

// Stats (design wie vorher, Werte aus echten Daten)
const sightsCount = computed(() => collectedLandmarks.value.length)

const countriesCount = computed(() => {
  const set = new Set<string>()
  collectedLandmarks.value.forEach(l => set.add(l.country))
  return set.size
})
</script>

<template>
  <AppShell title="Profil">
    <div class="profile">
      <!-- Header: Avatar + Name + Bio -->
      <section class="top">
        <img class="avatar" :src="profile.avatarDataUrl" alt="Profilbild" />

        <div class="meta">
          <div class="name-row">
            <div class="name">{{ profile.name }}</div>

            <button class="edit-btn" type="button" @click="openEdit" aria-label="Profil bearbeiten">
              <img :src="editIcon" alt="" class="edit-icon" />
            </button>
          </div>

          <div class="bio">{{ profile.bio }}</div>
        </div>
      </section>

      <!-- Stats -->
      <section class="stats">
        <div class="stat">
          <div class="stat-number">{{ sightsCount }}</div>
          <div class="stat-label">Sehenswürdigkeiten</div>
        </div>

        <div class="stat">
          <div class="stat-number">{{ countriesCount }}</div>
          <div class="stat-label">Länder</div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Galerie (Insta-Grid) -->
      <section class="gallery" aria-label="Gesammelte Sehenswürdigkeiten">
        <button
          v-for="tile in galleryTiles"
          :key="tile.name"
          class="tile"
          type="button"
          @click="openGallery(tile)"
        >
          <img :src="tile.thumb" :alt="tile.name" />
          <span v-if="!tile.hasPhotos" class="tile-badge">📷</span>
        </button>

        <div v-if="!galleryTiles.length" class="empty">
          Noch keine Sehenswürdigkeiten gesammelt.
        </div>
      </section>

      <!-- Edit Modal -->
      <div v-if="isEditing" class="modal-backdrop" @click.self="closeEdit">
        <div class="modal">
          <div class="modal-title">Profil bearbeiten</div>

          <div class="modal-avatar-row">
            <img
              class="modal-avatar"
              :src="formAvatarDataUrl || profile.avatarDataUrl"
              alt="Avatar Vorschau"
            />

            <label class="pick-btn">
              Bild wählen
              <input class="file-input" type="file" accept="image/*" @change="onPickAvatar" />
            </label>
          </div>

          <label class="field">
            <div class="label">Name</div>
            <input v-model="formName" class="input" type="text" placeholder="Dein Name" />
          </label>

          <label class="field">
            <div class="label">Bio</div>
            <textarea v-model="formBio" class="textarea" rows="3" placeholder="Kurze Beschreibung"></textarea>
          </label>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeEdit">Abbrechen</button>
            <button type="button" class="btn btn-primary" @click="saveEdit">Speichern</button>
          </div>
        </div>
      </div>

      <!-- Gallery Modal (Fotos durchklicken) -->
      <div v-if="selectedLandmark" class="gallery-overlay" @click.self="closeGallery">
        <div class="gallery-modal">
          <button class="gallery-close" @click="closeGallery" type="button">✕</button>

          <h2 class="gallery-title">{{ selectedLandmark.name }}</h2>
          <p class="gallery-subtitle">{{ selectedLandmark.city }}, {{ selectedLandmark.country }}</p>

          <div v-if="selectedPhotos.length" class="gallery-content">
            <button
              v-if="selectedPhotos.length > 1"
              class="gallery-nav"
              :disabled="currentImageIndex === 0"
              @click="prevImage"
              type="button"
            >
              ‹
            </button>

            <div class="gallery-image-wrap">
              <img
                :src="selectedPhotos[currentImageIndex]"
                :alt="selectedLandmark.name"
                class="gallery-image"
              />
            </div>

            <button
              v-if="selectedPhotos.length > 1"
              class="gallery-nav"
              :disabled="currentImageIndex === selectedPhotos.length - 1"
              @click="nextImage"
              type="button"
            >
              ›
            </button>
          </div>

          <div v-else class="gallery-empty">
            Noch keine Fotos für diesen Stempel.
          </div>

          <p v-if="selectedPhotos.length > 1" class="gallery-counter">
            {{ currentImageIndex + 1 }} / {{ selectedPhotos.length }}
          </p>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.profile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Top Bereich */
.top {
  display: flex;
  gap: 18px;
  align-items: center;
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e5e5e5;
  background: #f3f3f3;
}

.meta {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px; /* Abstand Name ↔ Bio */
}

.name {
  font-weight: 800;
  font-size: 18px;
  line-height: 1.2;
}

.edit-btn {
  border: 1px solid #ededed;
  background: #fff;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.edit-icon {
  width: 18px;
  height: 18px;
}

.bio {
  font-size: 14px;
  line-height: 1.4;
  color: #111;
  white-space: pre-line;
}

/* Stats */
.stats {
  display: flex;
  gap: 10px;
}

.stat {
  flex: 1;
  text-align: center;
  padding: 10px 8px;
  border-radius: 14px;
  border: 1px solid #ededed;
  background: #fff;
}

.stat-number {
  font-weight: 800;
  font-size: 18px;
  line-height: 1.1;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

.divider {
  height: 1px;
  background: #eaeaea;
  width: 100%;
}

/* Galerie */
.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  position: relative;
}

.tile {
  position: relative;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

.tile::before {
  content: "";
  display: block;
  padding-top: 100%;
}

.tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile-badge {
  position: absolute;
  right: 6px;
  top: 6px;
  background: rgba(0,0,0,0.65);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  padding: 16px 0;
}

/* Edit Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 16px;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #ededed;
  padding: 14px;
  box-shadow: 0 18px 45px rgba(0,0,0,0.22);
}

.modal-title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 12px;
}

.modal-avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.modal-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e5e5e5;
  background: #f3f3f3;
}

.pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #ededed;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
}

.file-input { display: none; }

.field { display: block; margin-bottom: 10px; }

.label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}

.input, .textarea {
  width: 100%;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn {
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid #ededed;
  font-weight: 800;
  cursor: pointer;
}

.btn-ghost { background: #fff; }

.btn-primary {
  background: #111;
  border-color: #111;
  color: #fff;
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
  max-width: 420px;
  width: 100%;
  padding: 20px;
  position: relative;
}

.gallery-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
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
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: grid;
  place-items: center;
  flex-shrink: 0;
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

.gallery-empty {
  color: #cbd5e1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  padding: 14px;
  text-align: center;
}
</style>
