import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

import Login from '../views/Login.vue'
import Chronik from '../views/Chronik.vue'
import Map from '../views/Map.vue'
import Profil from '../views/Profil.vue'
import Camera from '../views/Camera.vue'
import MyStamps from "../views/MyStamps.vue";

const routes = [
  { 
    path: '/', 
    name: 'Start',
    redirect: '/login' 
  },
  { 
    path: '/login',
    name: 'Login',
    component: Login 
  },
  { 
    path: '/chronik', 
    name: 'Chronik',
    component: Chronik,
    meta: { requiresAuth: true }
  },
  { 
    path: '/map', 
    name: 'Map',
    component: Map,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profil', 
    name: 'Profil',
    component: Profil,
    meta: { requiresAuth: true }
  },
  { 
    path: '/camera', 
    name: 'Camera',
    component: Camera,
    meta: { requiresAuth: true }
  },
  {
  path: "/my-stamps",
  name: "MyStamps",
  component: MyStamps,
  meta: { requiresAuth: true }
  },


]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Globaler Route Guard: prüft bei jedem Seitenwechsel, ob der User Zugriff hat
router.beforeEach(async (to, _from, next) => {
  const { user, isReady } = useAuth()

  // Warten, bis Firebase Auth initialisiert ist (max. 2 Sekunden)
  if (!isReady.value) {
    let attempts = 0
    const maxAttempts = 20 // 20 * 100ms = 2 Sekunden max
    
    while (!isReady.value && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  // Wenn Route Login erfordert und kein User eingeloggt ist → zurück zum Login
  if (requiresAuth && !user.value) {
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    })
    return
  }

  // Wenn User schon eingeloggt ist und auf Login-Seite will → auf Chronik umleiten
  if (to.name === 'Login' && user.value) {
    next({ name: 'Chronik' })
    return
  }

  // Sonst: normal weiternavigieren
  next()
})

export default router