<template>
  <div class="shell">
    <header class="topbar">

  <div class="topbar-left">
    <slot name="topbar-left" />
  </div>

  <h1 class="title">{{ title }}</h1>

  <div class="topbar-right">
    <slot name="topbar-right" />
  </div>
</header>


    <main class="content">
      <slot />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/chronik" custom v-slot="{ navigate, isActive }">
        <a class="item" @click="navigate">
          <img
            :src="isActive ? stampActive : stamp"
            class="icon"
            alt="Meine Briefmarken"
          />
        </a>
      </RouterLink>

      <RouterLink to="/map" custom v-slot="{ navigate, isActive }">
        <a class="item" @click="navigate">
          <img
            :src="isActive ? mapActive : map"
            class="icon"
            alt="Karte"
          />
        </a>
      </RouterLink>

      <RouterLink to="/profil" custom v-slot="{ navigate, isActive }">
        <a class="item" @click="navigate">
          <img
            :src="isActive ? profileActive : profile"
            class="icon"
            alt="Profil"
          />
        </a>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import stamp from './assets/stamp.png'
import stampActive from './assets/stamp-active.png'
import map from './assets/map.png'
import mapActive from './assets/map-active.png'
import profile from './assets/profile.png'
import profileActive from './assets/profile-active.png'

defineProps<{ title: string }>()
</script>

<style scoped>
.shell {
  height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.topbar {
  position: relative; /* ✅ nötig für topbar-right absolute */
  flex: 0 0 auto;
  height: calc(52px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eaeaea;
  background: #fff;
  padding: 0 12px;
  z-index: 10;
}

.title {
  margin: 0;
}

.topbar-right {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-left {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
}


.content {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  padding-bottom: calc(var(--nav-height) + 16px + env(safe-area-inset-bottom));
}

.bottom-nav {
  flex: 0 0 auto;
  height: var(--nav-height);
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eaeaea;
  background: #fff;
  z-index: 10;
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
