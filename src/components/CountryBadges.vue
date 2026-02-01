<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useCountryStamps } from '../composables/useCountryStamps'
import { useStamps } from '../composables/useStamps'
import { STAMP_LIMITS } from '../data/stampThresholds'
import { COUNTRIES } from '../data/countries'

const { countryProgress } = useCountryStamps()
const { stampEntries, loadStamps } = useStamps()

onMounted(() => {
  loadStamps().catch(() => {})
})

const totalOf = (code: string) => {
  const key = (code ?? '').toString().toUpperCase()
  const fromProgress = Math.max((countryProgress.value as any)?.[key] ?? 0, (countryProgress.value as any)?.[key.toLowerCase()] ?? 0)
  if (fromProgress > 0) return fromProgress
  return stampEntries.value.filter(s => ((s.countryCode ?? '').toString().toUpperCase() === key)).length
}

const counts = computed(() => {
  const m: Record<string, number> = {}
  for (const s of stampEntries.value ?? []) {
    if (!s.countryCode) continue
    const code = (s.countryCode ?? '').toString().toUpperCase()
    m[code] = (m[code] ?? 0) + 1
  }
  return m
})

const visibleBadges = computed(() => {
  const res: Array<{ code: string; name: string; count: number; tier: null | 'bronze' | 'silver' | 'gold' }> = []
  const seen = new Set<string>()
  // include codes from counts and countryProgress
  for (const k of Object.keys(counts.value)) seen.add(k)
  if (countryProgress.value) Object.keys(countryProgress.value).forEach(k => seen.add(k.toUpperCase()))

  for (const code of Array.from(seen)) {
    const count = counts.value[code] ?? totalOf(code)
    if (!count || count <= 0) continue
    let tier: null | 'bronze' | 'silver' | 'gold' = null
    if (count >= STAMP_LIMITS.gold) tier = 'gold'
    else if (count >= STAMP_LIMITS.silver) tier = 'silver'
    else if (count >= STAMP_LIMITS.bronze) tier = 'bronze'
    const name = COUNTRIES.find(c => c.code === code)?.uiName ?? code
    res.push({ code, name, count, tier })
  }
  res.sort((a, b) => b.count - a.count)
  return res
})

const stampUrl = (tier: string, code: string) =>
  new URL(`../assets/stamps/${tier}/${code}.png`, import.meta.url).href
</script>

<template>
  <div class="country-badges">
    <div v-for="b in visibleBadges" :key="b.code" class="badge-item">
      <div class="badge-visual" :title="b.name">
        <img :src="stampUrl(b.tier ?? 'bronze', b.code)" :alt="b.tier ? (b.tier + ' ' + b.name) : ('Noch ' + b.count)" class="badge-img" :class="{ faded: !b.tier }" />
        <div v-if="!b.tier" class="badge-overlay">+{{ b.count }}</div>
      </div>
      <div class="badge-name">{{ b.name }}</div>
    </div>
    <div v-if="visibleBadges.length === 0" class="empty-hint">Noch keine Länder‑Badges</div>
  </div>
</template>

<style scoped>
.country-badges { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:12px }
.badge-item { width:92px; display:flex; flex-direction:column; align-items:center }
.badge-visual { width:64px; height:64px; display:grid; place-items:center; background: #fff; border-radius:10px; box-shadow: 0 6px 18px rgba(2,6,23,0.06); position:relative }
.badge-img { width:56px; height:56px; object-fit:contain }
.badge-img.faded { opacity:0.35; filter:grayscale(80%) }
.badge-overlay { position:absolute; right:6px; top:6px; background: rgba(0,0,0,0.7); color:white; font-weight:700; padding:2px 6px; border-radius:8px; font-size:12px }
.badge-count { font-weight:700 }
.badge-name { margin-top:8px; font-size:12px; text-align:center; color: #374151 }
.empty-hint { color:#6b7280; font-size:13px }
</style>