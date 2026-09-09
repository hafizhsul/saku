import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { API_BASE_URL } from "./api"
import { changePassword, fetchMe, login, logout, register, updateProfile } from "./authClient"

vi.hoisted(() => {
  process.env.EXPO_PUBLIC_API_URL = "http://test.local"
})

// api.ts mengimpor expo-constants; di lingkungan test Node modul native itu
// tidak bisa dimuat, jadi mock default-nya. vitest otomatis meng-hoist
// pemanggilan ini ke atas file.
vi.mock("expo-constants", () => ({ default: { expoConfig: null } }))

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

const mockFetch = vi.fn()

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch)
  // Test jalur REST mengasumsikan Firebase tak terkonfigurasi; bersihkan
  // env ambien agar hermetic.
  vi.stubEnv("EXPO_PUBLIC_FIREBASE_API_KEY", "")
  vi.stubEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "")
  vi.stubEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "")
  vi.stubEnv("EXPO_PUBLIC_FIREBASE_APP_ID", "")
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  mockFetch.mockReset()
})

describe("register", () => {
  it("returns the parsed AuthResponse on success", async () => {
    const user = { id: "user-1", email: "user@example.com", name: "User" }
    mockFetch.mockResolvedValueOnce(jsonResponse({ token: "token-123", user }))

    const result = await register({ email: "user@example.com", name: "User", password: "password123" })

    expect(result).toEqual({ token: "token-123", user })
    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/register`, expect.objectContaining({ method: "POST" }))
  })

  it("throws the server error message on 401", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Email atau kata sandi salah." }, false))

    await expect(login({ email: "user@example.com", password: "password123" })).rejects.toThrow(
      "Email atau kata sandi salah.",
    )
  })

  it("throws the connection error when the request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"))

    await expect(register({ email: "user@example.com", name: "User", password: "password123" })).rejects.toThrow(
      "Terjadi kesalahan koneksi.",
    )
  })
})

describe("fetchMe", () => {
  it("returns the user on success", async () => {
    const user = { id: "user-1", email: "user@example.com", name: "User" }
    mockFetch.mockResolvedValueOnce(jsonResponse({ user }))

    await expect(fetchMe("token-123")).resolves.toEqual(user)
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/me`,
      expect.objectContaining({ headers: { Authorization: "Bearer token-123" }, credentials: "include" }),
    )
  })

  it("with null token (web) sends no Authorization header and uses cookies", async () => {
    const user = { id: "user-1", email: "user@example.com", name: "User" }
    mockFetch.mockResolvedValueOnce(jsonResponse({ user }))

    await expect(fetchMe(null)).resolves.toEqual(user)
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/me`,
      expect.objectContaining({ headers: {}, credentials: "include" }),
    )
  })

  it("throws the server error message on 401", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Sesi berakhir. Silakan masuk kembali." }, false))

    await expect(fetchMe("token-123")).rejects.toThrow("Sesi berakhir. Silakan masuk kembali.")
  })
})

describe("logout", () => {
  it("resolves after a successful request", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: async () => ({}) })

    await expect(logout("token-123")).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/logout`,
      expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer token-123" } }),
    )
  })
  it("still resolves when the network request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network down"))

    await expect(logout("token-123")).resolves.toBeUndefined()
  })
})

describe("updateProfile", () => {
  it("sends PATCH /me with the new name and returns the updated user", async () => {
    const updated = { id: "user-1", email: "user@example.com", name: "Nama Baru" }
    mockFetch.mockResolvedValueOnce(jsonResponse({ user: updated }))

    await expect(updateProfile("token-123", { name: "Nama Baru" })).resolves.toEqual(updated)
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/me`,
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
        body: JSON.stringify({ name: "Nama Baru" }),
      }),
    )
  })

  it("throws the server error message on 400", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Nama wajib diisi dan maksimal 60 karakter." }, false))

    await expect(updateProfile("token-123", { name: "" })).rejects.toThrow(
      "Nama wajib diisi dan maksimal 60 karakter.",
    )
  })
})

describe("changePassword", () => {
  it("sends PATCH /me/password and resolves on success", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

    await expect(changePassword("token-123", { currentPassword: "lama-12345", newPassword: "baru-12345" })).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      `${API_BASE_URL}/me/password`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ currentPassword: "lama-12345", newPassword: "baru-12345" }),
      }),
    )
  })

  it("throws the server error message on failure", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "Kata sandi saat ini salah." }, false))

    await expect(changePassword("token-123", { currentPassword: "salah", newPassword: "baru-12345" })).rejects.toThrow(
      "Kata sandi saat ini salah.",
    )
  })
})

describe("jalur Firebase", () => {
  beforeEach(() => {
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_API_KEY", "key")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", "x.firebaseapp.com")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID", "x")
    vi.stubEnv("EXPO_PUBLIC_FIREBASE_APP_ID", "1:2:web:3")
  })

  it("login tidak memanggil server sama sekali", async () => {
    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({} as never)
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: {
        uid: "uid-1",
        email: "user@example.com",
        displayName: "User",
        getIdToken: async () => "id-token-123",
      },
    } as never)
    const result = await login({ email: "user@example.com", password: "password123" })
    expect(result).toEqual({ token: "id-token-123", user: { id: "uid-1", email: "user@example.com", name: "User" } })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("register tidak memanggil server sama sekali", async () => {
    const { getAuth, createUserWithEmailAndPassword } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({} as never)
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: {
        uid: "uid-2",
        email: "baru@example.com",
        displayName: "Baru",
        getIdToken: async () => "id-token-456",
      },
    } as never)
    const result = await register({ email: "baru@example.com", name: "Baru", password: "password123" })
    expect(result).toEqual({ token: "id-token-456", user: { id: "uid-2", email: "baru@example.com", name: "Baru" } })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("updateProfile jalur Firebase tidak memanggil server", async () => {
    const { getAuth, updateProfile: updateProfileFn } = await import("firebase/auth")
    const user = { uid: "uid-1", email: "user@example.com", displayName: "Lama" }
    vi.mocked(getAuth).mockReturnValue({ currentUser: user } as never)
    vi.mocked(updateProfileFn).mockImplementation(async (u: { displayName: string | null }, { displayName }: { displayName?: string | null }) => {
      u.displayName = displayName ?? null
    })
    await expect(updateProfile("id-token-123", { name: "Baru" })).resolves.toEqual({
      id: "uid-1",
      email: "user@example.com",
      name: "Baru",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("changePassword jalur Firebase tidak memanggil server", async () => {
    const { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({ currentUser: { uid: "uid-1", email: "user@example.com" } } as never)
    vi.mocked(reauthenticateWithCredential).mockResolvedValue(undefined as never)
    vi.mocked(updatePassword).mockResolvedValue(undefined as never)
    await expect(
      changePassword("id-token-123", { currentPassword: "lama-12345", newPassword: "baru-12345" }),
    ).resolves.toBeUndefined()
    expect(EmailAuthProvider.credential).toHaveBeenCalledWith("user@example.com", "lama-12345")
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("logout jalur Firebase tidak memanggil server", async () => {
    const { getAuth, signOut } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({} as never)
    vi.mocked(signOut).mockResolvedValue(undefined as never)
    await expect(logout("id-token-123")).resolves.toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})