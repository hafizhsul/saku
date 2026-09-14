import type { User } from "./types"

// Firebase Auth client (OPSIONAL).
//
// Aktif hanya bila 4 env diset: EXPO_PUBLIC_FIREBASE_API_KEY,
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID,
// EXPO_PUBLIC_FIREBASE_APP_ID. Tanpa itu isFirebaseConfigured() false dan
// authClient memakai alur REST lama. SDK dimuat dinamis (import()) agar
// startup tidak terbebani bila Firebase tak dipakai.

export const FIREBASE_UNAVAILABLE = "FIREBASE_UNAVAILABLE"

// Cache instance native agar initializeAuth tidak dipanggil dua kali
// (panggilan kedua melempar auth/already-initialized).
let cachedAuth: import("firebase/auth").Auth | null = null

export interface FirebaseSession {
  readonly idToken: string
  readonly user: User
}

function readEnv(name: string): string | null {
  // Akses statis langsung process.env.EXPO_PUBLIC_* agar babel-preset-expo
  // bisa inline saat bundling native. Akses dinamis process.env[name] atau
  // via variabel perantara tidak bisa di-inline sehingga kosong di perangkat
  // (Firebase dianggap tak terkonfigurasi, sesi jatuh ke server dan
  // biometrik gagal).
  if (typeof process === "undefined") {
    return null
  }
  let value: string | undefined
  switch (name) {
    case "EXPO_PUBLIC_FIREBASE_API_KEY":
      value = process.env.EXPO_PUBLIC_FIREBASE_API_KEY
      break
    case "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN":
      value = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
      break
    case "EXPO_PUBLIC_FIREBASE_PROJECT_ID":
      value = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
      break
    case "EXPO_PUBLIC_FIREBASE_APP_ID":
      value = process.env.EXPO_PUBLIC_FIREBASE_APP_ID
      break
    default:
      value = undefined
  }
  return value && value.length > 0 ? value : null
}

export function isFirebaseConfigured(): boolean {
  return (
    readEnv("EXPO_PUBLIC_FIREBASE_API_KEY") !== null &&
    readEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN") !== null &&
    readEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID") !== null &&
    readEnv("EXPO_PUBLIC_FIREBASE_APP_ID") !== null
  )
}

async function getAuthInstance(): Promise<{
  auth: import("firebase/auth").Auth
  signIn: typeof import("firebase/auth").signInWithEmailAndPassword
  signUp: typeof import("firebase/auth").createUserWithEmailAndPassword
  setName: typeof import("firebase/auth").updateProfile
  signOutFn: typeof import("firebase/auth").signOut
}> {
  if (!isFirebaseConfigured()) {
    throw new Error(FIREBASE_UNAVAILABLE)
  }
  let appModule: typeof import("firebase/app")
  let authModule: typeof import("firebase/auth")
  try {
    // Dynamic import: paket `firebase` hanya dievaluasi di jalur ini.
    appModule = await import("firebase/app")
    authModule = await import("firebase/auth")
  } catch {
    throw new Error(FIREBASE_UNAVAILABLE)
  }
  const config = {
    apiKey: readEnv("EXPO_PUBLIC_FIREBASE_API_KEY") ?? "",
    authDomain: readEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN") ?? "",
    projectId: readEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID") ?? "",
    appId: readEnv("EXPO_PUBLIC_FIREBASE_APP_ID") ?? "",
  }
  const apps = appModule.getApps()
  const app = apps.length > 0 ? apps[0] : appModule.initializeApp(config)
  // Native (Android/iOS): getAuth() default memakai memori saja sehingga sesi
  // hilang saat restart + warning AsyncStorage. Pakai initializeAuth dengan
  // persistence AsyncStorage (v2: default import). Web tetap getAuth.
  // Deteksi tanpa import react-native agar hermetic di vitest/node.
  const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative"
  let auth: import("firebase/auth").Auth
  if (isReactNative && cachedAuth !== null) {
    auth = cachedAuth
  } else if (isReactNative && typeof authModule.initializeAuth === "function") {
    // Entry RN (@firebase/auth dist/rn) mengekspos getReactNativePersistence,
    // tapi tipe default paket firebase/auth tidak mendeklarasikannya.
    const rnAuth = authModule as unknown as {
      initializeAuth: typeof authModule.initializeAuth
      getReactNativePersistence?: (storage: unknown) => import("firebase/auth").Persistence
    }
    if (typeof rnAuth.getReactNativePersistence !== "function") {
      auth = authModule.getAuth(app)
    } else {
      try {
        const storageModule = await import("@react-native-async-storage/async-storage")
        const storage = storageModule.default ?? storageModule
        auth = rnAuth.initializeAuth(app, {
          persistence: rnAuth.getReactNativePersistence(storage),
        }) as import("firebase/auth").Auth
        cachedAuth = auth
      } catch {
        // Sudah diinisialisasi (hot reload) atau gagal: fallback ke getAuth.
        auth = cachedAuth ?? authModule.getAuth(app)
        cachedAuth = auth
      }
    }
  } else {
    auth = authModule.getAuth(app)
  }
  return {
    auth,
    signIn: authModule.signInWithEmailAndPassword,
    signUp: authModule.createUserWithEmailAndPassword,
    setName: authModule.updateProfile,
    signOutFn: authModule.signOut,
  }
}

