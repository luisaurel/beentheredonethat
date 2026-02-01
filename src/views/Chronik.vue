<script setup lang="ts">
import { computed } from "vue";
import AppShell from "../AppShell.vue";
import StampsGrid from "../components/StampsGrid.vue";
import { useCountryStamps } from "../composables/useCountryStamps";

const { countryProgress } = useCountryStamps();

const totalDiscoveries = computed(() => {
  const p = countryProgress.value;
  if (!p) return 0;
  return Object.values(p).reduce((a, b) => a + b, 0);
});

const hasStamps = computed(() => totalDiscoveries.value > 0);
</script>

<template>
  <AppShell title="Meine Briefmarken">
    <div v-if="!hasStamps" class="empty">
      Es ist Zeit, etwas zu erleben ✨<br />
      Sammle deine ersten Briefmarken.
    </div>

    <StampsGrid v-else />
  </AppShell>
</template>

<style scoped>
.empty {
  text-align: center;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.5;
  padding: 48px 16px;
}
</style>
