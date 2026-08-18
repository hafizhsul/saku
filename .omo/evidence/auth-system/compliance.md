# F1 — Plan Compliance Audit: auth-system

Audit date: 2026-08-18 · Auditor: plan-compliance agent (re-run after AppState fix)
Plan: `.omo/plans/auth-system.md` · Status: **APPROVE**

## Summary

| Todo | Result | Notes |
| --- | --- | --- |
| T1 server | PASS | 12/12 server tests green |
| T2 types + api | PASS | typecheck clean |
| T3 storage | PASS | native + web paths |
| T4 authClient | PASS | happy + 4 error paths |
| T5 provider + forms | PASS | AppState biometric listener present (2s debounce + transition guard + ref re-check) |
| T6 gate _layout | PASS | inline gate, no data providers pre-auth |
| T7 settings | PASS | Akun section + Keluar, theme intact |
| T8 tests | PASS | 12 server + 18 client tests pass |

## T1 — PASS

- `server/auth-server.js` (253 lines), pure `node:http`/`node:crypto` — no express/koa/mongoose.
- POST /register → 201 `{ token, user }` (L151–184); validasi email regex, password min 8, nama non-empty (L158–166); duplicate → 409 (L167–169).
- POST /login → 200 `{ token, user }`, `timingSafeEqual` + dummy-hash anti-timing (L186–213, L194–200).
- GET /me Bearer → 200 `{ user }` (L215–225); POST /logout → 204 stateless (L227–231).
- scryptSync N=16384 r=8 p=1 maxmem 64MB (L44). HMAC-SHA256 base64url JWT-style, TTL 30 hari (L48–53, L12). verifyToken expiry + alg/typ checks + timingSafeEqual sig (L55–83).
- CORS `*` + OPTIONS 204 (L94–98, L144–148). `AUTH_SECRET` fallback `dev-secret-ganti-di-produksi` (L9).
- All errors `{ error: "..." }` Bahasa Indonesia; statuses 400 (L159/162/165/239), 401 (L203/218/222), 409 (L168), 413 (L236), 500 (L241), 404 (L233).
- `server/package.json` `"start": "node auth-server.js"` (L7); `server/users.json` = `[]`, gitignored (`.gitignore` L56).
- `node --test`: **12 pass, 0 fail** (register 201/409/400×2, login 200/401, me valid/no-token/expired/tampered, logout 204, OPTIONS preflight).
- Note: plan acceptance criteria line 118 says "duplicate email 401" but plan's own status spec (L24/L111) mandates 409 for duplicates; impl returns 409, matching the primary spec (plan typo, non-blocking).

## T2 — PASS

- `src/features/auth/types.ts`: UserSchema (L3), LoginRequestSchema (L20), RegisterRequestSchema (L24), AuthResponseSchema (L30), AuthErrorSchema (L39), parse helpers `parseAuthResponse` (L47), `parseMeResponse` (L65).
- `src/features/auth/api.ts`: `API_BASE_URL = EXPO_PUBLIC_API_URL ?? "http://localhost:4000"` (L1–2).
- No new deps (zod already in package.json `^4.4.3`). `pnpm typecheck` clean.

## T3 — PASS

