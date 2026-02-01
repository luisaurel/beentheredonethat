<script setup lang="ts">
import { onMounted } from "vue";
import { computed } from "vue";
import { COUNTRIES, type CountryCode } from "../data/countries";
import { useCountryStamps } from "../composables/useCountryStamps";
import { STAMP_LIMITS, getTierStarted, splitCounts } from "../data/stampThresholds";

type Tier = "bronze" | "silver" | "gold";

const { countryProgress } = useCountryStamps();

const stampUrl = (tier: Tier, code: string) =>
  new URL(`../assets/stamps/${tier}/${code}.png`, import.meta.url).href;

const totalOf = (code: string) => countryProgress.value?.[code as CountryCode] ?? 0;

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

const isComplete = (code: string, tier: Tier) =>
  tierCountOf(code, tier) >= tierLimit(tier);

const isFaded = (code: string, tier: Tier) => isStarted(code, tier) && !isComplete(code, tier);

const countryUiName = (c: (typeof COUNTRIES)[number]) => (c as any).uiName ?? c.name;

const tierLabel = (tier: Tier) => {
  if (tier === "gold") return "Gold";
  if (tier === "silver") return "Silber";
  return "Bronze";
};

const discoveriesText = (total: number) =>
  `${total} ${total === 1 ? "Sehenswürdigkeit" : "Sehenswürdigkeiten"} entdeckt`;

<<<<<<< HEAD
=======
const visibleCountries = computed(() =>
  COUNTRIES.filter((c) => totalOf(c.code) > 0)
);
>>>>>>> 011c2eb5f9b3beb8672fe11ac3c6df6c38ccebc1
</script>

<template>
  <div class="wrap">
    <section v-for="country in visibleCountries" :key="country.code" class="country">
      <div class="countryHeader">
        <div class="title">{{ countryUiName(country) }}</div>
        <div class="sub">{{ discoveriesText(totalOf(country.code)) }}</div>
      </div>

      <div class="row">
        <!-- Reihenfolge: Bronze -> Silber -> Gold -->
        <template v-for="tier in (['bronze', 'silver', 'gold'] as const)" :key="tier">
          <div v-if="isStarted(country.code, tier)" class="card">
            <img
              :src="stampUrl(tier, country.code)"
              class="stamp"
              :class="{ faded: isFaded(country.code, tier) }"
              :alt="`${tierLabel(tier)} ${country.code}`"
            />

            <div class="label">{{ tierLabel(tier) }}</div>
            <div class="progress">
              {{ tierCountOf(country.code, tier) }}/{{ tierLimit(tier) }}
            </div>
          </div>
        </template>
      </div>
    </section>

    <p v-if="visibleCountries.length === 0" class="hint">
      Noch keine Briefmarken – sammle deine ersten Sehenswürdigkeiten ✨
    </p>
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
  transition: opacity 0.2s ease;
}

.faded {
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
