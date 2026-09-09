import type { User } from "./types"

// Firebase Auth client — OPSIONAL.
//
// Aktif hanya bila 4 env diset: EXPO_PUBLIC_FIREBASE_API_KEY,
// EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID,
// EXPO_PUBLIC_FIREBASE_APP_ID. Tanpa itu isFirebaseConfigured() false dan
// authClient memakai alur REST lama. SDK dimuat dinamis (import()) agar
// startup tidak terbebani bila Firebase tak dipakai.

export const FIREBASE_UNAVAILABLE = "FIREBASE_UNAVAILABLE"

export interface FirebaseSession {
  readonly idToken: string
  readonly user: User
}

function readEnv(name: string): string | null {
  const value = typeof process !== "undefined" ? process.env?.[name] : undefined
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
  const auth = authModule.getAuth(app)
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
