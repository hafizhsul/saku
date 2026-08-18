# Learnings — auth-system

Conventions, patterns, and successful approaches discovered during work on this plan.

_Auto-scaffolded by /start-work. Append new entries below - never overwrite._

---

## Zod 4 traps (hit in Todo 2, both caught by `pnpm typecheck`)
1. `.readonly()` returns `ZodReadonly`, which has NO `.extend()`. To derive a schema from a readonly schema, keep an unexported plain `z.object()` base, `.extend()` on it, then `.readonly()` each exported variant (see `src/features/auth/types.ts` `CredentialsBaseSchema`).
2. `typeof process !== "undefined" && process.env?.X` types as `string | false`. `false ?? fallback` stays `false` (?? only falls through on null/undefined) → assign to `string` fails. Edge-correct form: `(typeof process !== "undefined" ? process.env?.X : undefined) ?? fallback`.
3. Repo convention confirmed: response schemas end with `.readonly()`, parse helpers `safeParse` → null/[] on failure, exports via `z.infer`.

## Auth client shape (Todo 4, `src/features/auth/authClient.ts`)
1. Shared `postAuth(path, input)` helper for register/login — one fetch wrapper, no duplication; typed public wrappers keep call sites safe.
2. `errorFrom(response)`: `AuthErrorSchema.safeParse` on body → exact server message (409/401 pass through verbatim); non-JSON or schema mismatch → generic `CONNECTION_ERROR` ("Terjadi kesalahan koneksi.").
3. Success responses validated via `parseAuthResponse` → null means connection error; `fetchMe` returns `parsed.user`.
4. `logout` swallows network errors with empty catch — client-side token deletion is the source of truth.

---

