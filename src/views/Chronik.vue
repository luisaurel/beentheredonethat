<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import AppShell from "../AppShell.vue";
import StampsGrid from "../components/StampsGrid.vue";
import { useCountryStamps } from "../composables/useCountryStamps";
import { useStamps } from "../composables/useStamps";
import { STAMP_LIMITS } from "../data/stampThresholds";
import { COUNTRIES } from "../data/countries";
import CountryBadges from "../components/CountryBadges.vue";

const { countryProgress, loading, error, loadCountryData } = useCountryStamps();
const { stampEntries, loadStamps } = useStamps();

// Daten laden, sobald die Seite geöffnet wird
onMounted(async () => {
  await Promise.all([loadCountryData(), loadStamps()]);
});

const totalDiscoveries = computed(() => {
  const p = countryProgress.value;
  if (!p) return 0;
  return Object.values(p).reduce((a, b) => a + b, 0);
});

const hasStamps = computed(() => totalDiscoveries.value > 0 || (stampEntries.value?.length ?? 0) > 0);

// Minimal badge tier: bronze @5, silver @10, gold @20
const badgeTier = computed<null | 'bronze' | 'silver' | 'gold'>(() => {
  const n = totalDiscoveries.value;
  if (n >= 20) return 'gold';
  if (n >= 10) return 'silver';
  if (n >= 5) return 'bronze';
  return null;
});

// Popup for new photos / tier unlocks
const counts = computed(() => {
  const m: Record<string, number> = {};
  // count per country from stamp entries (may be empty if not loaded yet)
  for (const s of (stampEntries.value ?? [])) {
    if (!s.countryCode) continue;
    const code = (s.countryCode ?? '').toUpperCase();
    m[code] = (m[code] ?? 0) + 1;
  }
  return m;
});


const popup = ref<{ tier: 'bronze' | 'silver' | 'gold' | 'found'; code: string } | null>(null);

const stampUrl = (tier: string, code: string) =>
  new URL(`../assets/stamps/${tier}/${code.toUpperCase()}.png`, import.meta.url).href;

watch(counts, (newVal, oldVal = {}) => {
  for (const [code, curr] of Object.entries(newVal)) {
    const prev = oldVal[code] ?? 0;
    if (curr > prev) {
      if (curr === STAMP_LIMITS.bronze) popup.value = { tier: 'bronze', code };
      else if (curr === STAMP_LIMITS.silver) popup.value = { tier: 'silver', code };
      else if (curr === STAMP_LIMITS.gold) popup.value = { tier: 'gold', code };
      else popup.value = { tier: 'found', code };

      setTimeout(() => (popup.value = null), 3000);
    }
  }
}, { deep: true });

const countryName = (code?: string) => COUNTRIES.find(c => c.code === code)?.uiName ?? code ?? '';

</script>

<template>
  <AppShell title="Meine Briefmarken">
    <div v-if="loading" class="info">Lade Briefmarken…</div>
    <div v-else-if="error" class="info error">{{ error }}</div>

    <!-- Popup für neue Stamps -->
    <div v-if="popup" class="stamp-popup">
      <div class="stamp-popup-inner">
        <img v-if="popup.tier !== 'found'" :src="stampUrl(popup.tier, popup.code)" :alt="popup.tier" />
        <div class="stamp-popup-text">
          <div v-if="popup.tier === 'found'">Entdeckt in {{ countryName(popup.code) || popup.code }}</div>
          <div v-else>{{ popup.tier === 'gold' ? 'Gold' : popup.tier === 'silver' ? 'Silber' : 'Bronze' }} für {{ countryName(popup.code) || popup.code }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="!hasStamps" class="empty">
      Es ist Zeit, etwas zu erleben ✨<br />
      Sammle deine ersten Briefmarken.
    </div>

    <div v-else>
      <CountryBadges />

      <div v-if="badgeTier" class="badge-row">
        <span class="badge" :class="badgeTier">👑</span>
        <span class="badge-label">{{ badgeTier === 'gold' ? 'Gold' : badgeTier === 'silver' ? 'Silber' : 'Bronze' }} ({{ totalDiscoveries }})</span>
      </div>

      <StampsGrid />
    </div>
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

.info {
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
}

.info.error {
  color: #b91c1c;
}
.badge-row {
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:12px;
}
.badge { font-size:22px; }
.badge.gold { color: #d4af37; }
.badge.silver { color: #b0b0b0; }
.badge.bronze { color: #cd7f32; }
.badge-label { font-weight: 700; margin-left:6px; }

.stamp-popup {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 24px;
  z-index: 1100;
}
.stamp-popup-inner {
  display:flex; align-items:center; gap:12px; background: white; padding: 10px 14px; border-radius: 10px; box-shadow: 0 8px 24px rgba(15,23,42,0.12);
}
.stamp-popup img { width: 48px; height: 48px; object-fit: contain }
.stamp-popup-text { font-weight:700 }

.badge-strip { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:12px }
.badge-item { display:flex; flex-direction:column; align-items:center; width:76px; font-size:12px }
.mini-stamp { width:44px; height:44px; object-fit:contain }
.mini-found { width:44px; height:44px; border-radius:8px; background:#e5e7eb; display:grid; place-items:center; font-weight:700 }
.mini-label { margin-top:6px; text-align:center; opacity:0.8 }
</style>
