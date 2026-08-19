import * as LocalAuthentication from "expo-local-authentication"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react"
import { AppState, Platform } from "react-native"

import { clearToken, getToken, setToken } from "../../storage/auth"
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from "./authClient"
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "./types"

// Rangkaian state sesi: "locked" berarti token tersimpan tapi belum terverifikasi
// (server tak terjangkau saat peluncuran — token JANGAN dihapus).
type AuthState = "unauthenticated" | "locked" | "authenticated"

export type LoginResult = { readonly ok: true } | { readonly ok: false; readonly message: string }
export type RegisterResult = LoginResult
export type BiometricResult = LoginResult

// Pesan yang sama dengan authClient (CONNECTION_ERROR). Dipakai membedakan
// kegagalan jaringan (simpan token → "locked") dari token tak valid/kedaluwarsa
// (hapus token → "unauthenticated"). Server kita tidak mengirim teks ini.
const CONNECTION_ERROR = "Terjadi kesalahan koneksi."

type AuthContextValue = {
  readonly user: User | null
  readonly state: AuthState
  readonly isLoading: boolean
  readonly authError: string | null
  readonly hasBiometric: boolean
  readonly login: (input: LoginRequest) => Promise<LoginResult>
  readonly register: (input: RegisterRequest) => Promise<RegisterResult>
  readonly logout: () => Promise<void>
  readonly biometricUnlock: () => Promise<BiometricResult>
  readonly retryLoad: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

type TokenVerification =
  | { readonly status: "authenticated"; readonly user: User }
  | { readonly status: "unreachable"; readonly message: string }
  | { readonly status: "expired"; readonly message: string }

async function verifyToken(token: string | null): Promise<TokenVerification> {
  try {
    const me = await fetchMe(token)
    return { status: "authenticated", user: me }
  } catch (error) {
    const message = error instanceof Error ? error.message : CONNECTION_ERROR
    if (message === CONNECTION_ERROR) {
      return { status: "unreachable", message }
    }

    return { status: "expired", message }
  }
}

export function AuthProvider({ children }: PropsWithChildren): React.ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [state, setState] = useState<AuthState>("unauthenticated")
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [hasBiometric, setHasBiometric] = useState(false)
  // Nilai terkini state/biometrik untuk handler AppState (tanpa re-subscribe
  // dan tanpa stale closure pada timeout debounce 2 detik).
  const latestAuthRef = useRef<{ readonly state: AuthState; readonly hasBiometric: boolean }>({ state, hasBiometric })

  useEffect(() => {
    latestAuthRef.current = { state, hasBiometric }
  })

  const boot = useCallback(async (): Promise<void> => {
    // E2E web (Playwright): flag localStorage menghindari verifikasi ke server
    // auth — suite e2e fokus ke fitur data, bukan alur login (unit test urus itu).
    // ponytail: flag khusus pengujian; hapus kalau e2e dipindah ke auth sungguhan.
    if (Platform.OS === "web" && localStorage.getItem("bendahara.e2e.authenticated") === "1") {
      setUser({ id: "e2e", email: "e2e@localhost", name: "E2E" })
      setState("authenticated")
      setAuthError(null)
      return
    }

    const token = await getToken()
    // Web: token tersimpan di cookie httpOnly (getToken mengembalikan null) —
    // verifikasi tetap dijalankan via cookie. Native: null berarti belum login.
    if (token === null && Platform.OS !== "web") {
      setUser(null)
      setState("unauthenticated")
      setAuthError(null)
      return
    }

    const outcome = await verifyToken(token)
    if (outcome.status === "authenticated") {
      setUser(outcome.user)
      setState("authenticated")
      setAuthError(null)
      return
    }

    if (outcome.status === "unreachable") {
      // Server tak terjangkau: token dipertahankan untuk unlock biometrik / coba lagi.
      setUser(null)
      setState("locked")
      setAuthError(outcome.message)
      return
    }

    // Token tak valid / kedaluwarsa: bersihkan agar sesi rusak tidak mengunci aplikasi.
    await clearToken()
    setUser(null)
    setState("unauthenticated")
    setAuthError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      let supported = false
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync()
        supported = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false
      } catch {
        supported = false
      }

      if (!cancelled) {
        setHasBiometric(supported)
      }
    })()

    // boot tidak mematikan isLoading sendiri (retryLoad yang membungkusnya);
    // matikan di sini setelah boot awal selesai, apa pun hasilnya.
    void (async () => {
      await boot()
      if (!cancelled) {
        setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [boot])

  const retryLoad = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    await boot()
    setIsLoading(false)
  }, [boot])

  const authenticate = useCallback(async (attempt: () => Promise<AuthResponse>): Promise<LoginResult> => {
    setAuthError(null)

    try {
      const response = await attempt()
      await setToken(response.token)
      setUser(response.user)
      setState("authenticated")
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : CONNECTION_ERROR
      setAuthError(message)
      return { ok: false, message }
    }
  }, [])

  const login = useCallback(
    (input: LoginRequest): Promise<LoginResult> => authenticate(() => apiLogin(input)),
    [authenticate],
  )

  const register = useCallback(
    (input: RegisterRequest): Promise<RegisterResult> => authenticate(() => apiRegister(input)),
    [authenticate],
  )

  const logout = useCallback(async (): Promise<void> => {
    // apiLogout menelan kegagalan jaringan: penghapusan token lokal adalah sumber kebenaran.
    // Web: token null → cookie dikirim otomatis; native: Bearer dari storage.
    const token = await getToken()
    await apiLogout(token)
    await clearToken()
    setUser(null)
    setState("unauthenticated")
    setAuthError(null)
  }, [])

  const biometricUnlock = useCallback(async (): Promise<BiometricResult> => {
    if (!hasBiometric) {
      return { ok: false, message: "Biometrik tidak tersedia di perangkat ini." }
    }

    let authResult
    try {
      authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Buka Saku",
        cancelLabel: "Batal",
        disableDeviceFallback: false,
      })
    } catch {
      return { ok: false, message: "Autentikasi biometrik gagal. Coba lagi atau gunakan kata sandi." }
    }
    if (!authResult.success) {
      return { ok: false, message: "Autentikasi dibatalkan." }
    }

    // Sidik jadi / wajah cocok: verifikasi token tersimpan ke server.
    const token = await getToken()
    if (token === null) {
      setUser(null)
      setState("unauthenticated")
      return { ok: false, message: "Sesi tidak ditemukan. Silakan masuk kembali." }
    }

    const outcome = await verifyToken(token)
    if (outcome.status === "authenticated") {
      setUser(outcome.user)
      setState("authenticated")
      setAuthError(null)
      return { ok: true }
    }

    if (outcome.status === "unreachable") {
      // Jaringan masih bermasalah: tetap "locked", token jangan dihapus.
      setAuthError(outcome.message)
      return { ok: false, message: outcome.message }
    }

    await clearToken()
    setUser(null)
    setState("unauthenticated")
    return { ok: false, message: outcome.message }
  }, [hasBiometric])

  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | null = null
    let previousAppState = AppState.currentState

    const schedulePrompt = (): void => {
      if (debounceId !== null) {
        clearTimeout(debounceId)
      }

      debounceId = setTimeout(() => {
        debounceId = null
        const latest = latestAuthRef.current
        if (latest.state !== "locked" || !latest.hasBiometric) {
          return
        }

        void biometricUnlock()
      }, 2000)
    }

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (previousAppState === nextAppState) {
        return
      }

      const transitionedToActive = previousAppState !== "active" && nextAppState === "active"
      previousAppState = nextAppState

      if (!transitionedToActive) {
        if (debounceId !== null) {
          clearTimeout(debounceId)
          debounceId = null
        }
        return
      }

      schedulePrompt()
    })

    return () => {
      if (debounceId !== null) {
        clearTimeout(debounceId)
      }
      subscription.remove()
    }
  }, [biometricUnlock])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      state,
      isLoading,
      authError,
      hasBiometric,
      login,
      register,
      logout,
      biometricUnlock,
      retryLoad,
    }),
    [authError, biometricUnlock, hasBiometric, isLoading, login, logout, register, retryLoad, state, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}