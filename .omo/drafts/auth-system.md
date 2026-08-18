---
slug: auth-system
status: approved
intent: clear
review_required: false
pending-action: write .omo/plans/auth-system.md
approach: Backend Node murni (scrypt + HMAC JWT) + AuthProvider frontend + layar login/register + gate wajib + biometrik unlock
---

# Draft: auth-system

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->

| id | outcome | status | evidence |
|---|---|---|---|
| auth-server | POST /register|/login|/me|/logout, scrypt hash, HMAC token | active | plan T1 |
| auth-client | fetch wrapper + SecureStore token + Zod schema | active | plan T2 |
| auth-provider | session state, login/register/logout, biometric unlock | active | plan T3 |
| auth-screens | app/login.tsx + app/register.tsx + gate di _layout | active | plan T4-T5 |
| server-package | server/package.json + users.json + .gitignore server/users.json | active | plan T1 |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->

| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| API base URL | `EXPO_PUBLIC_API_URL` env, fallback `http://localhost:4000` | tidak ada env file saat ini; default dev lokal | yes |
| Token TTL | 30 hari, disimpan SecureStore | pola umum mobile; sesi panjang utk app keuangan personal | yes |
| Biometric | unlock hanya jika token tersimpan valid; fallback ke password | expo-local-authentication wajib perangkat punya sensor | yes |
| Backend deps | Node murni, tanpa framework/database eksternal | repo tanpa backend; scrypt+HMAC cukup utk dev | yes |
| Password policy | min 8 karakter, email valid | keamanan dasar tanpa berlebihan | yes |

## Findings (cited - path:lines)

- `app/_layout.tsx:37-69` — pola gate onboarding: `useState<boolean|null>` + efek load + render inline sebelum Stack. Auth gate mengikuti pola yang sama.
- `app/_layout.tsx:72-96` — provider nesting: `BackupProvider > SettingsProvider > TransactionsProvider > BudgetsProvider > RecurringProvider > Stack`. AuthProvider harus di luar BackupProvider (auth menentukan akses data).
- `src/features/settings/SettingsProvider.tsx:21-49` — pola provider: context + `isLoading`/`loadError` + `retryLoad` + discriminated-union result. AuthProvider mengikuti pola ini.
- `src/features/transactions/types.ts:3-8` — pola `TRANSACTION_TYPES` const + `as const`. Auth types mengikuti: `AUTH_ENDPOINTS` dsb.
- `src/utils/dates.ts:1-5` — `Intl` id-ID patterns. Tidak relevan langsung untuk auth.
- `src/components/Field.tsx` — komponen form label/hint/error yang dipakai di form transaction; dipakai ulang untuk login/register.
- `src/components/PrimaryButton.tsx` — CTA dengan variant + loading/success; dipakai untuk submit form auth.
- `src/components/ScreenShell.tsx:22-28` — wrapper layar + SafeArea; login/register pakai ScreenShell (withTabBar=false).
- `app.json:32-50` — `expo-secure-store` plugin SUDAH terdaftar (dari instalasi). Tidak perlu edit app.json untuk SecureStore.
- `package.json:5-31` — deps: `expo-secure-store@~57.0.1`, `expo-local-authentication@~57.0.2` sudah terpasang.
- Tidak ada `.env*` file dan tidak ada usage `process.env`/`EXPO_PUBLIC_` di app/ (glob+grep kosong) — base URL perlu default baru.

## Decisions (with rationale)

1. **Login wajib** — user memilih "Wajib login". AuthProvider menempati posisi gate paling luar; tanpa session, hanya login/register yang render.
2. **Backend Node murni** — tanpa express/db eksternal. `node:http` + `node:crypto` (scrypt + HMAC). User store JSON `server/users.json` (gitignored). Alasan: repo tanpa backend, dev/self-host scope, zero-dep.
3. **Token = HMAC JWT-style** — header.payload.signature, HS256, TTL 30 hari. Tidak pakai library JWT (zero-dep konsisten).
4. **Biometrik = unlock tambahan** — `expo-local-authentication`: saat app dibuka kembali dan token valid tersimpan, tawarkan unlock biometrik sebelum masuk; gagal/absent sensor → fallback login password.
5. **Base URL via `EXPO_PUBLIC_API_URL`** — fallback `http://localhost:4000`. Expo statis menggantikan `EXPO_PUBLIC_*` saat build.
6. **Server tidak ikut deployed sebagai bagian app** — server mandiri di `server/`, dijalankan manual. App bisa berjalan ke server mana pun via env.

## Scope IN

- `server/auth-server.js` — HTTP server: register, login, me, logout; scrypt hash; HMAC token; CORS.
- `server/package.json` + `server/users.json` + `.gitignore` untuk `server/users.json`.
- `src/features/auth/types.ts` — Zod schema untuk AuthResponse/User/register/login payload.
- `src/features/auth/api.ts` — base URL resolver (`EXPO_PUBLIC_API_URL` ?? localhost:4000).
- `src/features/auth/authClient.ts` — fetch wrapper: register/login/me/logout, SecureStore get/set/delete token.
- `src/features/auth/AuthProvider.tsx` — context: user/session/isLoading/loadError/login/register/logout/biometricUnlock/retryLoad.
- `src/storage/auth.ts` — token persistence via `expo-secure-store` (key `bendahara.auth.token.v1`).
- `app/login.tsx` + `app/register.tsx` — layar form (Field + PrimaryButton + ScreenShell withTabBar=false).
- Gate di `app/_layout.tsx` — AuthProvider terluar; tanpa session → render AuthGate (login/register) inline, pola onboarding.
- Tab "Profil" (settings) menampilkan nama user dari session + tombol logout.
- Test unit: `authClient.test.ts` (mocked fetch + SecureStore), `types.test.ts` (Zod), `api.test.ts` (base URL).

## Scope OUT (Must NOT have)

- Tidak ada refresh token / auto-refresh — token 30 hari cukup untuk scope ini.
- Tidak ada reset password / forgot password — di luar permintaan.
- Tidak ada rate limiting di server — dev scope; disebutkan sebagai risiko.
- Tidak ada email verification.
- Tidak ada social login (Google/Apple).
- Tidak ada perubahan ke storage data transaksi — data tetap lokal AsyncStorage, auth hanya gate akses.
- Tidak ada migrasi data per-user antar akun.
- Tidak ada implementasi server deployment (Docker, dll) — server mandiri, manual.

## Open questions

- Tidak ada. Semua fork owner sudah ditanyakan (jenis auth, wajib vs lock). Base URL default diumumkan di Open assumptions.

## Approval gate
status: awaiting-approval
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->

Approach yang akan di-plan:
1. Backend Node murni di `server/` (register/login/me/logout, scrypt, HMAC JWT 30 hari, users.json gitignored).
2. Frontend: `src/features/auth/*` (types, api, authClient, AuthProvider) + `src/storage/auth.ts` (SecureStore).
3. Layar `app/login.tsx` + `app/register.tsx`, gate wajib di `app/_layout.tsx` (AuthProvider terluar, pola onboarding).
4. Biometrik unlock via `expo-local-authentication` saat token valid tersimpan.
5. Tab Profil menampilkan nama user + logout.
6. Test unit untuk client/types/api.

Eksekusi setelah persetujuan via `/start-work auth-system`. Menunggu oke Anda.
