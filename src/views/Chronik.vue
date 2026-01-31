<script setup lang="ts">
import { ref, computed } from 'vue'
import AppShell from '../AppShell.vue'

/**
 * Platzhalter-Daten
 * → wird später durch echte Logik ersetzt
 */
const sightsCount = ref(0) // ändere z.B. auf 1 oder 5 zum Testen
const countryName = ref('Italien')

const hasStamps = computed(() => sightsCount.value > 0)
</script>

<template>
  <AppShell title="Meine Briefmarken">
    <div class="chronik">
      <!-- ✅ Empty State -->
      <div v-if="!hasStamps" class="empty">
        Es ist Zeit, etwas zu erleben ✨<br />
        Sammle deine ersten Briefmarken.
      </div>

      <!-- ✅ Platzhalter für spätere Chronik -->
      <section v-else class="country-block">
        <div class="name-row">
          <div class="name">{{ countryName }}</div>
        </div>

        <div class="bio">
          {{ sightsCount }}
          {{ sightsCount === 1 ? 'Sehenswürdigkeit' : 'Sehenswürdigkeiten' }}
        </div>
      </section>
    </div>
  </AppShell>
</template>

<style scoped>
.chronik {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Land */
.country-block {
  display: flex;
  flex-direction: column;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.name {
  font-weight: 600;
  font-size: 18px;
  line-height: 1.2;
}

/* Anzahl Sehenswürdigkeiten */
.bio {
  font-size: 14px;
  line-height: 1.4;
  color: #111;
  white-space: pre-line;
}

/* Empty State */
.empty {
  text-align: center;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.5;
  padding: 48px 16px;
}
</style>
