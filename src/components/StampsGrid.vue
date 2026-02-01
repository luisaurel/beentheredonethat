<script setup lang="ts">
import { computed, onMounted } from "vue";
import { COUNTRIES } from "../data/countries";
import { STAMP_THRESHOLDS, getTier } from "../data/stampThresholds";
import { useCountryStamps } from "../composables/useCountryStamps";

type Tier = "gold" | "silver" | "bronze";

const { countryProgress, loading, error, loadCountryData } = useCountryStamps();

onMounted(() => {
  loadCountryData();
});

/**
 * ⚠️ Pfad anpassen, falls du noch "stamps/stamps" hast:
 * Variante A (ohne doppelt stamps):
 *   ../assets/stamps/${tier}/${code}.png
 * Variante B (mit doppelt stamps) – wenn es bei dir so liegt:
 *   ../assets/stamps/stamps/${tier}/${code}.png
 */
const stampUrl = (tier: Tier, code: string) =>
  new URL(`../assets/stamps/${tier}/${code}.png`, import.meta.url).href


const countOf = (code: string) => countryProgress.value?.[code as any] ?? 0;

const totalDiscoveries = computed(() => {
  const p = countryProgress.value;
  if (!p) return 0;
  return Object.values(p).reduce((a, b) => a + b, 0);
});

const progressText = (tier: Tier, count: number) => {
  if (tier === "bronze") return `${count}/${STAMP_THRESHOLDS.bronze}`;
  if (tier === "silver") return `${count}/${STAMP_THRESHOLDS.silver}`;
  return `${count}/${STAMP_THRESHOLDS.gold}`;
};

const tierLabel = (tier: Tier) => {
  if (tier === "gold") return "Gold";
  if (tier === "silver") return "Silber";
  return "Bronze";
};

const isUnlocked = (tier: Tier, count: number) => {
  const t = getTier(count);
  if (tier === "bronze") return t.bronze;
  if (tier === "silver") return t.silver;
  return t.gold;
};

defineExpose({ totalDiscoveries });
</script>

<template>
  <div>
    <p v-if="loading" class="hint">Lade Briefmarken...</p>
    <p v-if="error" class="hint">{{ error }}</p>

    <div
      class="country"
      v-for="country in COUNTRIES"
      :key="country.code"
    >
      <div class="countryHeader">
        <h2>{{ country.uiName ?? country.name }}</h2>
        <p class="sub">
          {{ countOf(country.code) }}
          {{ countOf(country.code) === 1 ? "Sehenswürdigkeit" : "Sehenswürdigkeiten" }}
          entdeckt
        </p>
      </div>

      <div class="stampsRow">
        <div
          class="stampCard"
          v-for="tier in (['gold','silver','bronze'] as const)"
          :key="tier"
        >
          <img
            :src="stampUrl(tier, country.code)"
            class="stamp"
            :class="{ locked: !isUnlocked(tier, countOf(country.code)) }"
            :alt="`${tierLabel(tier)} ${country.code}`"
          />

          <div class="label">{{ tierLabel(tier) }}</div>
          <div class="progress">{{ progressText(tier, countOf(country.code)) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hint {
  text-align: center;
  opacity: 0.75;
  margin: 10px 0 18px;
}

.country {
  margin-bottom: 24px;
}

.countryHeader h2 {
  margin: 0;
}

.sub {
  margin: 4px 0 12px;
  opacity: 0.7;
}

.stampsRow {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stampCard {
  width: 110px;
  text-align: center;
}

.stamp {
  width: 72px;
  height: 72px;
  object-fit: contain;
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.locked {
  filter: grayscale(1);
  opacity: 0.35;
}

.label {
  margin-top: 6px;
  font-weight: 600;
}

.progress {
  font-size: 0.9rem;
  opacity: 0.75;
}
</style>
