# Firebase-First Auth (Expo Tanpa Server Wajib) — Design

Tanggal: 2026-09-09. Status: disetujui user (Opsi A).

## Masalah

`npx expo start` tidak cukup: `package.json` selalu menjalankan `server/auth-server.js`
bersama expo karena seluruh alur auth (`authClient.ts`, `AuthProvider.tsx`) memanggil
server di `localhost:4000`, bahkan saat login lewat Firebase. Tanpa server, boot sesi
jatuh ke status `locked` ("kesalahan koneksi").

## Tujuan

`expo start` saja cukup bila Firebase dikonfigurasi. Server lokal tetap ada sebagai
fallback dev (alur REST lama), bukan kewajiban.

## Keputusan desain

1. Server lokal tetap ada, opsional (bukan dihapus).
2. Ganti kata sandi jalur Firebase: `reauthenticateWithCredential` + `updatePassword`
   (user wajib ketik kata sandi lama).
3. Opsi A: Firebase-first, server fallback dev.

## Perubahan per file

### 1. `src/features/auth/firebaseClient.ts` (+3 fungsi)

- `firebaseCurrentUser(): Promise<User | null>` — baca `auth.currentUser`
  (uid, email, displayName) tanpa refresh token. Untuk boot sesi dan unlock biometrik.
- `firebaseUpdateName(name: string): Promise<User>` — `updateProfile(currentUser,
  { displayName: name })`, return `User` hasil. Error bila tidak ada user login.
- `firebaseChangePassword(current: string, next: string): Promise<void>` —
  `reauthenticateWithCredential(EmailAuthCredential)` lalu `updatePassword`.
  Error Firebase dipetakan ke pesan Indonesia (kredensial salah, kata sandi lemah,
  butuh login ulang). Error tak dikenal: teruskan pesan asli.

### 2. `src/features/auth/authClient.ts` (Firebase-first)

- `register` / `login`: bila `isFirebaseConfigured()`, return
  `{ token: session.idToken, user: session.user }` langsung. Tanpa `fetchMe` /
  `withReconciledName`. `FIREBASE_UNAVAILABLE` → fallback `postAuth` seperti sekarang.
- `updateProfile`: jalur Firebase → `firebaseUpdateName`. Jalur server tetap `PATCH /me`.
- `changePassword`: jalur Firebase → `firebaseChangePassword`. Jalur server tetap.
- `logout`: jalur Firebase → `firebaseLogout` + pemanggil hapus token lokal.
  `fetch /logout` hanya di jalur server.
- `fetchMe`: tetap ada, hanya dipakai jalur server.
- `withReconciledName`: hapus (tidak lagi dipakai).

Perilaku berubah: nama user berasal dari `displayName` Firebase langsung.
Profil kanonis Firestore (mirror server) tidak lagi dibaca di jalur Firebase.

### 3. `src/features/auth/AuthProvider.tsx` (boot tanpa server)

- `boot()`: bila `isFirebaseConfigured()`, cek `firebaseCurrentUser()`. Ada user →
  `authenticated` langsung tanpa `fetchMe`. Tidak ada → `unauthenticated`.
  Bila Firebase tak dikonfigurasi → jalur server seperti sekarang (`verifyToken`).
  Flag E2E web tetap diutamakan.
- `biometricUnlock()`: jalur Firebase cukup cek `currentUser` masih ada.
  Jalur server tetap verifikasi token.
- `logout`, `updateProfile`, `changePassword`: teruskan ke `authClient`,
  tidak ada perubahan logika di provider.

### 4. `package.json` (script)

- `dev` / `start` / `android` / `ios` / `web`: default cukup `expo start ...`
  (tanpa server).
- Tambah varian `:full` (mis. `dev:full`, `start:full`) yang menjalankan
  server + expo seperti sekarang, untuk dev jalur REST / tanpa Firebase.

## Error handling

- Firebase tidak terjangkau saat login: pesan koneksi yang sama (`CONNECTION_ERROR`)
  seperti sekarang.
- Token Firebase basi di boot: Firebase SDK me-refresh otomatis bila ada jaringan;
  bila gagal, `firebaseCurrentUser()` return null → `unauthenticated` (login ulang),
  bukan `locked`.
- Jalur server: perilaku `locked` / `unreachable` tetap seperti sekarang.

## Testing

- Unit: tambah/ubah `firebaseClient.test.ts` (3 fungsi baru, mock SDK),
  `authClient.test.ts` (jalur Firebase tanpa `fetch` server; jalur server tetap).
- `tsc --noEmit`, `eslint`, `vitest run` hijau.
- Manual: `expo start` tanpa server → login, tutup-buka aplikasi (boot),
  ubah nama, ganti kata sandi, logout.

## Yang disengaja tidak diubah

- `server/`: tidak disentuh. Tetap jalan via `pnpm server` / script `:full`.
- Data transaksi/settings: murni lokal (AsyncStorage), tidak terkait server.
- Skema token storage (`SecureStore` native, cookie httpOnly web): tetap.
