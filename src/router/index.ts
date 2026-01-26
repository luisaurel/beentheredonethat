import { createRouter, createWebHistory } from 'vue-router'

import Login from '../views/Login.vue'
import Chronik from '../views/Chronik.vue'
import Map from '../views/Map.vue'
import Profil from '../views/Profil.vue'
import Camera from '../views/Camera.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/chronik', component: Chronik },
  { path: '/map', component: Map },
  { path: '/profil', component: Profil },
  { path: '/camera', component: Camera },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router