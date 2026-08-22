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

const mockFetch = vi.fn()

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
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