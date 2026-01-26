import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import {auth} from './firebase/config'
import router from './router'

createApp(App)
      .use(router)
      .mount('#app')

console.log("Firebase Auth Status:", auth)


//Kleiner test
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("User ist eingeloggt:", user.email);
  } else {
    console.log("Kein User eingeloggt – Firebase ist aber bereit!");
  }
});