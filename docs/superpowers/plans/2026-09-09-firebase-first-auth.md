# Firebase-First Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `expo start` saja cukup bila Firebase dikonfigurasi; server lokal jadi fallback opsional.

**Architecture:** Tiga fungsi baru di `firebaseClient.ts` (current user, ubah nama, ganti kata sandi via Firebase SDK), `authClient.ts` memilih jalur Firebase dulu dan server hanya sebagai fallback, `AuthProvider.tsx` boot dari Firebase `currentUser` tanpa `fetchMe`.

**Tech Stack:** Firebase JS SDK modular (`firebase/app`, `firebase/auth`), React Native + Expo, vitest.

## Global Constraints

- Pesan error berbahasa Indonesia, tanpa karakter em dash.
- Alur REST/server lama tetap jalan bila Firebase tak dikonfigurasi.
- `pnpm typecheck` (`tsc --noEmit`), `pnpm lint`, `pnpm test` hijau.

---

### Task 1: Fungsi Firebase baru di firebaseClient.ts

**Files:**
- Modify: `src/features/auth/firebaseClient.ts`
- Test: `src/features/auth/firebaseClient.test.ts`

**Interfaces:**
- Consumes: pola `getAuthInstance()` + `toUser()` yang sudah ada di file yang sama; tipe `User` dari `./types`.
- Produces:
  - `firebaseCurrentUser(): Promise<User | null>`
  - `firebaseUpdateName(name: string): Promise<User>`
  - `firebaseChangePassword(currentPassword: string, newPassword: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

Mock modul Firebase di `src/features/auth/firebaseClient.test.ts` (file sudah men-stub env kosong di `beforeEach`; describe baru men-set 4 env Firebase ke nilai dummy):

```ts
vi.mock("firebase/app", () => ({
  getApps: vi.fn(),
  initializeApp: vi.fn(),
}))

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(),
  EmailAuthProvider: { credential: vi.fn() },
  reauthenticateWithCredential: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn(),
}))
```

Test (dalam `describe("firebaseClient jalur Firebase", ...)` dengan env terisi):

```ts
it("firebaseCurrentUser return null bila tidak ada user login", async () => {
  const { getAuth } = await import("firebase/auth")
  vi.mocked(getAuth).mockReturnValue({ currentUser: null })
  await expect(firebaseCurrentUser()).resolves.toBeNull()
})

it("firebaseCurrentUser memetakan currentUser ke User", async () => {
  const { getAuth } = await import("firebase/auth")
  vi.mocked(getAuth).mockReturnValue({
    currentUser: { uid: "uid-1", email: "a@b.c", displayName: "Nama" },
  })
  await expect(firebaseCurrentUser()).resolves.toEqual({ id: "uid-1", email: "a@b.c", name: "Nama" })
})

it("firebaseUpdateName memakai displayName baru", async () => {
  const { getAuth, updateProfile } = await import("firebase/auth")
  const user = { uid: "uid-1", email: "a@b.c", displayName: "Lama" }
  vi.mocked(getAuth).mockReturnValue({ currentUser: user })
  vi.mocked(updateProfile).mockImplementation(async (u, { displayName }) => { u.displayName = displayName })
  await expect(firebaseUpdateName("Baru")).resolves.toEqual({ id: "uid-1", email: "a@b.c", name: "Baru" })
})

it("firebaseUpdateName menolak bila tidak ada user login", async () => {
  const { getAuth } = await import("firebase/auth")
  vi.mocked(getAuth).mockReturnValue({ currentUser: null })
  await expect(firebaseUpdateName("X")).rejects.toThrow("Sesi berakhir. Silakan masuk kembali.")
})

