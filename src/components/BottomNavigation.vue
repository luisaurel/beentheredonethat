<template>
  <nav class="bottom-nav" aria-label="Bottom Navigation">
    <RouterLink to="/chronik" class="nav-btn" active-class="active">Chronik</RouterLink>
    <RouterLink to="/map" class="nav-btn" active-class="active">Map</RouterLink>
    <RouterLink to="/profil" class="nav-btn" active-class="active">Profil</RouterLink>
  </nav>
</template>

<script setup lang="ts">
// keine Logik nötig – RouterLink übernimmt Navigation + active state
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;

  height: 56px;
  display: flex;
  justify-content: space-around;
  align-items: center;

  background: #fff;
  border-top: 1px solid #e5e5e5;
  padding: 0 8px;
  z-index: 1000;
}

.nav-btn {
  flex: 1;
  text-align: center;
  text-decoration: none;
  color: #222;
  padding: 10px 0;
  border-radius: 8px;
  font-size: 14px;
}

.nav-btn.active {
  font-weight: 700;
}
</style>
