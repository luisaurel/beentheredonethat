import { ref } from 'vue'
import { auth } from '../firebase/config'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  type User
} from 'firebase/auth'

// Globaler State, damit alle Komponenten den gleichen User sehen
const user = ref<User | null>(auth.currentUser)
const error = ref<string | null>(null)

export function useAuth() {
  
  const signup = async (email: string, password: string) => {
    error.value = null
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      user.value = res.user
      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const login = async (email: string, password: string) => {
    error.value = null
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      user.value = res.user
      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      user.value = null
    } catch (err: any) {
      error.value = err.message
    }
  }

  return { user, error, signup, login, logout }
}