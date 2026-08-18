# auth-system - Work Plan

## TL;DR (For humans)

**What you'll get:** Backend auth mandiri (register/login/me/logout) + layar login/register + gate wajib sebelum semua data + biometrik unlock. Data keuangan tetap lokal (AsyncStorage); auth hanya gate akses.

**Why this approach:** Backend Node murni zero-dep (scrypt + HMAC) menjaga scope kecil. AuthProvider sebagai gate terluar (persis seperti pola onboarding) memastikan tidak ada jalan memutar. Platform split SecureStore/localStorage menjaga web tetap jalan.

**What it will NOT do:** Tidak ada reset password, social login, rate limiting, migrasi data antar akun, atau deployment server.

**Effort:** Large
**Risk:** Medium — hand-rolled crypto + provider nesting + biometric state machine
**Decisions to sanity-check:** Gate inline vs route (dipilih: inline), 1 user per device (logout tidak wipe data), server dev-only (hardcoded secret fallback)

Your next move: jalankan `/start-work auth-system`. Full execution detail follows below.

---

> TL;DR (machine): Large effort, Medium risk. Backend pure-Node auth + auth screens + provider gate + biometric + tests. 8 implementation tasks + 4 final verification.

## Scope
### Must have

1. **Server** (`server/`): `auth-server.js` — HTTP murni: POST /register, POST /login, GET /me, POST /logout. Scrypt (N=16384 r=8 p=1) + HMAC-SHA256 JWT-style tokens (30 hari TTL). Users JSON store (gitignored). CORS `*`. `AUTH_SECRET` env fallback `dev-secret-ganti-di-produksi`. `server/package.json` + `server/users.json` (empty array default).

2. **Shared types + config**: `src/features/auth/types.ts` (Zod schemas untuk request/response), `src/features/auth/api.ts` (base URL resolver EXPO_PUBLIC_API_URL ?? localhost:4000).

3. **Storage**: `src/storage/auth.ts` — platform split: SecureStore di native, localStorage di web. Key: `bendahara.auth.token.v1`. Export: `getToken`, `setToken`, `clearToken`.

4. **Auth client**: `src/features/auth/authClient.ts` — fetch wrapper register/login/me/logout. Automatic token injection (Authorization: Bearer). Error handling dengan error message Bahasa Indonesia.

5. **AuthProvider**: `src/features/auth/AuthProvider.tsx` — Context: `{ user, isLoading, authError, login, register, logout, biometricUnlock, retryLoad, hasBiometric }`. 3-state model: unauthenticated → locked → authenticated. Session check via /me + token expiry local.

6. **Gate di `_layout.tsx`**: AuthProvider terluar (di luar BackupProvider). Pola onboarding: `fonts → onboardingDone → authState → Stack`. Auth screen inline (bukan Stack routes). Deep-link ke /login tidak bisa bypass auth.

7. **Components**: `src/components/auth/LoginForm.tsx` + `src/components/auth/RegisterForm.tsx`. Field + PrimaryButton + ScreenShell.

8. **Biometric**: `expo-local-authentication` — `hasHardwareAsync && isEnrolledAsync` sebelum prompt. AppState listener saat app kembali active + token valid = prompt biometric. Cancel/fail → fallback password.

9. **Tab Profil**: Tambahkan nama user + tombol Logout di `app/(tabs)/settings.tsx`.

10. **Server tests**: `server/auth-server.test.js` — 12 test cases.

11. **Client tests**: `src/storage/auth.test.ts`, `src/features/auth/types.test.ts`, `src/features/auth/authClient.test.ts`.

### Must NOT have (guardrails, anti-slop, scope boundaries)

- Tidak ada refresh token / auto-refresh — token 30 hari cukup.
- Tidak ada reset password / forgot password.
- Tidak ada rate limiting di server (dev scope; disebutkan sebagai risiko).
- Tidak ada email verification.
- Tidak ada social login (Google/Apple).
- Tidak ada perubahan storage data transaksi — data tetap lokal AsyncStorage.
- Tidak ada migrasi data per-user — asumsi 1 user per device. Logout tidak wipe local data.
- Tidak ada deployment server (Docker, dll) — server mandiri, manual.
- Tidak ada Stack routes `app/login.tsx` atau `app/register.tsx` — gate inline only.
- Tidak ada offline-first cashback model — auth = online-first gate.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: **tests-after** + Vitest (client) + Node test runner (server)
- Evidence: `.omo/evidence/auth-system/`

## Execution strategy
### Parallel execution waves

**Wave 1** (backend + foundation):
- T1: server/auth-server.js + package.json + users.json + .gitignore
- T2: src/features/auth/types.ts + src/features/auth/api.ts
- T3: src/storage/auth.ts (platform split SecureStore/localStorage)