- `src/storage/auth.ts`: `getToken`/`setToken`/`clearToken` (L6/18/31). Platform split `Platform.OS === "web"` → localStorage, else expo-secure-store (L8–12, L20–25, L33–38). Key `bendahara.auth.token.v1` (L4).
- Error handling: getToken failure → null (L13–15); set/clear silent (L26–28, L39–41).
- Observation (non-blocking): static top-level `import * as SecureStore from "expo-secure-store"` — standard Expo pattern; web branch never invokes it and the package ships a web stub, so `app.json` plugin `expo-secure-store` + localStorage fallback keep the web build viable (success criteria #8).
- Tests: native round-trip + throw→null + web round-trip + key assertion — pass.

## T4 — PASS

- `src/features/auth/authClient.ts`: `register` (L60), `login` (L64), `fetchMe` (L68) with `Authorization: Bearer` injection (L72), `logout` (L90, swallows network failure intentionally).
- Errors: server `{ error }` message passthrough (L22–34), `CONNECTION_ERROR` fallback "Terjadi kesalahan koneksi." (L12). No retry/interceptor.
- Tests: mock fetch happy + 4 error paths (login 401, connection error, fetchMe 401, logout network-fail) — pass.

## T5 — PASS — AppState biometric listener present

- AuthProvider 3-state `unauthenticated | locked | authenticated` (L11, L58), boot = token + /me check (L70–100), unreachable → locked (token kept), invalid → token cleared. Full context API `{ user, state, isLoading, authError, login, register, logout, biometricUnlock, retryLoad, hasBiometric }` (L22–33).
- Biometric: `hasHardwareAsync && isEnrolledAsync` gate (L108–112), `authenticateAsync` (L174–178), cancel → `{ ok: false }` fallback to password (L182–184).
- **AppState listener (plan Must-have #8 / T5 What-to-do / success criterion #4):** `import { AppState } from "react-native"` (L3); `useEffect` with `AppState.addEventListener("change", …)` (L214–259); **2s debounce** via `setTimeout(…, 2000)` with clear-on-leave (L218–232, L243–248); **previousAppState transition guard** — only prompts on `previousAppState !== "active" && nextAppState === "active"` (L216, L235–241); **latestAuthRef re-check** — debounce callback re-reads `latestAuthRef.current` and only prompts when `state === "locked" && hasBiometric`, avoiding stale closures (L64, L66–68, L225–228). Cleanup removes subscription + pending timer (L253–258).
- LoginForm: Field + email + password + PrimaryButton + "Belum punya akun? Daftar" + error text (L63–120). RegisterForm: nama + email + password min 8 + hint + "Sudah punya akun? Masuk" (L66–139). Both use ScreenShell withTabBar, no fancy animation.

## T6 — PASS

- `app/_layout.tsx`: AuthProvider outermost (L59), before all data providers. Pattern `fonts → onboardingDone → authState → Stack` (L79–102). AuthGate rendered inline, not a route (L97–101). No `Stack.Screen` for login/register (Stack children L112–121) — deep link cannot bypass.
- Data providers (Backup/Settings/Transactions/Budgets/Recurring) mounted **only** in the authenticated branch (L104–128) — no pre-auth mount (Must-NOT #9 honored).
- `src/components/auth/AuthGate.tsx`: loading / locked (retry + biometric + "Keluar dari akun ini") / authenticated→null / login↔register toggle (L29–88), ScreenShell `withTabBar={false}` (L31/39/57).

## T7 — PASS

- `app/(tabs)/settings.tsx`: Akun section with user name + email (L48–51), "Keluar" danger button → `logout()` (L52–57). Theme logic intact: SegmentedControl + themeDescriptions + setTheme (L12–16, L60–70).

## T8 — PASS

- `server/auth-server.test.js`: exactly the plan's 12 cases (register happy/duplicate/invalid/short-pw, login happy/wrong-pw, me valid/no-token/expired/tampered, logout 204, CORS preflight). Node built-in test runner (`node:test`), no Jest. **12/12 pass.**
- `src/storage/auth.test.ts`: set-get-clear (native + web), throw→null, key assertion — pass.
- `src/features/auth/types.test.ts`: valid + invalid Zod parse — pass.
- `src/features/auth/authClient.test.ts`: mock fetch, happy + 4 error cases — pass.
- Client suite: **3 files, 18 tests, 0 fail** (vitest run). `pnpm typecheck` clean.

## Scope-creep / Must-NOT check — PASS

- No `app/login.tsx`, no `app/register.tsx` (verified absent).
- No refresh token / auto-refresh (grep 0 hits).
- No rate limiting, no reset/forgot password, no email verification, no social login (grep 0 hits).
- No migration of local transaction data; logout clears token only, local data untouched.
- No server deployment artifacts (Docker, etc.); server is standalone manual.
- New deps limited to `expo-secure-store` + `expo-local-authentication` — both explicitly required by plan scope items #3 and #8. `server/package.json` has zero deps.

## Verdict

Re-run after the previous REJECT: the single scoped gap (AppState biometric auto-prompt on reopen) is now implemented in `src/features/auth/AuthProvider.tsx` — `AppState.addEventListener` (L234) with 2s debounce (L231), `previousAppState` transition guard (L216, L239), and `latestAuthRef` re-check (L225–228). All 8 todos meet their acceptance criteria; all tests pass (12 server + 18 client); `pnpm typecheck` clean; no scope creep or Must-NOT violations. Approved.

VERDICT: APPROVE
