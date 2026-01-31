<template>
  <div class="login-backdrop">
    <div class="login-page">
      <h1 class="login-title">BeenThereDoneThat</h1>

      <!-- Login "Modal" im Stil vom Profil-Bearbeiten -->
      <div class="login-card" role="dialog" aria-modal="true">
        <h2 class="login-card-title">
          {{ isLogin ? 'Anmelden' : 'Registrieren' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="login-form">
          <input
            v-model="email"
            type="email"
            placeholder="E-Mail"
            class="login-input"
            required
            autocomplete="email"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Passwort (min. 6 Zeichen)"
            class="login-input"
            required
            autocomplete="current-password"
          />

          <button type="submit" class="login-submit">
            {{ isLogin ? 'Einloggen' : 'Account erstellen' }}
          </button>
        </form>

        <div class="login-toggle-wrapper">
          <button @click="isLogin = !isLogin" class="login-toggle" type="button">
            {{ isLogin ? 'Noch kein Account? Hier registrieren' : 'Bereits einen Account? Hier einloggen' }}
          </button>
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.ts'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLogin = ref(true)

const { login, signup, error } = useAuth()
const router = useRouter()

const handleSubmit = async () => {
  if (isLogin.value) {
    await login(email.value, password.value)
  } else {
    await signup(email.value, password.value)
  }

  if (!error.value) {
    router.push('/map')
  }
}
</script>

<style scoped>
/* ✅ HIER EINZIGE ÄNDERUNG: Hintergrundbild */
.login-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;

  background-image: url('../assets/login_pic.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* alles darunter UNVERÄNDERT */

.login-page {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 26px;
  box-sizing: border-box;
}

.login-title {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin: 0;
  color: #ffffff;
  letter-spacing: 0.2px;
}

.login-card {
  width: 100%;
  background: #ffffff;
  border-radius: 18px;
  border: 1px solid #ededed;
  padding: 16px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
  box-sizing: border-box;

  max-height: calc(100svh - 32px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.login-card-title {
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 12px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  font-size: 14px;
  outline: none;
  background: #fff;
}

.login-input:focus {
  border-color: #111;
  box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.12);
}

.login-submit {
  margin-top: 4px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #111;
  font-weight: 800;
  font-size: 14px;
  background: #111;
  color: #ffffff;
  cursor: pointer;
}

.login-submit:active {
  transform: translateY(1px);
  opacity: 0.92;
}

.login-toggle-wrapper {
  margin-top: 12px;
  text-align: center;
}

.login-toggle {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #111;
  cursor: pointer;
  text-decoration: underline;
  font-weight: 700;
}

.login-error {
  margin-top: 12px;
  font-size: 12px;
  text-align: center;
  color: #dc2626;
  font-weight: 600;
}
</style>