## AuthProvider + forms (Todo 5)
1. **Network vs expired classification**: authClient throws only `Error` (no status attached). Distinguish on boot/biometric-verify by message: `error.message === "Terjadi kesalahan koneksi."` → unreachable (keep token, state "locked"); anything else → expired/invalid (clearToken, "unauthenticated"). Server never sends that exact string. Duplicated the const locally in AuthProvider (`CONNECTION_ERROR`) — did NOT modify authClient.
2. **`verifyToken(token)` module-level helper** returns discriminated `{authenticated|unreachable|expired}` — shared by `boot` (mount + retryLoad) and `biometricUnlock`, so both paths treat network failure identically (spec said biometric failure → always clearToken; I keep token on network failure there too — clearing on flaky network permanently logs user out).
3. **`retryLoad`** flips `isLoading` true→false around `boot()`; boot's internal setStates are all post-await so `react-hooks/set-state-in-effect` lint stays quiet (no disable comment needed, unlike SettingsProvider).
4. **Shared `authenticate(attempt)` callback** for login/register (mirrors authClient's `postAuth`): setAuthError(null) → attempt → setToken+user+state on success; on failure setAuthError(message) + return `{ok:false,message}`. Login/register are one-line wrappers.
5. **Forms do NOT use context `isLoading` for button** — PrimaryButton's `loading` prop hardcodes "Menyimpan..." which is wrong copy for auth. Use local `isSubmitting` + label swap ("Mengecek..."/"Mendaftar...") + `disabled`. No spinner exists in PrimaryButton anyway.
6. **LoginForm also validates client-side** (email has @, password ≥ 8) — mirrors `LoginRequestSchema` min-8 so guaranteed-fail requests never hit the wire. RegisterForm validates name/email/password inline per spec.
7. **Result types**: `LoginResult`/`RegisterResult`/`BiometricResult` all exported from AuthProvider as `{ok:true} | {ok:false,message}` (matches TransactionsProvider union style); forms ignore result.message on failure because AuthProvider already mirrors it into `authError` which they render.
8. **expo-local-authentication SDK 57 API confirmed** via Context7: `hasHardwareAsync(): Promise<boolean>`, `isEnrolledAsync(): Promise<boolean>` (biometrics only, not device PIN), `authenticateAsync({promptMessage, cancelLabel, disableDeviceFallback}) → {success, error?}`.
9. **Form styles duplicated** between Login/RegisterForm (input/generalError/header etc.) instead of a shared `authStyles.ts` — 2 copies, both ~same; extract to shared file only if a 3rd auth screen (locked) appears in T6.

---

## Tests (Todo 8)

1. **Server refactor needed before testability** (`server/auth-server.js`): `server.listen` ran at require. Minimal fix: `process.env.USERS_FILE ?? path.join(__dirname, "users.json")` + `if (require.main === module)` guard + `module.exports`. Direct-run behavior identical (verified: `node auth-server.js` still boots).
2. **Server test harness (node:test)**: set `USERS_FILE` + `AUTH_SECRET` env BEFORE `require("./auth-server.js")` so the module loads isolated state; `server.listen(0)` → random port; `beforeEach` resets `users.length = 0` + `saveUsers`. One temp dir per suite; `after` hook rmSyncs it. `signToken` must be exported — that's how the expired-token test (past `exp`) is crafted; no JWT lib needed.
3. **`before`/`after` are real node:test exports** — forgot to destructure `before` once and the whole file crashed at module load (`ReferenceError: before is not defined`). Import them like `test`.
4. **Vitest + authClient**: set `process.env.EXPO_PUBLIC_API_URL` inside `vi.hoisted(...)` BEFORE imports — makes `API_BASE_URL` deterministic (default "http://localhost:4000" otherwise). `vi.stubGlobal("fetch", ...)` + `vi.unstubAllGlobals()` in afterEach.
5. **Vitest + storage auth**: `vi.hoisted` a Map-backed mock for expo-secure-store (getItemAsync/setItemAsync/deleteItemAsync share one `values` Map); `vi.mock("react-native", () => ({ Platform: { OS: "ios" } }))` then flip `(Platform as { OS: string }).OS = "web"` per-test. Web localStorage via `vi.stubGlobal` (test env is `node`, no built-in).
6. **Counts**: 12 server cases (node:test), 18 client cases across 3 files (storage 4, types 7, authClient 7). Suite total 90.

---

## Settings tab account section (Todo 7, `app/(tabs)/settings.tsx`)
1. Settings screen reads `user` + `logout` from `useAuth()`; account section added ONLY in loaded state — the screen's existing `isLoading`/`loadError` early returns keep their own header, untouched.
2. Section layout: top-level "AKUN" overline + "Profil" title header (reuses existing `header`/`overline`/`title` styles), then user card `{surfaceElevated, radius lg, padding group, gap unit, shadows.card}` — matches TransactionRow/design system card look.
3. `user?.name ?? "—"` optional chaining guards null user inside the authenticated tab (spec edge case).
4. Logout button: `<PrimaryButton variant="danger" label="Keluar" onPress={() => void logout()} />` — no navigation, AuthGate re-renders login on `state` change. `void` prefix matches repo pattern for fire-and-forget promises.
5. User name uses explicit bold override (`fontFamilies.bold` + fontWeight "700" on bodyLarge size) since `typography.bodyLarge` is weight 400 and the design calls for bold name.

## Biometric never-rejects guard (post-T8 code review)
1. `expo-local-authentication.authenticateAsync` CAN reject on SDK error paths (not just `{success:false}`) → caller `void biometricUnlock()` (AuthGate.tsx:55) would surface an unhandled rejection. Fixed: try/catch around the call only, catch returns `{ok:false, message:"Autentikasi biometrik gagal. Coba lagi atau gunakan kata sandi."}` — no re-throw, no token change, state stays "locked". Cancel path (`success:false` → "Autentikasi dibatalkan.") untouched.
10. **AppState auto-biometric (audit fix)**: listener subscribed once (`useEffect` dep `[biometricUnlock]`); on change-event transition FROM non-"active" TO "active" (tracked via `previousAppState` local), schedule `void biometricUnlock()` after 2000ms debounce. Guards: skip if `latestAuthRef.current` state≠"locked" or !hasBiometric (checked inside the timeout, so state changes mid-debounce cancel nothing but the check bails); any non-active transition clears the pending timer (no prompt over backgrounded app). No fire on mount (handler only runs on change events). Cleanup removes listener + clears timer. Trap: effect must be declared AFTER `biometricUnlock` const (TS2448 block-scoped hoisting); ref-mirror `latestAuthRef` synced by dep-less effect avoids stale closure + re-subscribe churn.
