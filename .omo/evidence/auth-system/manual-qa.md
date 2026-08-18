# Manual QA Evidence — Auth System

**Date:** 2026-08-18
**Repo:** /home/ideees/Projects/mobile/oh-my-bendahara
**Method:** Real end-to-end live server test (curl) + server unit tests + client typecheck/tests + static gate analysis.
**Server under test:** `server/auth-server.js` — pure Node HTTP server, zero deps, JWT (HS256) + scrypt password hashing, token TTL 30 days.

---

## STEP 1 — Live server lifecycle (curl transcript)

Server started detached with temp users file:

```
$ setsid ... USERS_FILE=/tmp/opencode/auth-users-UZPY.json PORT=4100 node server/auth-server.js
Auth server berjalan di http://localhost:4100
PID=205502
```

### 1. POST /register (valid) → **201 + token + user** ✅
```
HTTP/1.1 201 Created
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, OPTIONS
Content-Type: application/json
Content-Length: 329

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NjUyZmQxMC03MzljLTQ3NTEtYTZhZC04MGY2Y2RlOTczYzUiLCJlbWFpbCI6InFhQHRlc3QuZGV2IiwiaWF0IjoxNzg3MDQwMDYzNDM3LCJleHAiOjE3ODk2MzIwNjM0Mzd9.kex-GVNdzVXfOUd8rt9z0scqVpwFnanFmiVMcpC8J3k","user":{"id":"4652fd10-739c-4751-a6ad-80f6cde973c5","email":"qa@test.dev","name":"QA User"}}
```

### 2. POST /register same email → **409** ✅
```
HTTP/1.1 409 Conflict
Content-Type: application/json

{"error":"Email sudah terdaftar."}
```

### 3. POST /login wrong password → **401** ✅
```
HTTP/1.1 401 Unauthorized

{"error":"Email atau kata sandi salah."}
```

### 4. POST /login correct → **200 + token** ✅
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 329

{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NjUyZmQxMC03MzljLTQ3NTEtYTZhZC04MGY2Y2RlOTczYzUiLCJlbWFpbCI6InFhQHRlc3QuZGV2IiwiaWF0IjoxNzg3MDQwMDY0ODAzLCJleHAiOjE3ODk2MzIwNjQ4MDN9.QEhs771qL-qNDQt0tJHo_z92HWoH7Lr0vbXwF1gH7VE","user":{"id":"4652fd10-739c-4751-a6ad-80f6cde973c5","email":"qa@test.dev","name":"QA User"}}
```

### 5. GET /me with valid Bearer → **200 user** ✅
```
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 93

{"user":{"id":"4652fd10-739c-4751-a6ad-80f6cde973c5","email":"qa@test.dev","name":"QA User"}}
```

### 6. GET /me with tampered token (last char flipped) → **401** ✅
```
HTTP/1.1 401 Unauthorized

{"error":"Sesi berakhir. Silakan masuk kembali."}
```

### 7. POST /logout → **204** ✅
```
HTTP/1.1 204 No Content
```

### 8. OPTIONS / → **204 + CORS headers** ✅
```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

**Live lifecycle: 8/8 checks pass.**

---

## STEP 2 — Server tests (`cd server && npm test`)

```
> saku-auth-server@1.0.0 test
> node --test

✔ register returns 201 with token and public user
✔ register duplicate email returns 409
✔ register invalid email returns 400
✔ register short password returns 400
✔ login returns 200 with token and public user
✔ login wrong password returns 401
✔ GET /me with valid token returns 200 and user
✔ GET /me without token returns 401
✔ GET /me with expired token returns 401
✔ GET /me with tampered token returns 401
✔ POST /logout returns 204
✔ OPTIONS preflight returns 204 with CORS headers
ℹ tests 12
ℹ pass 12
ℹ fail 0
```

**Expected 12/12 → actual 12/12 PASS.** ✅

---

## STEP 3 — Client (`pnpm typecheck && pnpm test`)

### typecheck
```
$ tsc --noEmit
exit 0
```
**Clean, no type errors.** ✅

### unit tests (Vitest)
```
 RUN  v4.1.10 /home/ideees/Projects/mobile/oh-my-bendahara

 Test Files  13 passed (13)
      Tests  90 passed (90)
   Duration  5.06s
```
**Expected 90/90 → actual 90/90 PASS.** ✅

---

## STEP 4 — Static gate analysis (boot gate, wire-level proof)

No simulator available; gate verified by reading the real render path.

### `app/_layout.tsx` — data providers mount ONLY when authenticated
```tsx
if (authState !== "authenticated") {
  // Gerbang auth inline (bukan route) ... Provider data di bawah TIDAK
  // dipasang selama sesi belum terverifikasi
  return (
    <SafeAreaProvider>
      <AuthGate />
    </SafeAreaProvider>
  )
}

return (
  <SafeAreaProvider>
    <BackupProvider>
      <SettingsProvider>
        <TransactionsProvider>
          <BudgetsProvider>
            <RecurringProvider>
              <Stack ...> ... </Stack>
            </RecurringProvider>
          </BudgetsProvider>
        </TransactionsProvider>
      </SettingsProvider>
    </BackupProvider>
  </SafeAreaProvider>
)
```
Early return at `authState !== "authenticated"` means the entire data-provider + Stack subtree (all 5 providers and every screen) is **unreachable until auth verifies**. Gate is structural (`if/else` in `RootContent`), not just a conditional render inside shared children.

### `AuthGate.tsx` — unauthenticated → login form
```tsx
if (state === "authenticated") return null        // provider tree takes over
if (mode === "login")  return <LoginForm ... />
return <RegisterForm ... />
```

### `AuthProvider.tsx` — token is the state source
```tsx
type AuthState = "unauthenticated" | "locked" | "authenticated"

const token = await getToken()
if (token === null) {
  setState("unauthenticated")                     // <-- no token → blocked
  return
}
// token exists → verifyToken() against server
//   authenticated → setState("authenticated")
//   unreachable  → setState("locked")           (token kept, biometric/retry)
//   expired/bad → clearToken(); setState("unauthenticated")
```

**Render path (no token):** `RootLayout` → `AuthProvider.boot()` sets `unauthenticated` → `RootContent` early-returns `AuthGate` → `AuthGate` (default mode "login") renders `LoginForm`. **No route exists for login/register** — they are inline forms only (`app/` has no `/login` or `/register` screen). Data providers and Stack never mount. ✅

**Render path (valid token):** `boot()` verifies via `GET /me` → `authenticated` → `RootContent` skips the gate → all data providers + Stack mount. ✅

**Edge path (server unreachable, stored token):** state `locked` → `AuthGate` shows lock screen with biometric/retry/logout (token intentionally preserved). ✅

---

## Server shutdown (recorded)

```
Killed server PID 205502 (setsid-detached node auth-server.js, PORT 4100)
Verified: no process listening on :4100; temp users file removed.
```

---

## VERDICT: **APPROVE**

Live curl lifecycle 8/8 ✅ · server unit tests 12/12 ✅ · typecheck clean ✅ · client tests 90/90 ✅ · boot gate wire-level proof confirms data layer is unreachable without a verified token ✅

No blocking findings. Minor notes (non-blocking):
- `Access-Control-Allow-Origin: *` is fine for this local/dev context; if the auth server ever goes public, restrict it.
- `TOKEN_SECRET` defaults to a hardcoded dev value (`dev-secret-ganti-di-produksi`) — must be set via env in any real deployment.
- Logout is client-side (server returns 204 statelessly, JWT TTL still governs); acceptable for this PA (Personal Assistant) app.