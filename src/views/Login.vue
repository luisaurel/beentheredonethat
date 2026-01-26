<template>
    <div class="login-page p-6 max-w-sm mx-auto flex flex-col justify-center min-h-screen">
      <h1 class="text-3xl font-bold text-center mb-8">BeenThereDoneThat</h1>
      
      <div class="card bg-white p-6 rounded-lg shadow-lg border-2 border-dashed border-gray-300">
        <h2 class="text-xl mb-4 font-semibold text-center">
          {{ isLogin ? 'Anmelden' : 'Registrieren' }}
        </h2>
  
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <input 
            v-model="email" 
            type="email" 
            placeholder="E-Mail" 
            class="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            required 
          />
          <input 
            v-model="password" 
            type="password" 
            placeholder="Passwort (min. 6 Zeichen)" 
            class="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            required 
          />
          
          <button 
            type="submit" 
            class="bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition"
          >
            {{ isLogin ? 'Einloggen' : 'Account erstellen' }}
          </button>
        </form>
  
        <div class="mt-6 text-center">
          <button @click="isLogin = !isLogin" class="text-sm text-blue-500 hover:underline">
            {{ isLogin ? 'Noch kein Account? Hier registrieren' : 'Bereits einen Account? Hier einloggen' }}
          </button>
        </div>
  
        <p v-if="error" class="text-red-500 mt-4 text-xs text-center font-medium">{{ error }}</p>
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