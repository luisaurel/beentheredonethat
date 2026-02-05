<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppShell from '../AppShell.vue'
import { useRouter } from 'vue-router'
import { db } from '../firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

import editIcon from '../assets/edit.png'
import logoutIcon from '../assets/logout.png'


import { useStamps } from '../composables/useStamps'
import { useLandmarks } from '../composables/useLandmarks'
import { useAuth } from '../composables/useAuth'

type Profile = {
  name: string
  bio: string
  avatarDataUrl: string
}

const router = useRouter()
const { user, isReady, logout } = useAuth()

const doLogout = async () => {
  try {
    await logout()
  } finally {
    router.push({ name: 'Login', query: { forceLogin: '1' } })
  }
}


// --- Profil (Edit) ---
const profile = ref<Profile>({
  name: '',
  bio: '',
  avatarDataUrl: ''
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

const saveEdit = async () => {
  const nextProfile: Profile = {
    name: formName.value.trim() || profile.value.name,
    bio: formBio.value,
    avatarDataUrl: formAvatarDataUrl.value || profile.value.avatarDataUrl
  }

  profile.value = nextProfile

  try {
    if (!user.value) throw new Error('Kein eingeloggter User')
    await setDoc(doc(db, 'users', user.value.uid), nextProfile, { merge: true })
  } catch (e) {
    console.error('Konnte Profil nicht in Firestore speichern', e)
  } finally {
    isEditing.value = false
  }
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

// --- Daten aus Firebase/Composables ---
const { loadStamps, collectedCountries, stampEntries, deleteStamp } = useStamps()
const { loadLandmarks } = useLandmarks()

// galleryTiles removed (we keep only the my-photos grid)


// --- Alle gemachten Fotos (für Grid-Anzeige) ---
const userPhotos = computed(() => {
  // use stampEntries (subcollection) because it contains every saved stamp with photoUrl
  return stampEntries.value
    .filter(s => !!s.photoUrl)
    .slice() // copy
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
      const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
      return tb - ta
    })
})

// Flaggen-Emoji aus ISO2 (z.B. 'DE' -> 🇩🇪)
function countryCodeToEmoji(code?: string | null | undefined) {
  if (!code || code.length !== 2) return '🏳️'
  return code.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
}

function getCountryName(code?: string | null | undefined) {
  if (!code) return undefined
  return collectedCountries.value[code]?.name
}

// Slideshow functions removed — gallery modal no longer used

// --- Collected Countries / Badges ---
const collectedCountriesList = computed(() => {
  return Object.entries(collectedCountries.value).map(([code, v]) => ({ code, name: v.name, firstCollectedAt: v.firstCollectedAt, stamps: v.stamps ?? [] }))
})


const selectedCountry = ref<string | null>(null)
const openCountry = (code?: string | null) => { selectedCountry.value = code ?? null; countriesModalOpen.value = true }

// Modal control to open the countries list (from the stat)
const countriesModalOpen = ref(false)
const openCountriesModal = () => { countriesModalOpen.value = true; selectedCountry.value = null }
const closeCountriesModal = () => { countriesModalOpen.value = false; selectedCountry.value = null }

const countryStamps = computed(() => {
  if (!selectedCountry.value) return []
  return stampEntries.value.filter(s => s.countryCode === selectedCountry.value)
})

const onDelete = async (id?: string) => {
  if (!id) return
  const ok = confirm('Foto löschen? Diese Aktion kann nicht rückgängig gemacht werden.')
  if (!ok) return
  try {
    await deleteStamp(id)
  } catch (e) {
    console.error(e)
    alert('Löschen fehlgeschlagen')
  }
}

onMounted(async () => {
  // warten bis Firebase Auth initialisiert ist
  while (!isReady.value) {
    await new Promise((r) => setTimeout(r, 20))
  }

  // Profil aus Firestore laden
  if (user.value) {
    try {
      const snap = await getDoc(doc(db, 'users', user.value.uid))
      if (snap.exists()) {
        const data = snap.data() as Partial<Profile>
        profile.value = {
          name: data.name ?? '',
          bio: data.bio ?? '',
          avatarDataUrl: data.avatarDataUrl ?? ''
        }
      }
    } catch (e) {
      console.error('Konnte Profil nicht aus Firestore laden', e)
    }
  }

  await Promise.all([loadStamps(), loadLandmarks()])
})

// Stats
// Anzahl Sehenswürdigkeiten = Anzahl gemachter Fotos
const sightsCount = computed(() => userPhotos.value.length)

// Use collectedCountries from Firestore (more accurate than landmarks' country strings)
const countriesCount = computed(() => Object.keys(collectedCountries.value).length)
</script>

<template>
  <AppShell title="Profil" class="profile-shell">
    <template #topbar-left>
      <button class="edit-topbar-btn" @click="openEdit" aria-label="Profil bearbeiten">
        <img :src="editIcon" alt="" />
      </button>
    </template>

    <template #topbar-right>
      <button class="logout-btn" type="button" @click="doLogout" aria-label="Abmelden">
        <img :src="logoutIcon" alt="" class="logout-icon" />
      </button>
    </template>

    <div class="profile">
      <!-- Header -->
      <section class="top">
        <div class="avatar">
  <img
    v-if="profile.avatarDataUrl"
    :src="profile.avatarDataUrl"
    alt="Profilbild"
  />
</div>
        <div class="meta">
          <div class="name-row">
            <div class="name">{{ profile.name }}</div>
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

        <div class="stat clickable-stat" @click="openCountriesModal" role="button" tabindex="0">
          <div class="stat-number">{{ countriesCount }}</div>
          <div class="stat-label">Länder</div>
        </div>
      </section>

      <div class="divider"></div>

      <!-- Countries Modal (opened from the "Länder" stat) -->
      <div v-if="countriesModalOpen" class="country-modal-backdrop" @click.self="closeCountriesModal">
        <div class="country-modal">
          <button class="modal-close" @click="closeCountriesModal">✕</button>

          <template v-if="!selectedCountry">
            <h3>Gesammelte Länder ({{ countriesCount }})</h3>
            <div v-if="collectedCountriesList.length">
              <button v-for="c in collectedCountriesList" :key="c.code" class="country-row" @click="openCountry(c.code)">
                <div class="code">{{ c.code }}</div>
                <div class="name">{{ c.name }}</div>
                <div class="count">{{ (c.stamps || []).length }} Stamps</div>
              </button>
            </div>
            <div v-else class="empty-state">Keine Länder gesammelt.</div>
          </template>

          <template v-else>
            <button class="btn-ghost" @click="selectedCountry = null">← Zurück</button>
            <h3>Stamps in {{ collectedCountriesList.find(x => x.code === selectedCountry)?.name }}</h3>

            <div v-if="countryStamps.length">
              <div v-for="s in countryStamps" :key="s.id" class="country-stamp">
                <div class="meta">
                  <div class="name">{{ s.name }}</div>
                  <div class="when">{{ s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : '' }}</div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">Keine Stamps in diesem Land.</div>
          </template>
        </div>
      </div>


      <!-- Meine Fotos (3-Spalten-Grid mit Flagge) -->
      <section class="my-photos" aria-label="Meine Fotos">
        <div v-if="userPhotos.length" class="my-photos-grid">
          <button v-for="p in userPhotos" :key="p.id" class="my-photo-grid-item" type="button" @click="openCountry(p.countryCode)">
            <img :src="p.photoUrl ?? ''" :alt="p.name" />
            <div class="flag" :title="getCountryName(p.countryCode) || p.countryCode || 'Unbekannt'">{{ countryCodeToEmoji(p.countryCode) }}</div>
            <button class="delete-btn" @click.stop="onDelete(p.id)" aria-label="Foto löschen">✕</button>
          </button>
        </div>
        <div v-else class="empty-state">Noch keine Fotos — mach eins in der Kamera.</div>
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

      <!-- Slideshow removed -->
    </div>
  </AppShell>
</template>

<style scoped>
/* DEIN CSS: unverändert */
.logout-btn {
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 10px;
  cursor: pointer;
}

.logout-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.logout-icon {
  width: 20px;
  height: 20px;
}

.edit-topbar-btn {
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 10px;
  cursor: pointer;
}

.edit-topbar-btn:active {
  background: rgba(0, 0, 0, 0.06);
}

.edit-topbar-btn img {
  width: 20px;
  height: 20px;
}

/* Layout */
.profile {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Top Bereich */
.top {
  display: flex;
  gap: 20px;
  align-items: center;
}

.avatar {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  background: #e5e5e5;
  border: 1px solid #d1d5db;
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  margin-bottom: 6px;
}

.name {
  font-weight: 600;
  font-size: 18px;
  line-height: 1.2;
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


/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.5;
  padding: 48px 16px;
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
  box-sizing: border-box;
}

.modal {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid #ededed;
  padding: 14px;
  box-shadow: 0 18px 45px rgba(0,0,0,0.22);

  max-height: calc(100svh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow: auto;
  -webkit-overflow-scrolling: touch;

  box-sizing: border-box;
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
  flex-wrap: wrap;
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
  max-width: 100%;
  box-sizing: border-box;

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
  flex-wrap: wrap;
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


/* My Photos grid (3 columns) */
.my-photos { margin: 8px 0 12px }
.my-photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px }
.my-photo-grid-item { position: relative; width: 100%; padding: 0; border: none; background: transparent; border-radius: 10px; overflow: hidden }
.my-photo-grid-item img { width: 100%; height: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block }
.my-photo-grid-item .flag { position: absolute; left: 6px; top: 6px; background: rgba(255,255,255,0.9); border-radius: 6px; padding: 2px 6px; font-weight: 700; font-size: 14px }
.my-photo-grid-item .delete-btn { position: absolute; right: 6px; top: 6px; background: rgba(0,0,0,0.6); color: #fff; border: none; width: 28px; height: 28px; border-radius: 6px; display: grid; place-items: center; cursor: pointer }
.my-photo-grid-item .delete-btn:active { transform: scale(0.97) }




/* Country Modal */
.country-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 20px;
}
.country-modal {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 24px 48px rgba(0,0,0,0.25);
}
.country-modal .modal-close {
  float: right;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}
.country-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
  width: 100%;
}
.country-row .code { font-weight: 800; margin-right: 12px }
.country-row .name { color: #374151 }
.country-row .count { color: #6b7280; font-size: 12px }
.country-stamp {
  display: block;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.country-stamp .meta .name { font-weight: 700 }
.country-stamp .meta .when { font-size: 12px; color: #6b7280 }
.clickable-stat { cursor: pointer }

</style>
