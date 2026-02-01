import { ref } from 'vue'
import { auth, db } from '../firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

type ProfileInput = {
  name: string
  bio: string
  avatarDataUrl: string
}

// Globaler State
const user = ref<User | null>(null)
const error = ref<string | null>(null)
const isReady = ref(false)

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser
  isReady.value = true
})

export function useAuth() {
  const signup = async (
    email: string,
    password: string,
    profile?: Partial<ProfileInput>
  ) => {
    error.value = null
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password)

      // Firestore-Profil anlegen/mergen
      await setDoc(
        doc(db, 'users', res.user.uid),
        {
          name: profile?.name ?? '',
          bio: profile?.bio ?? '',
          avatarDataUrl: profile?.avatarDataUrl ?? '',
        },
        { merge: true }
      )

      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const login = async (email: string, password: string) => {
    error.value = null
    try {
      const res = await signInWithEmailAndPassword(auth, email, password)
      return res
    } catch (err: any) {
      error.value = err.message
    }
  }

  const logout = async () => {
    error.value = null
    try {
      await signOut(auth)
    } catch (err: any) {
      error.value = err.message
    }
  }

  return { user, error, isReady, signup, login, logout }
}
