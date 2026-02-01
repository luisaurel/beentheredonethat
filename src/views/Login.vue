<template>
  <div class="login-backdrop">
    <div class="login-page">
      <h1 class="login-title">BeenThereDoneThat</h1>

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

          <!-- Registrierung -->
          <div v-if="!isLogin" class="signup-extra">
            <input
              v-model="name"
              type="text"
              placeholder="Name"
              class="login-input"
              required
              autocomplete="name"
            />

            <textarea
              v-model="bio"
              placeholder="Beschreibung"
              class="login-input"
              rows="3"
            />

            <div class="signup-avatar">
  <div class="avatar-preview-circle">
    <img
      v-if="avatarDataUrl"
      :src="avatarDataUrl"
      alt="Profilbild Vorschau"
    />
  </div>

  <label class="avatar-pick-btn">
    Profilbild auswählen
    <input type="file" accept="image/*" @change="onPickAvatar" />
  </label>
</div>

          </div>

          <button type="submit" class="login-submit">
            {{ isLogin ? 'Einloggen' : 'Account erstellen' }}
          </button>
        </form>

        <div class="login-toggle-wrapper">
          <button
            @click="toggleMode"
            class="login-toggle"
            type="button"
          >
            {{ isLogin
              ? 'Noch kein Account? Hier registrieren'
              : 'Bereits einen Account? Hier einloggen' }}
          </button>
        </div>

        <p v-if="error" class="login-error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const isLogin = ref(true)

const name = ref('')
const bio = ref('')
const avatarDataUrl = ref('')

const { login, signup, error } = useAuth()
const router = useRouter()

const handleSubmit = async () => {
  if (isLogin.value) {
    await login(email.value, password.value)
  } else {
    await signup(email.value, password.value, {
      name: name.value.trim(),
      bio: bio.value,
      avatarDataUrl: avatarDataUrl.value
    })
  }

  if (!error.value) {
    router.push('/map')
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = null

  if (isLogin.value) {
    name.value = ''
    bio.value = ''
    avatarDataUrl.value = ''
  }
}

const onPickAvatar = (e) => {
  const input = e.target
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    const result = reader.result
    if (typeof result === 'string') {
      avatarDataUrl.value = result
    }
  }
  reader.readAsDataURL(file)
  input.value = ''
}
</script>

<style scoped>
.login-backdrop {
  position: fixed;
  /* Stellt sicher, dass es wirklich den kompletten Screen füllt */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  display: grid;
  place-items: center;
  
  /* Das Bild muss den gesamten Container überlagern */
  background-image: url('../assets/login_pic.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  /* Falls noch Weiß durchblitzt, setzen wir eine Hintergrundfarbe */
  background-color: #000; 
  
  /* Padding nur für den Inhalt, nicht für das Hintergrundbild */
  padding: env(safe-area-inset-top) 16px env(safe-area-inset-bottom) 16px;
  box-sizing: border-box;
}

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

.signup-extra {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.signup-avatar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-preview-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e5e5e5;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #d1d5db;
  display: grid;
  place-items: center;
}

.avatar-preview-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
}

.avatar-pick-btn input {
  display: none;
}

.signup-extra textarea {
  resize: none;
}

</style>