**Wave 2** (client integration — after T2, T3):
- T4: src/features/auth/authClient.ts (menggunakan T2, T3)
- T5: src/features/auth/AuthProvider.tsx + src/components/auth/LoginForm.tsx + src/components/auth/RegisterForm.tsx

**Wave 3** (integration + gating — after T5):
- T6: Gate di app/_layout.tsx (AuthProvider terluar, gate inline)
- T7: Update app/(tabs)/settings.tsx (nama user + logout)

**Wave 4** (tests — after T4, T5):
- T8: Server tests + client tests (types, storage, authClient)

**Final verification** (parallel after all todos):
- F1: Plan compliance audit
- F2: Code quality review
- F3: Real manual QA (start server, register, login, biometric, logout)
- F4: Scope fidelity

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| T1 | — | T4 (server must exist for client testing) | T2, T3 |
| T2 | — | T4, T5 | T1, T3 |
| T3 | — | T4 | T1, T2 |
| T4 | T2, T3 | T5 | T1 |
| T5 | T2, T3, T4 | T6 | — |
| T6 | T5 | T7 | T8 (tests) |
| T7 | T5 | — | T8 (tests) |
| T8 | T4, T5 | — | T6, T7 |

## Todos
> Implementation + Test = ONE todo. Never separate.

- [x] 1. Backend Node murni di `server/`
  What to do / Must NOT do:
  - Buat `server/auth-server.js`: HTTP murni (node:http + node:crypto).
  - POST /register { email, password, name } → 201 { token, user }. Validasi: email regex, password min 8, name tidak kosong. Hash: scryptSync(password, salt, {N:16384, r:8, p:1, maxmem:64MB}). Token: HMAC-SHA256 base64url(header.payload).signature, TTL 30 hari.
  - POST /login { email, password } → 200 { token, user }. Verifikasi: timingSafeEqual.
  - GET /me (Authorization: Bearer) → 200 { user }. Decode token, cek expiry local, cari user by id.
  - POST /logout → 204 (stateless, no blocklist).
  - Semua error shape: `{ error: "pesan Bahasa Indonesia" }`. Status: 400, 401, 409, 500.
  - CORS `*` (dev scope). `AUTH_SECRET` env var, fallback `dev-secret-ganti-di-produksi`.
  - Buat `server/package.json` (`"start": "node auth-server.js"`) + `server/users.json` (`[]`).
  - Tambahkan `server/users.json` ke `.gitignore`.
  - **Must NOT** tambah express/koa/mongoose.
  Parallelization: Wave 1 | Blocked by: — | Blocks: T4
  References: Metis findings: M4, M5, M6, m1, m2, m3
  Acceptance criteria: Start server `node server/auth-server.js`. Test: register, login, me, logout, duplicate email 401, wrong password 401.
  QA: happy + failure (401/409/500). Evidence `.omo/evidence/auth-system/server-test.log`
  Commit: Y | feat(auth): server Node murni dengan scrypt + HMAC token

- [x] 2. Shared types + API config
  What to do / Must NOT do:
  - `src/features/auth/types.ts`: Zod: UserSchema, LoginRequestSchema, RegisterRequestSchema, AuthResponseSchema, AuthErrorSchema.
  - `src/features/auth/api.ts`: `API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000"`.
  - **Must NOT** tambah dependencies.
  Parallelization: Wave 1 | Blocked by: — | Blocks: T4, T5
  Acceptance criteria: `pnpm typecheck` lolos. Zod parse valid.
  QA: valid + invalid parse. Evidence `.omo/evidence/auth-system/types-test.log`
  Commit: Y | feat(auth): types Zod + API base URL config

- [x] 3. Token storage (platform split)
  What to do / Must NOT do:
  - `src/storage/auth.ts`: `getToken`, `setToken`, `clearToken`. Platform split: Platform.OS === "web" → localStorage. Native → expo-secure-store.
  - Error handling: storage failure → getToken returns null, set/clear silent.
  - **Must NOT** import expo-secure-store di path web.
  Parallelization: Wave 1 | Blocked by: — | Blocks: T4
  Acceptance criteria: Mock test: set-get-clear flow.
  QA: happy + failure. Evidence `.omo/evidence/auth-system/storage-test.log`
  Commit: Y | feat(auth): token storage platform split

- [x] 4. Auth client
  What to do / Must NOT do:
  - `src/features/auth/authClient.ts`: register, login, me, logout. Token injection Authorization: Bearer. Error: response.error message Bahasa Indonesia.
  - **Must NOT** tambah retry atau interceptor.
  Parallelization: Wave 2 | Blocked by: T2, T3 | Blocks: T5
  Acceptance criteria: Mock fetch happy + 4 error cases.
  QA: happy + 4 error paths. Evidence `.omo/evidence/auth-system/client-test.log`
  Commit: Y | feat(auth): auth client register/login/me/logout

