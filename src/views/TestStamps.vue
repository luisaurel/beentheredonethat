<script setup lang="ts">
import { onMounted } from "vue";
import { useCountryStamps } from "../composables/useCountryStamps";
import { COUNTRIES } from "../data/countries";


const {
  countryProgress,
  loading,
  error,
  loadCountryData,
  addDiscovery
} = useCountryStamps();

onMounted(() => {
  loadCountryData();
});
</script>

<template>
  <div style="padding: 16px">
    <h2>Stamp Test</h2>

    <p v-if="loading">Loading...</p>
    <p v-if="error">{{ error }}</p>

    <div v-for="c in COUNTRIES" :key="c.code" style="margin-bottom: 12px">
      <strong>{{ c.uiName ?? c.name }}</strong><br />
      Entdeckungen: {{ countryProgress?.[c.code] ?? 0 }}


    </div>
  </div>
</template>
