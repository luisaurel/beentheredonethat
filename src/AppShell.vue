<template>
  <div class="shell">
    <header class="topbar">
      <h1 class="title">{{ title }}</h1>
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
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  height: calc(52px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #eaeaea;
  background: #fff;
  padding: 0 12px;
}

.title {
  margin: 0;
}

.content {
  padding: 16px;
  padding-bottom: calc(
    var(--nav-height) + 16px + env(safe-area-inset-bottom)
  );
}

.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eaeaea;
  background: #fff;
}

.icon {
  width: 24px;
  height: 24px;
}
</style>