it("firebaseChangePassword reautentikasi lalu update", async () => {
  const { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth")
  const user = { uid: "uid-1", email: "a@b.c" }
  vi.mocked(getAuth).mockReturnValue({ currentUser: user })
  vi.mocked(reauthenticateWithCredential).mockResolvedValue(undefined)
  vi.mocked(updatePassword).mockResolvedValue(undefined)
  await expect(firebaseChangePassword("lama-12345", "baru-12345")).resolves.toBeUndefined()
  expect(EmailAuthProvider.credential).toHaveBeenCalledWith("a@b.c", "lama-12345")
})

it("firebaseChangePassword memetakan kredensial salah", async () => {
  const { getAuth, reauthenticateWithCredential } = await import("firebase/auth")
  vi.mocked(getAuth).mockReturnValue({ currentUser: { uid: "u", email: "a@b.c" } })
  vi.mocked(reauthenticateWithCredential).mockRejectedValue({ code: "auth/invalid-credential" })
  await expect(firebaseChangePassword("salah", "baru-12345")).rejects.toThrow("Kata sandi saat ini salah.")
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/firebaseClient.test.ts`
Expected: FAIL (fungsi belum ada / `vi.mocked(...).mockReturnValue` pada mock kosong).

- [ ] **Step 3: Write minimal implementation**

Di `src/features/auth/firebaseClient.ts`, setelah `getFirebaseIdToken()`:

```ts
async function requireCurrentUser(): Promise<import("firebase/auth").User> {
  const { auth } = await getAuthInstance()
  const user = auth.currentUser
  if (!user) {
    throw new Error("Sesi berakhir. Silakan masuk kembali.")
  }
  return user
}

export async function firebaseCurrentUser(): Promise<User | null> {
  try {
    const { auth } = await getAuthInstance()
    const user = auth.currentUser
    if (!user || !user.email) {
      return null
    }
    return toUser(user.uid, user.email, user.displayName)
  } catch {
    return null
  }
}

export async function firebaseUpdateName(name: string): Promise<User> {
  const { setName } = await getAuthInstance()
  const user = await requireCurrentUser()
  const { auth } = await getAuthInstance()
  void auth
  await setName(user, { displayName: name })
  const email = user.email ?? ""
  return toUser(user.uid, email, user.displayName ?? name)
}

function firebaseErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : ""
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Kata sandi saat ini salah."
    case "auth/weak-password":
      return "Kata sandi baru minimal 8 karakter."
    case "auth/requires-recent-login":
      return "Sesi kedaluwarsa. Masuk kembali lalu coba lagi."
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi nanti."
    case "auth/network-request-failed":
      return "Terjadi kesalahan koneksi."
    default:
      return error instanceof Error && error.message ? error.message : "Terjadi kesalahan koneksi."
  }
}

export async function firebaseChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  const { auth } = await getAuthInstance()
  const user = await requireCurrentUser()
  if (!user.email) {
    throw new Error("Sesi berakhir. Silakan masuk kembali.")
  }
  const authModule = await import("firebase/auth")
  try {
    const credential = authModule.EmailAuthProvider.credential(user.email, currentPassword)
    await authModule.reauthenticateWithCredential(user, credential)
    await authModule.updatePassword(user, newPassword)
  } catch (error) {
    throw new Error(firebaseErrorMessage(error))
  }
}
```

Catatan: `getAuthInstance()` melempar `FIREBASE_UNAVAILABLE` bila tak dikonfigurasi; `firebaseCurrentUser` menelannya jadi `null`, sedangkan `firebaseUpdateName` / `firebaseChangePassword` meneruskannya agar `authClient` bisa fallback ke server. Sederhanakan `firebaseUpdateName` agar hanya panggil `getAuthInstance()` sekali (pakai `setName` dan `auth` dari hasil yang sama).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/firebaseClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/firebaseClient.ts src/features/auth/firebaseClient.test.ts
git commit -m "feat(auth): tambah fungsi Firebase currentUser, updateName, changePassword"
```

### Task 2: Firebase-first di authClient.ts

**Files:**
- Modify: `src/features/auth/authClient.ts`
- Test: `src/features/auth/authClient.test.ts`

