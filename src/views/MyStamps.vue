<script setup lang="ts">
import { onMounted } from "vue";
import AppShell from "../AppShell.vue";
import StampsGrid from "../components/StampsGrid.vue";
import { useCountryStamps } from "../composables/useCountryStamps";

const { addDiscovery, loadCountryData } = useCountryStamps();

// Stellt sicher, dass die Daten beim Laden der Seite geholt werden
onMounted(async () => {
  await loadCountryData();
});

const testAddItaly = async () => {
  // Versuche es mit "it" (Kleingeschrieben) oder "IT"
  await addDiscovery("it" as any); 
  console.log("Stempel Italien gesetzt");
};

const testAddGermany = async () => {
  await addDiscovery("de" as any);
  console.log("Stempel Deutschland gesetzt");
};

</script>

<template>
  <AppShell title="Meine Briefmarken">
    <div class="testBar">
      <button class="btn" @click="testAddItaly">+1 Italien</button>
      <button class="btn" @click="testAddGermany">+1 Deutschland</button>
    </div>

    <StampsGrid />
  </AppShell>
</template>

<style scoped>
/* Dein Style bleibt gleich */
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