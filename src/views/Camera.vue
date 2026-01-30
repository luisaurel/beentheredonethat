<template>
  <div class="camera-page">
    <div v-if="!landmarkName" class="camera-message">
      <p>Kein Wahrzeichen ausgewählt.</p>
      <button class="btn-close" @click="close">Schließen</button>
    </div>

    <template v-else>
      <h1 class="camera-title">Foto von {{ landmarkName }}</h1>
      <p class="camera-subtitle">Mache ein Foto des Wahrzeichens für deine Briefmarke.</p>

      <div class="camera-area">
        <video v-show="stream" ref="videoRef" class="camera-video" autoplay playsinline muted></video>
        <div v-show="!stream && !capturedBlob" class="camera-placeholder">
          Kamera wird geladen…
        </div>
        <img v-if="capturedBlob" :src="previewUrl" alt="Vorschau" class="camera-preview" />
      </div>

      <div class="camera-actions">
        <template v-if="!capturedBlob">
          <button v-if="stream" class="btn-capture" @click="capture">Foto aufnehmen</button>
          <p v-if="cameraError" class="camera-error">{{ cameraError }}</p>
        </template>
        <template v-else>
          <button class="btn-retake" @click="retake">Nochmal aufnehmen</button>
          <button class="btn-save" :disabled="isSaving" @click="saveAndClose">
            {{ isSaving ? 'Speichere…' : 'Speichern & Briefmarke sammeln' }}
          </button>
        </template>
      </div>

      <button class="btn-close-secondary" @click="close">Abbrechen</button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase/config'
import { useAuth } from '../composables/useAuth'
import { useStamps } from '../composables/useStamps'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { addStamp } = useStamps()

const landmarkName = computed(() => (route.query.landmark as string) ?? '')

const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const capturedBlob = ref<Blob | null>(null)
const previewUrl = ref<string>('')
const cameraError = ref<string | null>(null)
const isSaving = ref(false)

onMounted(async () => {
  if (!landmarkName.value) return
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    stream.value = media
    if (videoRef.value) videoRef.value.srcObject = media
  } catch (e: any) {
    cameraError.value = e?.message ?? 'Kamera-Zugriff fehlgeschlagen'
  }
})

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

function capture() {
  if (!videoRef.value || !stream.value) return
  const video = videoRef.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0)
  canvas.toBlob(
    (blob) => {
      if (!blob) return
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      capturedBlob.value = blob
      previewUrl.value = URL.createObjectURL(blob)
      stream.value?.getTracks().forEach((t) => t.stop())
      stream.value = null
    },
    'image/jpeg',
    0.9
  )
}

function retake() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  capturedBlob.value = null
  cameraError.value = null
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then((media) => {
    stream.value = media
    if (videoRef.value) videoRef.value.srcObject = media
  }).catch((e: any) => {
    cameraError.value = e?.message ?? 'Kamera erneut starten fehlgeschlagen'
  })
}

async function saveAndClose() {
  if (!capturedBlob.value || !landmarkName.value || !user.value) return
  isSaving.value = true
  try {
    const path = `users/${user.value.uid}/stamps/${encodeURIComponent(landmarkName.value)}_${Date.now()}.jpg`
    const ref = storageRef(storage, path)
    await uploadBytes(ref, capturedBlob.value, { contentType: 'image/jpeg' })
    const photoUrl = await getDownloadURL(ref)
    await addStamp(landmarkName.value, photoUrl)
    router.replace('/map')
  } catch (e) {
    console.error(e)
    cameraError.value = 'Speichern fehlgeschlagen. Bitte erneut versuchen.'
  } finally {
    isSaving.value = false
  }
}

function close() {
  router.replace('/map')
}
</script>

<style scoped>
.camera-page {
  padding: 24px 16px 80px;
  max-width: 420px;
  margin: 0 auto;
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
}

.camera-message {
  text-align: center;
  padding: 2rem 0;
}

.camera-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 4px;
}

.camera-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 16px;
}

.camera-area {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  background: #1e293b;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-video,
.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
}

.camera-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-capture,
.btn-save {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  background: #22c55e;
  color: white;
}

.btn-capture:hover,
.btn-save:hover:not(:disabled) {
  background: #16a34a;
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-retake {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid #64748b;
  background: transparent;
  color: #94a3b8;
  font-weight: 600;
  cursor: pointer;
}

.btn-close,
.btn-close-secondary {
  margin-top: 16px;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #475569;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
}

.camera-error {
  color: #f87171;
  font-size: 13px;
  margin: 0;
}
</style>
