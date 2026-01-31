<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showBottomNav = computed(() => route.path !== '/login' && route.path !== '/camera')
</script>

<template>
  <router-view />
  <BottomNav v-if="showBottomNav" />
</template>

<style>
body {
  margin: 0;
}
</style>
