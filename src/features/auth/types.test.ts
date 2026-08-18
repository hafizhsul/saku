import { describe, expect, it } from "vitest"

import { RegisterRequestSchema, parseAuthResponse, parseMeResponse } from "./types"

const validUser = { id: "user-1", email: "user@example.com", name: "Test User" }

describe("parseAuthResponse", () => {
  it("returns an AuthResponse for a valid payload", () => {
    const parsed = parseAuthResponse({ token: "token-123", user: validUser })

    expect(parsed).toEqual({ token: "token-123", user: validUser })
  })

  it("returns null when the token is missing", () => {
    expect(parseAuthResponse({ user: validUser })).toBeNull()
  })

  it("returns null on a malformed user", () => {
    expect(parseAuthResponse({ token: "token-123", user: { id: "user-1" } })).toBeNull()
  })
})

describe("parseMeResponse", () => {
  it("returns the wrapped user for a valid payload", () => {
    const parsed = parseMeResponse({ user: validUser })

    expect(parsed).toEqual({ user: validUser })
  })

  it("returns null when the user is missing", () => {
    expect(parseMeResponse({})).toBeNull()
  })
})

describe("RegisterRequestSchema", () => {
  it("accepts valid registration input", () => {
    const input = { email: "user@example.com", name: "Test User", password: "password123" }

    expect(RegisterRequestSchema.safeParse(input).success).toBe(true)
  })

  it("rejects a password shorter than 8 characters", () => {
    const input = { email: "user@example.com", name: "Test User", password: "pendek" }

    expect(RegisterRequestSchema.safeParse(input).success).toBe(false)
  })
})