**Interfaces:**
- Consumes: `firebaseCurrentUser` tidak dipakai di sini; yang dipakai `firebaseLogin`, `firebaseRegister`, `firebaseLogout`, `firebaseUpdateName`, `firebaseChangePassword`, `isFirebaseConfigured` dari `./firebaseClient`.
- Produces: signature publik tetap (`register`, `login`, `fetchMe`, `updateProfile`, `changePassword`, `logout`); `withReconciledName` dihapus.

- [ ] **Step 1: Write the failing test**

Tambah describe jalur Firebase di `src/features/auth/authClient.test.ts` (set 4 env Firebase ke dummy, mock `firebase/app` + `firebase/auth` seperti Task 1, `mockFetch` tidak boleh terpanggil):

```ts
describe("jalur Firebase", () => {
  it("login tidak memanggil server sama sekali", async () => {
    const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({})
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: {
        uid: "uid-1",
        email: "user@example.com",
        displayName: "User",
        getIdToken: async () => "id-token-123",
      },
    })
    const result = await login({ email: "user@example.com", password: "password123" })
    expect(result).toEqual({ token: "id-token-123", user: { id: "uid-1", email: "user@example.com", name: "User" } })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("updateProfile jalur Firebase tidak memanggil server", async () => {
    const { getAuth, updateProfile: updateProfileFn } = await import("firebase/auth")
    const user = { uid: "uid-1", email: "user@example.com", displayName: "Lama" }
    vi.mocked(getAuth).mockReturnValue({ currentUser: user })
    vi.mocked(updateProfileFn).mockImplementation(async (u, { displayName }) => { u.displayName = displayName })
    await expect(updateProfile("id-token-123", { name: "Baru" })).resolves.toEqual({
      id: "uid-1",
      email: "user@example.com",
      name: "Baru",
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("logout jalur Firebase tidak memanggil server", async () => {
    const { getAuth, signOut } = await import("firebase/auth")
    vi.mocked(getAuth).mockReturnValue({})
    vi.mocked(signOut).mockResolvedValue(undefined)
    await expect(logout("id-token-123")).resolves.toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
```

