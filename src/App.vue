<script setup lang="ts">
</script>

<template>
  <router-view />

  <BottomNav v-if="showBottomNav" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNavigation.vue'

const route = useRoute()

const showBottomNav = computed(() => {
  return route.path !== '/login' && route.path !== '/camera'
})
</script>

<style>
body {
  margin: 0;
}
</style>
