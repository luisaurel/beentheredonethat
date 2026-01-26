<template>
    <h1>Kamera-Ansicht</h1>
    <button class="close-btn" @click="close">Schließen</button>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function close() {
  router.replace('/chronik')
}
</script>

<style scoped>
.close-btn {
  padding: 8px 12px;
}
</style>