# Auth System — Code-Quality Review Evidence

Date: 2026-08-18 · Verdict: **APPROVE**

Scope: `server/auth-server.js`, `server/auth-server.test.js`, `src/features/auth/{types,api,authClient,AuthProvider}.ts(x)`, `src/storage/auth.ts(.test.ts)`, `src/features/auth/{types,authClient}.test.ts`, `src/components/auth/{AuthGate,LoginForm,RegisterForm}.tsx`, `app/_layout.tsx`, `app/(tabs)/settings.tsx`.

## Verification runs

| Check | Command | Result |
|---|---|---|
| Typecheck | `pnpm typecheck` (`tsc --noEmit`) | PASS, 0 errors |
| Client tests | `pnpm test` (Vitest) | 13 files / 90 tests pass |
| Server tests | `node --test server/auth-server.test.js` | 12/12 pass |

## 1. TS strict violations — **PASS**

- `tsconfig.json`: `"strict": true`. `tsc --noEmit` clean.
- Grep `\bany\b|@ts-ignore|@ts-expect-error|as unknown as|as any` over `src/features/auth/` and `server/`: **0 matches**.
- `unknown` used correctly at trust boundaries (authClient `readJson`/`errorFrom` return `unknown`, narrowed via Zod `safeParse`; AuthProvider catch `error instanceof Error` narrowing).

## 2. Async error handling — **PASS** (1 minor)

- Server: entire request handler wrapped in `try/catch` (auth-server.js:150-242); `readBody` rejects with typed `TOO_LARGE`/`BAD_JSON`, mapped to 413/400.
- authClient: fetch wrapped in try/catch → `CONNECTION_ERROR`; `readJson`/`errorFrom` swallow JSON parse failures; `logout` intentionally swallows network errors (documented comment).
- AuthProvider: `verifyToken` catches all → discriminated union (authenticated/unreachable/expired). `boot` never rejects (getToken/verifyToken/clearToken all internally safe) → `void boot()` is safe. `useEffect` biometric check wrapped in try/catch with `cancelled` flag.
- All `void` sites audited: `handleSubmit` (authenticate catches → LoginResult never rejects), `retryLoad`, `logout`, `void boot()` — all internally safe.
- **Minor**: `AuthGate.tsx:55` `void biometricUnlock()` — `LocalAuthentication.authenticateAsync` (AuthProvider.tsx:164) can *reject* on SDK error paths (not just `success:false`); rejection propagates out of `biometricUnlock` → unhandled promise rejection. All other `void` sites are rejection-proof. Fix: wrap `authenticateAsync` in try/catch.

## 3. console.log — **PASS**

- Repo-wide grep `console\.(log|debug|warn|error)` in `*.{ts,tsx,js}`: exactly 1 match — `server/auth-server.js:249` startup banner (the one allowed line). No client-side logging.

## 4. Accessibility — **PASS**

- PrimaryButton (used for Masuk/Daftar/logout/retry/biometric): `accessibilityRole="button"` + `accessibilityState={{busy, disabled}}` + label (explicit override supported).
- AuthGate switch Pressables (logout, switch forms): `accessibilityLabel` + `accessibilityRole="link"`; error Text `accessibilityRole="alert"`.
- LoginForm/RegisterForm TextInputs: `accessibilityLabel` on all 3+2 fields (TextInput has native input role).
- SegmentedControl (settings): `accessibilityRole="tablist"` container, per-option `accessibilityRole="tab"` + `accessibilityState={{selected}}`.
- EmptyState: `accessibilityLiveRegion` + action renders PrimaryButton (role button).

## 5. Security — **PASS**

- Secrets: only fallback is `TOKEN_SECRET = process.env.AUTH_SECRET ?? "dev-secret-ganti-di-produksi"` (auth-server.js:9) — Indonesian "ganti di produksi" documents it as dev-only; same pattern in test (test-only secret). No hardcoded secrets in client.
- `timingSafeEqual` on both compares, length-guarded first:
  - Token signature: auth-server.js:65-67 (`a.length !== b.length || !timingSafeEqual`).
  - Password: auth-server.js:198-200 (plus dummy-hash branch when user absent → no user-enumeration timing oracle).
- Token expiry: auth-server.js:77 `typeof p.exp !== "number" || p.exp <= Date.now()`. JWT alg/typ pinned to HS256 (line 76), `sub` type-checked. Test asserts expired token → 401 and tampered token → 401.
- Passwords: scryptSync (N=16384, r=8, p=1) with per-user 16-byte random salt; hash/salt never exposed (`publicUser` strips both; test asserts `!("salt" in ...)` / `!("hash" in ...)`).
- **Minor advisory (not in checklist)**: no rate limiting / lockout on `POST /login` — acceptable for local dev server, add before production exposure. CORS `*` OK because auth is Bearer-header based (no cookies).

## 6. Consistency — **PASS**

- `createStyles(colors)` + `useMemo(() => createStyles(colors), [colors])` in AuthGate, LoginForm, RegisterForm, settings.
- Provider context + throwing consumer hook: `AuthContext` + `useAuth()` throws outside provider (AuthProvider.tsx:220-227).
- Discriminated-union results: `LoginResult`/`RegisterResult`/`BiometricResult` (`{ok:true} | {ok:false,message}`), `TokenVerification` (authenticated/unreachable/expired), `AuthState` (unauthenticated/locked/authenticated).
- Server/client message coupling via shared `CONNECTION_ERROR` constant (documented).

## 7. Dead code / unused imports — **PASS**

- **Premise correction**: `noUnusedLocals` is NOT enabled in this repo — `expo/tsconfig.base.json` (extends) sets no such flag; project tsconfig adds only `strict:true` (plus `allowJs:true` via base, so server JS is unchecked). Unused imports would NOT fail typecheck here.
- Manual read of all 12 in-scope files: every import is used. No dead code found (e.g., all `parseAuthResponse`/`parseMeResponse`/schema exports consumed; all theme tokens referenced in styles).
- `AuthGateProps.onAuthenticated` declared but unused (destructured as `{}`) — intentionally reserved interface, zero runtime cost; flagged as design note, not a defect.

## 8. Test quality — **PASS**

- Server (`auth-server.test.js`, 12 tests): asserts real status codes (201/409/400/200/401/204), exact response bodies via `deepEqual`, public-user shape (salt/hash stripped), expired-token 401, tampered-token 401, CORS headers on preflight. Isolated via temp `users.json` + fixed test secret + random port.
- authClient.test.ts: asserts parsed return values, thrown error messages (server + connection error), and `fetch` call args (method, URL, Authorization header).
- storage/auth.test.ts: native + web round-trips, storage-error → null, shared key name.
- types.test.ts: parse results + schema accept/reject (password < 8 rejected).
- Zero `expect(true)` / vacuous assertions in all 5 test files.

## Findings summary

| Severity | Count | Items |
|---|---|---|
| blocking | 0 | — |
| major | 0 | — |
| minor | 2 | 1) `void biometricUnlock()` can reject unhandled if `authenticateAsync` throws (AuthGate.tsx:55 / AuthProvider.tsx:164); 2) advisory: no login rate limiting (server is dev-scoped) |

## Final verdict

**APPROVE** — all 8 check categories PASS; 2 minor findings, none blocking.
