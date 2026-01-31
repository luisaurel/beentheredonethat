<template>
  <div class="chronik-page">
    <h1>Chronik-Ansicht</h1>

    <button @click="goToCamera">
      Kamera
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goToCamera() {
  router.push('/camera')
}
</script>

<style scoped>
.chronik-page {
  height: 100vh;
  padding: 24px 16px 80px;
  max-width: 420px;
  margin: 0 auto;
  overflow: hidden;
  background: #0f172a;
  color: #f8fafc;
}
</style>
