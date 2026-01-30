<template>
  <div class="login-page">
    <h1 class="login-title">BeenThereDoneThat</h1>
    
    <div class="login-card">
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
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="Passwort (min. 6 Zeichen)" 
          class="login-input"
          required 
        />
        
        <button 
          type="submit" 
          class="login-submit"
        >
          {{ isLogin ? 'Einloggen' : 'Account erstellen' }}
        </button>
      </form>

      <div class="login-toggle-wrapper">
        <button @click="isLogin = !isLogin" class="login-toggle">
          {{ isLogin ? 'Noch kein Account? Hier registrieren' : 'Bereits einen Account? Hier einloggen' }}
        </button>
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAuth } from '../composables/useAuth.ts'
  import { useRouter } from 'vue-router'
  
  const email = ref('')
  const password = ref('')
  const isLogin = ref(true) // Switch zwischen Login und Signup
  
  const { user, login, signup, error } = useAuth()
  const router = useRouter()
  
  const handleSubmit = async () => {
    if (isLogin.value) {
      await login(email.value, password.value)
    } else {
      await signup(email.value, password.value)
    }

    // Wenn kein Fehler auftritt, leite zur Landkarte weiter
    if (!error.value) {
      router.push('/map')
    }
  }
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  padding: 24px 16px;
  max-width: 420px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-title {
  font-size: 28px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 24px;
  color: #f9fafb;
}

.login-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  border: 2px dashed #e5e7eb;
}

.login-card-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 0 0 16px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-input {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  outline: none;
}

.login-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.login-submit {
  margin-top: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  background-color: #2563eb;
  color: #ffffff;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease, box-shadow 0.1s ease;
}

.login-submit:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
}

.login-toggle-wrapper {
  margin-top: 16px;
  text-align: center;
}

.login-toggle {
  border: none;
  background: transparent;
  font-size: 12px;
  color: #2563eb;
  cursor: pointer;
  text-decoration: underline;
}

.login-error {
  margin-top: 12px;
  font-size: 12px;
  text-align: center;
  color: #dc2626;
  font-weight: 500;
}
</style>