<script setup lang="ts">
import { COUNTRIES } from "../data/countries";

type Tier = "gold" | "silver" | "bronze";

/**
 * Erzeugt die korrekte Bild-URL für eine Briefmarke
 * z.B. ../assets/stamps/bronze/DE.png
 */
const stampUrl = (tier: Tier, countryCode: string) => {
  return new URL(
    `../assets/stamps/${tier}/${countryCode}.png`,
    import.meta.url
  ).href;
};

/**
 * Erstmal: alles gesperrt (grau)
 * Später ersetzen wir das durch echte Logik
 */
const isUnlocked = (_countryCode: string, _tier: Tier) => false;

const progressText = (tier: Tier) => {
  if (tier === "bronze") return "0/5";
  if (tier === "silver") return "0/10";
  return "0/20";
};

const tierLabel = (tier: Tier) => {
  if (tier === "gold") return "Gold";
  if (tier === "silver") return "Silber";
  return "Bronze";
};
</script>

<template>
  <div class="page">
    <h1>Meine Briefmarken</h1>

    <div
      class="country"
      v-for="country in COUNTRIES"
      :key="country.code"
    >
      <div class="countryHeader">
        <h2>{{ country.uiName ?? country.name }}</h2>
        <p class="sub">0 Sehenswürdigkeiten entdeckt</p>
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
            :class="{ locked: !isUnlocked(country.code, tier) }"
            :alt="`${tierLabel(tier)} ${country.code}`"
          />

          <div class="label">{{ tierLabel(tier) }}</div>
          <div class="progress">{{ progressText(tier) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 16px;
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
