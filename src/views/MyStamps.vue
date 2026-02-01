<script setup lang="ts">
import AppShell from "../AppShell.vue";
import StampsGrid from "../components/StampsGrid.vue";
import { useCountryStamps } from "../composables/useCountryStamps";

const { addDiscovery, loadCountryData } = useCountryStamps();

// optional: stellt sicher, dass user-doc existiert
const ensureUserDoc = async () => {
  await loadCountryData();
};

</script>

<template>
  <AppShell title="Meine Briefmarken">
    <!-- ✅ TEST-Bereich (kannst du später entfernen) -->
    <div class="testBar">
      <button class="btn" @click="testAddItaly">+1 Italien</button>
      <button class="btn" @click="testAddGermany">+1 Deutschland</button>
    </div>

    <StampsGrid />
  </AppShell>
</template>

<style scoped>
.testBar {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  margin-bottom: 10px;
}

.btn {
  border: 1px solid #ddd;
  background: white;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}
</style>