function toUser(uid: string, email: string, displayName: string | null): User {
  return { id: uid, email, name: displayName ?? email.split("@")[0] }
}

export async function firebaseRegister(email: string, password: string, name: string): Promise<FirebaseSession> {
  const { auth, signUp, setName } = await getAuthInstance()
  const credential = await signUp(auth, email, password)
  if (name) {
    await setName(credential.user, { displayName: name })
  }
  const idToken = await credential.user.getIdToken()
  const address = credential.user.email ?? email
  return { idToken, user: toUser(credential.user.uid, address, credential.user.displayName ?? name) }
}

export async function firebaseLogin(email: string, password: string): Promise<FirebaseSession> {
  const { auth, signIn } = await getAuthInstance()
  const credential = await signIn(auth, email, password)
  const idToken = await credential.user.getIdToken()
  const address = credential.user.email ?? email
  return { idToken, user: toUser(credential.user.uid, address, credential.user.displayName) }
}

export async function firebaseLogout(): Promise<void> {
  try {
    const { auth, signOutFn } = await getAuthInstance()
    await signOutFn(auth)
  } catch {
    // Best-effort: token klien selalu dihapus pemanggil.
  }
}

export async function getFirebaseIdToken(): Promise<string | null> {
  try {
    const { auth } = await getAuthInstance()
    return (await auth.currentUser?.getIdToken()) ?? null
  } catch {
    return null
  }
}

export async function firebaseCurrentUser(): Promise<User | null> {
  try {
    const { auth } = await getAuthInstance()
    const user = auth.currentUser
    if (!user || !user.email) {
      return null
    }
    return toUser(user.uid, user.email, user.displayName)
  } catch {
    return null
  }
}

// Tunggu pemulihan persistence (cold start): currentUser null sesaat walau
// sesi tersimpan di AsyncStorage. Dipakai boot + biometric agar tidak
// dianggap logout tiap buka ulang aplikasi.
export async function firebaseWaitForCurrentUser(timeoutMs = 8000): Promise<User | null> {
  try {
    const { auth } = await getAuthInstance()
    const current = auth.currentUser
    if (current?.email) {
      return toUser(current.uid, current.email, current.displayName)
    }
    const authModule = await import("firebase/auth")
    // SDK baru: authStateReady menunggu restore persistence selesai.
    const ready = (auth as unknown as { authStateReady?: () => Promise<void> }).authStateReady
    if (typeof ready === "function") {
      try {
        await ready.call(auth)
      } catch {
        // Abaikan; lanjut ke listener di bawah.
      }
      const after = auth.currentUser
      if (after?.email) {
        return toUser(after.uid, after.email, after.displayName)
      }
    }
    if (typeof authModule.onAuthStateChanged !== "function") {
      return null
    }
    const user = await new Promise<import("firebase/auth").User | null>((resolve) => {
      let settled = false
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          unsub()
          resolve(null)
        }
      }, timeoutMs)
      const unsub = authModule.onAuthStateChanged(auth, (next) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve(next)
        }
      })
    })
    if (!user?.email) {
      return null
    }
    return toUser(user.uid, user.email, user.displayName)
  } catch {
    return null
  }
}

export async function firebaseUpdateName(name: string): Promise<User> {
  const instance = await getAuthInstance()
  const user = instance.auth.currentUser
  if (!user) {
    throw new Error("Sesi berakhir. Silakan masuk kembali.")
  }
  await instance.setName(user, { displayName: name })
  const email = user.email ?? ""
  return toUser(user.uid, email, user.displayName ?? name)
}

function firebaseErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : ""
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Kata sandi saat ini salah."
    case "auth/weak-password":
      return "Kata sandi baru minimal 8 karakter."
    case "auth/requires-recent-login":
      return "Sesi kedaluwarsa. Masuk kembali lalu coba lagi."
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti."
    case "auth/network-request-failed":
      return "Terjadi kesalahan koneksi."
    default:
      return error instanceof Error && error.message ? error.message : "Terjadi kesalahan koneksi."
  }
}

export async function firebaseChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { auth } = await getAuthInstance()
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error("Sesi berakhir. Silakan masuk kembali.")
  }
  const authModule = await import("firebase/auth")
  try {
    const credential = authModule.EmailAuthProvider.credential(user.email, currentPassword)
    await authModule.reauthenticateWithCredential(user, credential)
    await authModule.updatePassword(user, newPassword)
  } catch (error) {
    throw new Error(firebaseErrorMessage(error))
  }
}
