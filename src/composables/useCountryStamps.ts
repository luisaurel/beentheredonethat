import { ref } from "vue";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";
import { COUNTRIES, type CountryCode } from "../data/countries";


type CountryProgress = Record<CountryCode, number>;
type CountryPhotos = Partial<Record<CountryCode, string[]>>;

const loading = ref(false);
const error = ref<string | null>(null);
const countryProgress = ref<CountryProgress | null>(null);
const countryPhotos = ref<CountryPhotos>({});

function emptyProgress(): CountryProgress {
  const p = {} as CountryProgress;
  for (const c of COUNTRIES) p[c.code] = 0;
  return p;
}

export function useCountryStamps() {
  const { user } = useAuth();

  const loadCountryData = async () => {
    if (!user.value) return;
    loading.value = true;
    error.value = null;

    try {
      const userRef = doc(db, "users", user.value.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        const init = emptyProgress();
        await setDoc(userRef, { countryProgress: init, countryPhotos: {} }, { merge: true });
        countryProgress.value = init;
        countryPhotos.value = {};
        return;
      }

      const data = snap.data() as any;
      countryProgress.value = data.countryProgress ?? emptyProgress();
      countryPhotos.value = data.countryPhotos ?? {};
    } catch (e: any) {
      error.value = e?.message ?? "Fehler beim Laden";
    } finally {
      loading.value = false;
    }
  };

  // Das rufst du auf, wenn ein Foto gemacht wurde
   const addDiscovery = async (countryCode: CountryCode, photoUrl?: string) => {
  if (!user.value) return;
  const userRef = doc(db, "users", user.value.uid);

  // 1) Firestore: sicherstellen, dass das Dokument existiert
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    const init = emptyProgress();
    await setDoc(userRef, { countryProgress: init, countryPhotos: {} }, { merge: true });
    countryProgress.value = init;
    countryPhotos.value = {};
  }

  // 2) Firestore: atomisch erhöhen + optional Foto anhängen
  await updateDoc(userRef, {
    [`countryProgress.${countryCode}`]: increment(1),
    ...(photoUrl ? { [`countryPhotos.${countryCode}`]: arrayUnion(photoUrl) } : {}),
  });

  // 3) Lokal: UI sofort aktualisieren (ohne nochmal zu laden)
  if (!countryProgress.value) countryProgress.value = emptyProgress();
  countryProgress.value = {
    ...countryProgress.value,
    [countryCode]: (countryProgress.value[countryCode] ?? 0) + 1,
  };

  if (photoUrl) {
    const current = countryPhotos.value[countryCode] ?? [];
    countryPhotos.value = {
      ...countryPhotos.value,
      [countryCode]: [...current, photoUrl],
    };
  }
};


  return {
    loading,
    error,
    countryProgress,
    countryPhotos,
    loadCountryData,
    addDiscovery
  };
}
