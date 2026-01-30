import { ref } from 'vue'
import { auth } from '../firebase/config'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

// Globaler State, damit alle Komponenten den gleichen User sehen
const user = ref<User | null>(null)
const error = ref<string | null>(null)
const isReady = ref(false) // Firebase Auth ist initialisiert

// Firebase Auth State Listener: aktualisiert user automatisch
onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
  isReady.value = true // Firebase ist jetzt bereit
})

export function useAuth() {
  
  const signup = async (email: string, password: string) => {
    error.value = null
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      // user.value wird automatisch durch onAuthStateChanged aktualisiert
      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const login = async (email: string, password: string) => {
    error.value = null
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      // user.value wird automatisch durch onAuthStateChanged aktualisiert
      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      // user.value wird automatisch durch onAuthStateChanged auf null gesetzt
    } catch (err: any) {
      error.value = err.message
    }
  }

  return { user, error, isReady, signup, login, logout }
}