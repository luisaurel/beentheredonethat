<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '../AppShell.vue'

import pisa1 from '../assets/pisa1.jpg'
import editIcon from '../assets/edit.png'

type Profile = {
  name: string
  bio: string
  sightsCount: number
  countriesCount: number
  avatarDataUrl: string // wir speichern das Profilbild als dataURL
}

const STORAGE_KEY = 'profile_v1'

// Startwerte
const profile = ref<Profile>({
  name: 'Mia Maus',
  bio: 'Travel-Lover 🌍❤️',
  sightsCount: 12,
  countriesCount: 4,
  avatarDataUrl: pisa1
})

// Galerie (Demo)
const galleryImages = computed(() => Array.from({ length: 9 }, () => profile.value.avatarDataUrl))

// ---------- Edit-Modal State ----------
const isEditing = ref(false)

const formName = ref('')
const formBio = ref('')
const formAvatarDataUrl = ref<string>('')

// Modal öffnen: Formular mit aktuellen Werten füllen
const openEdit = () => {
  formName.value = profile.value.name
  formBio.value = profile.value.bio
  formAvatarDataUrl.value = profile.value.avatarDataUrl
  isEditing.value = true
}

const closeEdit = () => {
  isEditing.value = false
}

// Profil speichern + persistieren
const saveEdit = () => {
  profile.value = {
    ...profile.value,
    name: formName.value.trim() || profile.value.name,
    bio: formBio.value,
    avatarDataUrl: formAvatarDataUrl.value || profile.value.avatarDataUrl
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile.value))
  isEditing.value = false
}

// Bild auswählen → in DataURL umwandeln (Preview + speichern möglich)
const onPickAvatar = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result === 'string') {
      formAvatarDataUrl.value = result
    }
  }
  reader.readAsDataURL(file)

  // damit man das gleiche Bild nochmal auswählen kann
  input.value = ''
}

// Beim Start: aus LocalStorage laden (falls vorhanden)
onMounted(() => {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return
  try {
    const saved = JSON.parse(raw) as Profile
    if (saved?.name && saved?.avatarDataUrl) profile.value = saved
  } catch {
    // ignore
  }
})
</script>

<template>
  <AppShell title="Profil">
    <div class="profile">
      <!-- Header: Avatar + Name + Bio + Edit Button -->
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
          <div class="stat-number">{{ profile.sightsCount }}</div>
          <div class="stat-label">Sehenswürdigkeiten</div>
        </div>

        <div class="stat">
          <div class="stat-number">{{ profile.countriesCount }}</div>
          <div class="stat-label">Länder</div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Galerie -->
      <section class="gallery" aria-label="Gesammelte Sehenswürdigkeiten">
        <button v-for="(img, idx) in galleryImages" :key="idx" class="tile" type="button">
          <img :src="img" alt="Sehenswürdigkeit Foto" />
        </button>
      </section>
    </div>

    <!-- Edit Modal -->
    <div v-if="isEditing" class="modal-backdrop" @click.self="closeEdit">
      <div class="modal">
        <div class="modal-title">Profil bearbeiten</div>

        <div class="modal-avatar-row">
          <img class="modal-avatar" :src="formAvatarDataUrl || profile.avatarDataUrl" alt="Avatar Vorschau" />

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
  margin-bottom: 1px;
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

/* Modal */
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

.file-input {
  display: none;
}

.field {
  display: block;
  margin-bottom: 10px;
}

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

.input:focus, .textarea:focus {
  border-color: #cfcfcf;
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

.btn-ghost {
  background: #fff;
}

.btn-primary {
  background: #111;
  border-color: #111;
  color: #fff;
}
</style>