Test jalur server yang sudah ada tidak diubah dan harus tetap hijau.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/features/auth/authClient.test.ts`
Expected: FAIL (`fetchMe` terpanggil / `fetch` server terpanggil di jalur Firebase).

- [ ] **Step 3: Write minimal implementation**

Ubah `src/features/auth/authClient.ts`:

```ts
import {
  FIREBASE_UNAVAILABLE,
  firebaseChangePassword,
  firebaseLogin,
  firebaseLogout,
  firebaseRegister,
  firebaseUpdateName,
  isFirebaseConfigured,
} from "./firebaseClient"
```

- `register`: jalur Firebase return `{ token: session.idToken, user: session.user }` langsung; catch `FIREBASE_UNAVAILABLE` → `postAuth("/register", input)`.
- `login`: sama dengan `/login`.
- Hapus `withReconciledName` dan pemakaiannya.
- `updateProfile`: bila `isFirebaseConfigured()`, coba `firebaseUpdateName(input.name)`; `FIREBASE_UNAVAILABLE` → lanjut ke `PATCH /me` seperti sekarang.
- `changePassword`: bila `isFirebaseConfigured()`, coba `firebaseChangePassword(input.currentPassword, input.newPassword)`; `FIREBASE_UNAVAILABLE` → lanjut ke `PATCH /me/password`.
- `logout`: bila `isFirebaseConfigured()`, `await firebaseLogout()` lalu return tanpa `fetch /logout`. Bila tidak, `fetch /logout` seperti sekarang.
- `fetchMe`, `postAuth`, `errorFrom`, `readJson`: tidak berubah.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/features/auth/authClient.test.ts`
Expected: PASS (jalur server lama + jalur Firebase baru).

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/authClient.ts src/features/auth/authClient.test.ts
git commit -m "feat(auth): Firebase-first, server jadi fallback"
```

### Task 3: Boot tanpa server di AuthProvider.tsx

**Files:**
- Modify: `src/features/auth/AuthProvider.tsx`

**Interfaces:**
- Consumes: `firebaseCurrentUser`, `isFirebaseConfigured` dari `./firebaseClient`; `fetchMe`, `verifyToken` lokal tetap untuk jalur server.
- Produces: tidak ada signature baru; `boot()` dan `biometricUnlock()` bercabang Firebase/server.

- [ ] **Step 1: Ubah `boot()`**

Di awal `boot`, setelah blok E2E web, tambah cabang Firebase sebelum `getToken()`:

```ts
if (isFirebaseConfigured()) {
  const current = await firebaseCurrentUser()
  if (current) {
    setUser(current)
    setState("authenticated")
    setAuthError(null)
  } else {
    setUser(null)
    setState("unauthenticated")
    setAuthError(null)
  }
  return
}
```

Sisa `boot` (jalur server) tidak berubah.

- [ ] **Step 2: Ubah `biometricUnlock()`**

Setelah biometrik sukses dan sebelum `getToken()`, tambah:

```ts
if (isFirebaseConfigured()) {
  const current = await firebaseCurrentUser()
  if (current) {
    setUser(current)
    setState("authenticated")
    setAuthError(null)
    return { ok: true }
  }
  await clearToken()
  setUser(null)
  setState("unauthenticated")
  return { ok: false, message: "Sesi tidak ditemukan. Silakan masuk kembali." }
}
```

Sisa fungsi (jalur server) tidak berubah.

- [ ] **Step 3: Verifikasi**

Run: `pnpm typecheck && pnpm lint && pnpm vitest run src/features/auth`
Expected: semua hijau (tidak ada test provider; verifikasi via typecheck + suite auth).

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/AuthProvider.tsx
git commit -m "feat(auth): boot dan unlock biometrik tanpa server bila Firebase ada"
```

### Task 4: Script expo-only + verifikasi akhir

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: script `dev`/`start`/`android`/`ios`/`web`/`server` yang sudah ada.
- Produces: script default tanpa server + varian `:full` dengan server.

- [ ] **Step 1: Ubah script**

```json
"dev": "expo start",
"dev:full": "concurrently -n server,expo -c green,cyan \"pnpm server\" \"expo start\"",
"start": "concurrently -n server,expo -c green,cyan \"pnpm server\" \"expo start\"",
```

Hati-hati: `start` dipakai `expo start` internal? Tidak, `start` hanya alias dev dengan server. Ubah kelima script (`dev`, `start`, `android`, `ios`, `web`) ke versi expo-only, dan tambah pasangan `:full` untuk tiap script yang sebelumnya menjalankan server:
- `dev` → `expo start`; `dev:full` → concurrently seperti lama.
- `start` → `expo start`; `start:full` → concurrently seperti lama.
- `android` → `expo start --android`; `android:full` → concurrently lama.
- `ios` → `expo start --ios`; `ios:full` → concurrently lama.
- `web` → `expo start --web`; `web:full` → concurrently lama.
- `server` dan `test*`, `typecheck`, `lint`: tidak berubah.

- [ ] **Step 2: Verifikasi penuh**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: semua hijau.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: script default expo-only, varian :full dengan server"
```

## Self-Review

- Cakupan spec: firebaseClient (3 fungsi) → Task 1; authClient Firebase-first → Task 2; AuthProvider boot/unlock → Task 3; script → Task 4. Error mapping Firebase → Task 1 (`firebaseErrorMessage`). Testing manual expo-tanpa-server tetap dilakukan user setelah implementasi.
- Tanpa placeholder: semua langkah berisi kode aktual, nama file, dan perintah run yang persis.
- Konsistensi tipe: `User` = `{ id, email, name }` di semua task; `firebaseChangePassword(currentPassword, newPassword)` dua string di Task 1 dan dipakai sama di Task 2.
