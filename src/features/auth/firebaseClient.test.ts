import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  FIREBASE_UNAVAILABLE,
  firebaseChangePassword,
  firebaseCurrentUser,
  firebaseLogin,
  firebaseRegister,
  firebaseUpdateName,
  isFirebaseConfigured,
} from "./firebaseClient"

vi.mock("firebase/app", () => ({
  getApps: vi.fn(() => []),
  initializeApp: vi.fn(() => ({})),
}))

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  updateProfile: vi.fn(),
  signOut: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
}))

// Test mengasumsikan Firebase tak terkonfigurasi; bersihkan env ambien
// (mis. .env lokal) agar hermetic di runner mana pun.
const FIREBASE_ENV_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const

beforeEach(() => {
  vi.clearAllMocks()
  for (const key of FIREBASE_ENV_KEYS) {
    vi.stubEnv(key, "")
  }
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("firebaseClient tanpa konfigurasi", () => {
  it("isFirebaseConfigured() false tanpa env", () => {
    expect(isFirebaseConfigured()).toBe(false)
  })

  it("firebaseRegister/login menolak dengan FIREBASE_UNAVAILABLE", async () => {
    await expect(firebaseRegister("a@b.c", "password123", "Nama")).rejects.toThrow(FIREBASE_UNAVAILABLE)
    await expect(firebaseLogin("a@b.c", "password123")).rejects.toThrow(FIREBASE_UNAVAILABLE)
  })
})

describe("firebaseClient jalur Firebase", () => {
  beforeEach(() => {
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_API_KEY", "key")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "x.firebaseapp.com")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "x")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_APP_ID", "1:2:web:3")
  })

  async function mockAuthInstance(currentUser: unknown): Promise<void> {
    const appModule = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    vi.mocked(appModule.getApps).mockReturnValue([])
    vi.mocked(getAuth).mockReturnValue({ currentUser } as never)
  }

  it("firebaseCurrentUser return null bila tidak ada user login", async () => {
    await mockAuthInstance(null)
    await expect(firebaseCurrentUser()).resolves.toBeNull()
  })

  it("firebaseCurrentUser memetakan currentUser ke User", async () => {
    await mockAuthInstance({ uid: "uid-1", email: "a@b.c", displayName: "Nama" })
    await expect(firebaseCurrentUser()).resolves.toEqual({ id: "uid-1", email: "a@b.c", name: "Nama" })
  })

  it("firebaseUpdateName memakai displayName baru", async () => {
    const { updateProfile } = await import("firebase/auth")
    const user = { uid: "uid-1", email: "a@b.c", displayName: "Lama" }
    await mockAuthInstance(user)
    vi.mocked(updateProfile).mockImplementation(async (u: { displayName: string | null }, { displayName }: { displayName?: string | null }) => {
      u.displayName = displayName ?? null
    })
    await expect(firebaseUpdateName("Baru")).resolves.toEqual({ id: "uid-1", email: "a@b.c", name: "Baru" })
  })

  it("firebaseUpdateName menolak bila tidak ada user login", async () => {
    await mockAuthInstance(null)
    await expect(firebaseUpdateName("X")).rejects.toThrow("Sesi berakhir. Silakan masuk kembali.")
  })

  it("firebaseChangePassword reautentikasi lalu update", async () => {
    const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth")
    await mockAuthInstance({ uid: "uid-1", email: "a@b.c" })
    vi.mocked(reauthenticateWithCredential).mockResolvedValue(undefined as never)
    vi.mocked(updatePassword).mockResolvedValue(undefined as never)
    await expect(firebaseChangePassword("lama-12345", "baru-12345")).resolves.toBeUndefined()
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("a@b.c", "lama-12345")
  })

  it("firebaseChangePassword memetakan kredensial salah", async () => {
    const { reauthenticateWithCredential } = await import("firebase/auth")
    await mockAuthInstance({ uid: "u", email: "a@b.c" })
    vi.mocked(reauthenticateWithCredential).mockRejectedValue({ code: "auth/invalid-credential" })
    await expect(firebaseChangePassword("salah", "baru-12345")).rejects.toThrow("Kata sandi saat ini salah.")
  })
})
