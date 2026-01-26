<template>
  <div>
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
