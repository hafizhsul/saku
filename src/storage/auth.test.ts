import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

import { clearToken, getToken, setToken } from "./auth"

const secureStore = vi.hoisted(() => {
  const values = new Map<string, string>()
  return {
    getItemAsync: vi.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      values.set(key, value)
    }),
    deleteItemAsync: vi.fn(async (key: string) => {
      values.delete(key)
    }),
    values,
  }
})

vi.mock("expo-secure-store", () => secureStore)
vi.mock("react-native", () => ({ Platform: { OS: "ios" } }))

beforeEach(() => {
  vi.clearAllMocks()
  secureStore.values.clear()
  ;(Platform as { OS: string }).OS = "ios"
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("secure store path (native)", () => {
  it("set, get, clear round-trip", async () => {
    await setToken("token-123")
    await expect(getToken()).resolves.toBe("token-123")

    await clearToken()
    await expect(getToken()).resolves.toBeNull()
  })

  it("getToken returns null when storage throws", async () => {
    secureStore.getItemAsync.mockRejectedValueOnce(new Error("storage error"))

    await expect(getToken()).resolves.toBeNull()
  })
})

describe("web path", () => {
  beforeEach(() => {
    ;(Platform as { OS: string }).OS = "web"
  })

  it("never stores the token in JS (cookie httpOnly dikelola server)", async () => {
    await setToken("token-web")
    await expect(getToken()).resolves.toBeNull()

    await clearToken()
    await expect(getToken()).resolves.toBeNull()
  })
})