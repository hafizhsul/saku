import { describe, expect, it } from "vitest"

import { FIREBASE_UNAVAILABLE, firebaseLogin, firebaseRegister, isFirebaseConfigured } from "./firebaseClient"

describe("firebaseClient tanpa konfigurasi", () => {
  it("isFirebaseConfigured() false tanpa env", () => {
    expect(isFirebaseConfigured()).toBe(false)
  })

  it("firebaseRegister/login menolak dengan FIREBASE_UNAVAILABLE", async () => {
    await expect(firebaseRegister("a@b.c", "password123", "Nama")).rejects.toThrow(FIREBASE_UNAVAILABLE)
    await expect(firebaseLogin("a@b.c", "password123")).rejects.toThrow(FIREBASE_UNAVAILABLE)
  })
})
