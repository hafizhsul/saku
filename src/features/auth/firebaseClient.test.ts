import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FIREBASE_UNAVAILABLE, firebaseLogin, firebaseRegister, isFirebaseConfigured } from "./firebaseClient"

// Test mengasumsikan Firebase tak terkonfigurasi; bersihkan env ambien
// (mis. .env lokal) agar hermetic di runner mana pun.
const FIREBASE_ENV_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const

beforeEach(() => {
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
