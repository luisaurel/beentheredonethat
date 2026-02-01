<template>
  <div class="camera-page">
    <template v-if="isFreePhoto">
      <h1 class="camera-title">Foto aufnehmen</h1>
      <p class="camera-subtitle">Nimm ein Foto an diesem Ort auf – es wird als eigene Briefmarke gespeichert.</p>
    </template>
    <template v-else>
      <h1 class="camera-title">Foto von {{ landmarkName }}</h1>
      <p class="camera-subtitle">Mache ein Foto des Wahrzeichens für deine Briefmarke.</p>
    </template>

      <div class="camera-area">
        <video v-show="stream" ref="videoRef" class="camera-video" autoplay playsinline muted></video>
        <div v-show="!stream && !capturedBlob" class="camera-placeholder">
          Kamera wird geladen…
        </div>
        <img v-if="capturedBlob" :src="previewUrl" alt="Vorschau" class="camera-preview" />
        <button v-if="stream && !capturedBlob" class="btn-flip" @click="switchCamera" title="Kamera wechseln">
          🔄
        </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useStamps } from '../composables/useStamps'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { addStamp } = useStamps()

const landmarkName = computed(() => (route.query.landmark as string) ?? '')
const isFreePhoto = computed(() => !landmarkName.value)

// Generate unique stamp name for free photos
const generateFreePhotoName = () => {
  const now = new Date()
  const dateStr = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `Foto ${dateStr} ${timeStr}`
}

const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const capturedBlob = ref<Blob | null>(null)
const previewUrl = ref<string>('')
const cameraError = ref<string | null>(null)
const isSaving = ref(false)
const facingMode = ref<'environment' | 'user'>('environment')

onMounted(async () => {
  // Prüfe ob mediaDevices verfügbar ist (wichtig für PWA)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraError.value = 'Kamera wird auf diesem Gerät nicht unterstützt'
    return
  }
  
  try {
    // Erst Berechtigung prüfen wenn möglich
    if (navigator.permissions) {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        if (permission.state === 'denied') {
          cameraError.value = 'Kamera-Berechtigung wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.'
          return
        }
      } catch {
        // permissions.query wird nicht überall unterstützt, einfach weitermachen
      }
    }
    
    // Versuche mit bevorzugter Rückkamera
    let media: MediaStream | null = null
    try {
      media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      })
    } catch {
      // Fallback: Versuche ohne facingMode-Präferenz
      media = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })
    }
    
    stream.value = media
    if (videoRef.value) {
      videoRef.value.srcObject = media
      // Warte bis Video bereit ist
      await videoRef.value.play().catch(() => {})
    }
  } catch (e: any) {
    console.error('Kamera-Fehler:', e)
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      cameraError.value = 'Kamera-Berechtigung wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.'
    } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
      cameraError.value = 'Keine Kamera gefunden.'
    } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
      cameraError.value = 'Kamera wird bereits von einer anderen App verwendet.'
    } else {
      cameraError.value = e?.message ?? 'Kamera-Zugriff fehlgeschlagen'
    }
  }
})

onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop())
    stream.value = null
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

// Blob zu Base64 Data-URL konvertieren
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function capture() {
  if (!videoRef.value || !stream.value) return
  const video = videoRef.value
  const canvas = document.createElement('canvas')
  // Kleinere Auflösung für Firestore-Limit (max 1MB)
  const maxWidth = 800
  const scale = Math.min(1, maxWidth / video.videoWidth)
  canvas.width = video.videoWidth * scale
  canvas.height = video.videoHeight * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
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
    0.7  // Niedrigere Qualität für kleinere Dateigröße
  )
}

function retake() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  capturedBlob.value = null
  cameraError.value = null
  startCamera()
}

async function startCamera() {
  try {
    const media = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode.value, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
    stream.value = media
    if (videoRef.value) {
      videoRef.value.srcObject = media
      await videoRef.value.play().catch(() => {})
    }
  } catch (e: any) {
    cameraError.value = e?.message ?? 'Kamera starten fehlgeschlagen'
  }
}

async function switchCamera() {
  // Aktuelle Kamera stoppen
  if (stream.value) {
    stream.value.getTracks().forEach(t => t.stop())
    stream.value = null
  }
  // FacingMode umschalten
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  // Neue Kamera starten
  await startCamera()
}

async function saveAndClose() {
  if (!capturedBlob.value || !user.value) return
  isSaving.value = true
  try {
    // Bild als Base64 konvertieren und direkt in Firestore speichern
    const base64Image = await blobToBase64(capturedBlob.value)
    const stampName = isFreePhoto.value ? generateFreePhotoName() : landmarkName.value
    await addStamp(stampName, base64Image)
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
  height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  touch-action: none;
  overscroll-behavior: none;
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

.btn-flip {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: transform 0.2s ease, background 0.2s ease;
}

.btn-flip:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: rotate(180deg);
}
</style>
