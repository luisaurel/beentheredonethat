<template>
  <div class="camera-page">
    <div class="camera-header">
      <template v-if="isFreePhoto">
        <h1 class="camera-title">Foto aufnehmen</h1>
        <p class="camera-subtitle">Nimm ein Foto an diesem Ort auf – es wird als eigene Briefmarke gespeichert.</p>
      </template>
      <template v-else>
        <h1 class="camera-title">Foto von {{ landmarkName }}</h1>
        <p class="camera-subtitle">Mache ein Foto des Wahrzeichens für deine Briefmarke.</p>
      </template>
    </div>

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
  padding: 16px 20px 80px;
  max-width: 480px;
  margin: 0 auto;
  height: 100vh;
  background: #ffffff;
  color: #1e293b;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  touch-action: none;
  display: flex;
  flex-direction: column;
}

.camera-header {
  margin-bottom: 24px;
  text-align: center;
}

.camera-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
  color: #0f172a;
}

.camera-subtitle {
  font-size: 15px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.camera-area {
  position: relative;
  width: 100%;
  aspect-ratio: 4/5; /* Taller aspect ratio looks more modern */
  background: #f1f5f9;
  border-radius: 24px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
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
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

.camera-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto; /* Push to bottom */
  padding-bottom: 20px;
}

/* Primary Action Button (Capture/Save) */
.btn-capture,
.btn-save {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: none;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  background: #0f172a; /* Dark primary button for high contrast */
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1), 0 2px 4px -1px rgba(15, 23, 42, 0.06);
}

.btn-capture:hover,
.btn-save:hover:not(:disabled) {
  background: #1e293b;
  transform: translateY(-1px);
}

.btn-capture:active,
.btn-save:active:not(:disabled) {
  transform: translateY(0);
}

.btn-save:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Secondary Action Button (Retake) */
.btn-retake {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retake:hover {
  background: #f8fafc;
  color: #1e293b;
}

/* Close/Cancel Button */
.btn-close,
.btn-close-secondary {
  width: 100%;
  padding: 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  font-size: 15px;
  cursor: pointer;
  transition: color 0.2s;
}

.btn-close-secondary:hover {
  color: #334155;
}

.camera-error {
  color: #ef4444;
  font-size: 14px;
  margin: 0;
  text-align: center;
  padding: 8px;
  background: #fef2f2;
  border-radius: 8px;
}

.btn-flip {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, background 0.2s ease;
  z-index: 10;
}

.btn-flip:hover {
  background: #ffffff;
  transform: scale(1.05) rotate(180deg);
}

.btn-flip:active {
  transform: scale(0.95) rotate(180deg);
}

</style>
