import { API_BASE_URL } from "./api"
import {
  AuthErrorSchema,
  parseAuthResponse,
  parseMeResponse,
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type User,
} from "./types"

const CONNECTION_ERROR = "Terjadi kesalahan koneksi."

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    throw new Error(CONNECTION_ERROR)
  }
}

async function errorFrom(response: Response): Promise<Error> {
  try {
    const body: unknown = await response.json()
    const parsed = AuthErrorSchema.safeParse(body)
    if (parsed.success) {
      return new Error(parsed.data.error)
    }
  } catch {
    // Bukan JSON → pesan koneksi di bawah.
  }

  return new Error(CONNECTION_ERROR)
}

async function postAuth(path: "/register" | "/login", input: RegisterRequest | LoginRequest): Promise<AuthResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      // Web: kirim/terima cookie httpOnly (server men-set cookie di respons).
      // Native: opsi ini diabaikan RN fetch — token tetap lewat header.
      credentials: "include",
    })
  } catch {
    throw new Error(CONNECTION_ERROR)
  }

  if (!response.ok) {
    throw await errorFrom(response)
  }

  const parsed = parseAuthResponse(await readJson(response))
  if (parsed === null) {
    throw new Error(CONNECTION_ERROR)
  }

  return parsed
}

export async function register(input: RegisterRequest): Promise<AuthResponse> {
  return postAuth("/register", input)
}

export async function login(input: LoginRequest): Promise<AuthResponse> {
  return postAuth("/login", input)
}

// token null = web, autentikasi lewat cookie; token string = native (Bearer).
export async function fetchMe(token: string | null): Promise<User> {
  const headers: Record<string, string> = {}
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/me`, { headers, credentials: "include" })
  } catch {
    throw new Error(CONNECTION_ERROR)
  }

  if (!response.ok) {
    throw await errorFrom(response)
  }

  const parsed = parseMeResponse(await readJson(response))
  if (parsed === null) {
    throw new Error(CONNECTION_ERROR)
  }

  return parsed.user
}

export async function logout(token: string | null): Promise<void> {
  const headers: Record<string, string> = {}
  if (token !== null) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    await fetch(`${API_BASE_URL}/logout`, { method: "POST", headers, credentials: "include" })
  } catch {
    // Abaikan kegagalan jaringan: penghapusan token klien adalah yang penting.
  }
}