- [x] 5. AuthProvider + LoginForm + RegisterForm
  What to do / Must NOT do:
  - AuthProvider: 3-state (unauthenticated/locked/authenticated). /me + token check on mount. login/register/logout/biometricUnlock/hasBiometric/retryLoad. Error messages Bahasa Indonesia.
  - Biometric: hasHardwareAsync + isEnrolledAsync. AppState listener + debounce 2s. Cancel → password.
  - LoginForm: email + password + PrimaryButton + "Belum punya akun? Daftar" link + error text. Gunakan Field component.
  - RegisterForm: nama + email + password (min 8) + PrimaryButton + "Sudah punya akun? Masuk" link.
  - **Must NOT** tambah animasi fancy.
  Parallelization: Wave 2 | Blocked by: T2, T3, T4 | Blocks: T6, T7
  Acceptance criteria: `pnpm typecheck`. Form render + submit works.
  QA: happy (login/register/switch/logout) + failure (wrong password/network error). Evidence `.omo/evidence/auth-system/provider-test.log`
  Commit: Y | feat(auth): AuthProvider + LoginForm + RegisterForm

- [x] 6. Gate di `_layout.tsx`
  What to do / Must NOT do:
  - AuthProvider outermost (SEBELUM BackupProvider). Pola: `fonts → onboardingDone → authState → Stack`.
  - Tanpa user → render `<AuthGate />` inline (bukan Stack routes). ScreenShell withTabBar=false.
  - Server unreachable tanpa token → error screen + retry.
  - **Must NOT** render Stack.Screen login/register — deep-link diblokir.
  - **Must NOT** mount data providers sebelum auth selesai.
  Parallelization: Wave 3 | Blocked by: T5 | Blocks: T7
  Acceptance criteria: `pnpm typecheck`. Tanpa token → AuthGate. Token valid → Stack tabs.
  QA: register → data muncul + server down → retry screen. Evidence `.omo/evidence/auth-system/gate-test.log`
  Commit: Y | feat(auth): auth gate wajib di _layout.tsx

- [x] 7. Update tab Profil (nama user + logout)
  What to do / Must NOT do:
  - Tambah section "Akun" di settings.tsx: nama + email user. Tombol "Keluar" → logout() → kembali login.
  - **Must NOT** ubah logic theme settings.
  Parallelization: Wave 3 | Blocked by: T5 | Blocks: —
  Acceptance criteria: Login → profil shows name/email. Logout → login screen.
  QA: happy + edge case. Evidence `.omo/evidence/auth-system/settings-test.log`
  Commit: Y | feat(auth): nama user + tombol logout di tab Profil

- [x] 8. Server tests + client tests
  What to do / Must NOT do:
  - `server/auth-server.test.js`: 12 cases (register happy/duplicate/invalid/short-pw, login happy/wrong-pw, me valid/no-token/expired/tampered, logout 204, CORS preflight).
  - `src/storage/auth.test.ts`: set-get-clear flow.
  - `src/features/auth/types.test.ts`: valid + invalid Zod parse.
  - `src/features/auth/authClient.test.ts`: mock fetch. Happy + 4 errors.
  - **Must NOT** pakai Jest di server — Node test runner bawaan.
  Parallelization: Wave 4 | Blocked by: T4, T5 | Blocks: —
  Acceptance criteria: Semua test pass.
  QA: all 12 server + 3 client files. Evidence `.omo/evidence/auth-system/all-tests.log`
  Commit: Y | test(auth): server + client tests

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE.

- [x] F1. Plan compliance audit — setiap todo sudah eksekusi sesuai acceptance criteria? Evidence `.omo/evidence/auth-system/compliance.md`
- [x] F2. Code quality review — tidak ada `any`, async error handling, no console.log, a11y labels. Evidence `.omo/evidence/auth-system/quality.md`
- [x] F3. Real manual QA — start server + start Expo → register → login → profil → logout → login again → tutup → buka → biometric/fallback. Evidence `.omo/evidence/auth-system/manual-qa.md`
- [x] F4. Scope fidelity — grep: tidak ada refresh token, tidak ada rate limiting, tidak ada social login, tidak ada `app/login.tsx`. Evidence `.omo/evidence/auth-system/scope-check.md`

## Commit strategy
8 commits implementation (feat(auth) / test(auth)) + 1 commit verification.

## Success criteria

1. Server berjalan localhost:4000, register/login/me/logout berfungsi.
2. App tanpa token → login/register form.
3. Register/login → user masuk tabs + data terakses.
4. Biometric prompt saat buka ulang (jika sensor tersedia).
5. Logout → kembali login.
6. Tab Profil: nama + email user.
7. Semua test pass: 12 server + 3 client files.
8. Web build tidak crash (localStorage fallback).
