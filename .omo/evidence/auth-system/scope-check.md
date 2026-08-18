# Scope-Fidelity Audit — Auth System

**Date:** 2026-08-18
**Verdict:** APPROVE
**Result:** 10/10 items PASS. No Must-NOT-have item present.

---

## 1. No refresh token / auto-refresh logic — PASS

- `grep "refresh"` in `src/features/auth/`: **no matches**.
- `grep "refresh"` in `server/`: **no matches**.
- Only "refresh" string in auth surface: `icon="refresh"` in `src/components/auth/AuthGate.tsx:61` — Material icon name for the "Coba lagi" (retry) button, not token logic.
- Token model is single stateless JWT (`server/auth-server.js:48-53` signToken, `:12` TOKEN_TTL 30d). No refresh endpoint, no sliding renewal.

## 2. No reset / forgot password — PASS

- `grep "reset|forgot|lupa"` in `src/`: **no matches**.
- `server/auth-server.js` routes are exactly 4: `POST /register` (:151), `POST /login` (:186), `GET /me` (:215), `POST /logout` (:227). No password-reset route.
- `LoginForm`/`RegisterForm` scan: no forgot/reset link.

## 3. No rate limiting — PASS

- `grep "rate|limit|throttle|too many|429"` in `server/`: **no matches**.
- `MAX_BODY = 1024*1024` (`server/auth-server.js:11`) is a request-size cap (413 on exceed, :236), not rate limiting.
- No login/register brute-force protection exists — absent per Must-NOT-have.

## 4. No email verification — PASS

- `grep "verify|verification|email"` in `server/` hits are: `verifyToken` (JWT signature verification, `auth-server.js:55,133,253`) and `email` as a user field.
- No `/verify-email` route, no `verified` flag in user object (`auth-server.js:173` user shape: `id, email, name, salt, hash`).

## 5. No social login — PASS

- `grep "google|apple|oauth|oauth2|facebook"` matches are false positives:
  - `@expo-google-fonts/plus-jakarta-sans` — font package (`package.json:6`, `app/_layout.tsx:7`, `pnpm-lock.yaml`).
  - `-apple-system` — CSS font stack (`icon-preview.html:10`, `assets/*.svg`).
- No OAuth flow, no provider endpoints.

## 6. No `app/login.tsx` / `app/register.tsx` — PASS

- `glob app/*.tsx` (11 files): `_layout, +html, +not-found, add-transaction, budget-form, budgets, data, onboarding, recurring, recurring-form, showcase`. No login/register.
- `find app -iname "*login*" -o -iname "*register*" -o -iname "*auth*"`: empty.
- Gate is inline: `AuthGate` component rendered by `RootContent` when `authState !== "authenticated"` (`app/_layout.tsx:89-95`). No route exists → deep-link to `/login` or `/register` impossible.

## 7. No transaction storage logic changes — PASS

- `git status` shows **no modifications** to `src/storage/transactions.ts` or `src/features/transactions/*`.
- Modified files (vs HEAD): `.gitignore` (+server/users.json ignore), `app.json` (+expo-secure-store), `app/(tabs)/_layout.tsx` (icon rename receipt-text→history, cosmetic), `app/(tabs)/settings.tsx` (user card + logout — auth), `app/_layout.tsx` (AuthProvider+AuthGate wiring — auth), `package.json`/`pnpm-lock.yaml` (+expo-local-authentication, +expo-secure-store — auth), `src/utils/dates.ts`+`dates.test.ts`, `app/(tabs)/transactions.tsx`+`index.tsx`.
- `grep -iE "auth|login|register|token|session|logout|user"` across diffs of `app/(tabs)/transactions.tsx`, `app/(tabs)/index.tsx`, `src/utils/dates.ts`: **zero matches**. The 378-line transactions.tsx diff contains no auth references — consistent with plan note "previous-session files unrelated to auth scope".
- Auth work contributed only: untracked new files (`server/`, `src/features/auth/`, `src/components/auth/`, `src/storage/auth.ts`+`auth.test.ts`) + the auth-scoped wiring above.

## 8. No deployment artifacts — PASS

- `glob **/{Dockerfile,docker-compose*,*.dockerfile}`: **no files**.

## 9. Server has no extra npm deps — PASS

- `server/package.json` (10 lines): `name, private, version, type, scripts` only. No `dependencies`/`devDependencies` field at all. Server uses only `node:` builtins (`auth-server.js:3-6`).

## 10. Online-first gate, no offline bypass — PASS

`src/features/auth/AuthProvider.tsx`:
- `boot()` (:62-92): no token → `unauthenticated`. Token present → `verifyToken` → `fetchMe(token)` hits server `GET /me`. State becomes `authenticated` **only** when server returns a user (:72-76).
- Server unreachable (:79-85) → `state = "locked"`, `user = null` — token preserved but **not** authenticated.
- `authenticate()` (:124-138): login/register call `apiLogin`/`apiRegister` (server `POST /login` / `/register`); token stored only after server success; `authenticated` set only then.
- `biometricUnlock` (:159-199): after local biometric match, token is **re-verified against server** (`verifyToken` → `fetchMe`). Unreachable → stays `locked`, never grants authenticated offline.
- `logout` (:150-157) clears token + state.
- `app/_layout.tsx:89-95`: unauthenticated/locked → renders only `AuthGate`; data providers (`TransactionsProvider`, `BudgetsProvider`, `RecurringProvider`, etc.) are mounted **only** in the `authenticated` branch (:98-124). No screen reachable without a verified session.

---

## Evidence files read

- `server/auth-server.js`, `server/package.json`
- `src/features/auth/AuthProvider.tsx`, `authClient.ts`, `api.ts`, `types.ts`
- `src/components/auth/AuthGate.tsx`
- `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/settings.tsx` (diffs)
- `git status --short`, `git diff` (all modified files)
