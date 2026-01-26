import { createApp, type App as VueApp } from 'vue'
import './style.css'
import App from './App.vue'
import {auth} from './firebase/config'
import router from './router'
import {onAuthStateChanged} from 'firebase/auth'

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