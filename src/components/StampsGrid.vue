<script setup lang="ts">
import { computed, onMounted } from "vue";
import { COUNTRIES, type CountryCode } from "../data/countries";
import { useCountryStamps } from "../composables/useCountryStamps";
import { STAMP_LIMITS, getTierStarted, splitCounts } from "../data/stampThresholds";

type Tier = "gold" | "silver" | "bronze";

const { countryProgress, loading, error, loadCountryData } = useCountryStamps();

onMounted(() => {
  loadCountryData();
});

/**
 * Pfad zu deinen Assets:
 * src/assets/stamps/<tier>/<CODE>.png
 * Beispiel: src/assets/stamps/bronze/DE.png
 *
 * Wenn dein Ordner anders heißt, passe NUR diese Funktion an.
 */
const stampUrl = (tier: Tier, code: string) =>
  new URL(`../assets/stamps/${tier}/${code}.png`, import.meta.url).href;

const totalOf = (code: string) => (countryProgress.value?.[code as CountryCode] ?? 0);

const tierCountOf = (code: string, tier: Tier) => {
  const total = totalOf(code);
  const split = splitCounts(total);
  return split[tier];
};

const tierLimit = (tier: Tier) => STAMP_LIMITS[tier];

const isStarted = (code: string, tier: Tier) => {
  const total = totalOf(code);
  const started = getTierStarted(total);
  return started[tier];
};

const countryUiName = (c: (typeof COUNTRIES)[number]) => (c as any).uiName ?? c.name;

const tierLabel = (tier: Tier) => {
  if (tier === "gold") return "Gold";
  if (tier === "silver") return "Silber";
  return "Bronze";
};

const discoveriesText = (total: number) =>
  `${total} ${total === 1 ? "Sehenswürdigkeit" : "Sehenswürdigkeiten"} entdeckt`;

/** Optional: Gesamtfortschritt (für Debug oder später) */
const totalDiscoveries = computed(() => {
  const p = countryProgress.value;
  if (!p) return 0;
  return Object.values(p).reduce((a, b) => a + b, 0);
});
</script>

<template>
  <div class="wrap">
    <p v-if="loading" class="hint">Lade Briefmarken...</p>
    <p v-else-if="error" class="hint">{{ error }}</p>

    <div v-else>
      <section v-for="country in COUNTRIES" :key="country.code" class="country">
        <div class="countryHeader">
          <div class="title">{{ countryUiName(country) }}</div>
          <div class="sub">{{ discoveriesText(totalOf(country.code)) }}</div>
        </div>

        <div class="row">
          <div
            v-for="tier in (['gold','silver','bronze'] as const)"
            :key="tier"
            class="card"
          >
            <img
              :src="stampUrl(tier, country.code)"
              class="stamp"
              :class="{ locked: !isStarted(country.code, tier) }"
              :alt="`${tierLabel(tier)} ${country.code}`"
            />

            <div class="label">{{ tierLabel(tier) }}</div>
            <div class="progress">
              {{ tierCountOf(country.code, tier) }}/{{ tierLimit(tier) }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hint {
  text-align: center;
  opacity: 0.75;
  margin: 10px 0 18px;
}

.country {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.countryHeader .title {
  font-weight: 700;
  font-size: 18px;
  line-height: 1.2;
}

.countryHeader .sub {
  margin-top: 4px;
  font-size: 14px;
  opacity: 0.7;
}

.row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.card {
  width: 120px;
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
  font-weight: 700;
}

.progress {
  font-size: 14px;
  opacity: 0.75;
}
</style>
