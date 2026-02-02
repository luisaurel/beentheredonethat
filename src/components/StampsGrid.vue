<script setup lang="ts">
import { computed, onMounted } from "vue";
import { COUNTRIES, type CountryCode } from "../data/countries";
import { useCountryStamps } from "../composables/useCountryStamps";
import { useStamps } from "../composables/useStamps";
import { STAMP_LIMITS, getTierStarted, splitCounts } from "../data/stampThresholds";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../composables/useAuth";
import { reverseGeocode } from "../composables/useReverseGeocode";

type Tier = "bronze" | "silver" | "gold";

const { countryProgress } = useCountryStamps();
const { stampEntries, loadStamps } = useStamps();
const { user } = useAuth();

onMounted(() => {
  // Ensure stamp entries are loaded so the fallback counting works
  loadStamps().catch(() => {})
});

const unknownCount = computed(() => stampEntries.value.filter(s => !s.countryCode).length);

const backfillMissing = async () => {
  if (!user.value) return alert('Nicht eingeloggt')
  if (!confirm('Fehlende Länder jetzt automatisch zuordnen?')) return
  for (const s of stampEntries.value.filter(s => !s.countryCode)) {
    if (!s.lat || !s.lng) continue
    try {
      const g = await reverseGeocode(s.lat, s.lng)
      if (!g.countryCode) continue
      const ref = doc(db, 'users', user.value.uid, 'stamps', s.id!)
      await updateDoc(ref, { country: g.country, countryCode: g.countryCode, region: g.region, city: g.city, geoResolved: true })
    } catch (e) {
      // ignore individual failures
      console.error('backfill failed for', s.id, e)
    }
  }
  // reload local cache
  await loadStamps()
};

const stampUrl = (tier: Tier, code: string) =>
  new URL(`../assets/stamps/${tier}/${code}.png`, import.meta.url).href;

const totalOf = (code: string) => {
  const key = code.toUpperCase();
  const fromProgressUpper = countryProgress.value?.[key as CountryCode] ?? 0;
  const fromProgressLower = countryProgress.value?.[key.toLowerCase() as CountryCode] ?? 0;
  const fromProgress = Math.max(fromProgressUpper, fromProgressLower);
  if (fromProgress > 0) return fromProgress;
  // fallback: count stamps in stampEntries that have this countryCode (case-insensitive)
  return stampEntries.value.filter(s => ((s.countryCode ?? '').toString().toUpperCase() === key)).length;
};

const tierCountOf = (code: string, tier: Tier) => {
  const total = totalOf(code);
  const split = splitCounts(total);
  return split[tier];
};

const tierLimit = (tier: Tier) => STAMP_LIMITS[tier];

// Show actual tier cards only when threshold reached: bronze @5, silver @10, gold @20
const showCard = (code: string, tier: Tier) => {
  const total = totalOf(code);
  return total >= tierLimit(tier);
};

const isStarted = (code: string, tier: Tier) => {
  const total = totalOf(code);
  const started = getTierStarted(total);
  return started[tier];
};

const isComplete = (code: string, tier: Tier) =>
  tierCountOf(code, tier) >= tierLimit(tier);

const isFaded = (code: string, tier: Tier) => isStarted(code, tier) && !isComplete(code, tier);

const countryUiName = (c: { code: string; name?: string }) => (c as any).uiName ?? c.name ?? c.code;

const tierLabel = (tier: Tier) => {
  if (tier === "gold") return "Gold";
  if (tier === "silver") return "Silber";
  return "Bronze";
};

const discoveriesText = (total: number) =>
  `${total} ${total === 1 ? "Sehenswürdigkeit" : "Sehenswürdigkeiten"} entdeckt`;

const visibleCountries = computed(() => {
  const codes = new Set<string>();
  for (const c of COUNTRIES) codes.add(c.code);
  if (countryProgress.value) Object.keys(countryProgress.value).forEach(k => codes.add(k.toUpperCase()));
  for (const s of stampEntries.value) if (s.countryCode) codes.add((s.countryCode ?? '').toString().toUpperCase());

  const result: Array<{ code: string; name: string }> = [];
  for (const code of Array.from(codes)) {
    if (totalOf(code) <= 0) continue;
    const found = COUNTRIES.find(c => c.code === code);
    result.push(found ? found : { code, name: code });
  }
  return result;
});
</script>

<template>
  <div class="wrap">
    <section v-for="country in visibleCountries" :key="country.code" class="country">
      <div class="countryHeader">
        <div class="title">{{ countryUiName(country) }}</div>
        <div class="sub">{{ discoveriesText(totalOf(country.code)) }}</div>
        <div v-if="totalOf(country.code) > 0 && totalOf(country.code) < STAMP_LIMITS.bronze" class="discovered">Entdeckt ({{ totalOf(country.code) }})</div>
      </div>

      <div class="row">
        <!-- Reihenfolge: Bronze -> Silber -> Gold -->
        <template v-for="tier in (['bronze', 'silver', 'gold'] as const)" :key="tier">
          <div v-if="showCard(country.code, tier)" class="card">
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

    <div v-if="visibleCountries.length === 0">
      <p class="hint">Noch keine Briefmarken – sammle deine ersten Sehenswürdigkeiten ✨</p>
      <div v-if="unknownCount > 0" class="unknown">
        <div>{{ unknownCount }} Fotos ohne Landzuordnung</div>
        <button class="btn" @click="backfillMissing">Fehlende Länder zuordnen</button>
      </div>
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
.discovered {
  margin-top: 6px;
  font-size: 13px;
  color: #2563eb;
  font-weight: 700;
}
.unknown { margin-top: 8px; display:flex; gap:8px; align-items:center }
.unknown .btn { background:#111827; color:white; padding:6px 8px; border-radius:6px; border:none }
</style>
