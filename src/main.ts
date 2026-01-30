import { createApp, type App as VueApp } from 'vue'
import './style.css'
import App from './App.vue'
import {auth} from './firebase/config'
import router from './router'
import {onAuthStateChanged} from 'firebase/auth'
import L from 'leaflet'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

// Ecke für Vite/Bundling: Leaflet erwartet relative Bildpfade; wir setzen explizit die importierten Assets
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIconRetinaUrl,
  shadowUrl: markerShadowUrl
})

let app: VueApp | null = null

// warten auf das erste Signal von Firebase
onAuthStateChanged(auth, (user) => {
    // Nur wenn die App noch nicht gestartet wurde, initialisieren
    if (!app) {
        app = createApp(App)
        app.use(router)
        app.mount('#app')
    }
  
    // Test-Log 
    if (user) {
      console.log("User ist eingeloggt:", user.email)
    } else {
      console.log("Kein User eingeloggt – Firebase ist aber bereit!")
    }
  })