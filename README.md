<p align="center">
  <img src="assets/logo-lockup.svg" alt="Saku - catatan keuangan harian" width="440">
</p>

<p align="center">
  Aplikasi catatan keuangan pribadi yang tenang dan mudah: catat pemasukan &amp; pengeluaran dan kendalikan anggaran bulanan.
</p>

<p align="center">
  <strong>React Native</strong> · <strong>Expo Router</strong> · <strong>TypeScript</strong> · offline-first untuk data, server opsional untuk auth
</p>

---

## Fitur

- **Onboarding** - 2 slide (atur gaji dan pos, lacak arus kas), bisa dilewati, flag `bendahara.onboarding.v1`.
- **Login** - desain Stitch: ikon Saku, pill SAKU FINANSIAL, input Email dan Kata Sandi rounded, Lupa sandi, tombol Masuk ke Akun + arrow, divider ATAU, Masuk dengan Biometrik, link Daftar Sekarang.
- **Register** - teks SAKU FINANSIAL + judul Registrasi Cepat, field Nama Lengkap, Email, Kata Sandi, Ulangi Kata Sandi, hint kombinasi huruf dan angka, checkbox Syarat dan Privasi, tombol Daftar Sekarang. Tanpa tombol Google.
- **Layar terkunci** - tampil bila ada token tersimpan tapi verifikasi sesi gagal (server tak terjangkau atau sesi bermasalah), plus saat kunci biometrik mengunci ulang layar: status error, tombol Coba lagi, Keluar dari akun ini, unlock biometrik bila tersedia.
- **Beranda** - sapaan Halo + nama, kartu Total Anggaran + chip bulan + eye sembunyikan saldo, shortcut Pemasukan, tombol Alokasi (sheet), grid Saku per kategori (persen, terpakai, progress), Arus Kas Pekan Ini vs pekan lalu, 4 Transaksi Terakhir + Lihat Semua. Ada state loading, error + Coba lagi, dan empty.
- **Riwayat** - cari transaksi, filter Semua/Pemasukan/Pengeluaran, kartu Total Masuk dan Total Keluar bulan ini, grup per hari (label hari + tanggal), empty khusus filter dan empty awal.
- **Tambah dan edit transaksi** - satu layar dua mode via param `id` + `type` (expo-router). Hero nominal Rp + preset +100rb/+500rb/+1jt dan atur ulang, toggle Pengeluaran/Pemasukan, grid kategori 4 kolom, tanggal native (max hari ini, input date di web), catatan opsional max 120. Konfirmasi via tombol Tersimpan! 0.5 detik, tanpa toast terpisah.
- **Detail transaksi** - pill Transaksi Berhasil, ikon kategori, nominal +/-, tanggal jam WIB, kartu Dampak Anggaran (hanya expense berbujet: persen, terpakai, sisa), kartu Rincian, aksi Edit dan Hapus dengan dialog konfirmasi hapus permanen.
- **Analisis** - hero Total Saldo Tergabung + chip % vs bulan lalu + Pemasukan/Pengeluaran + eye, tren 7 Hari/30 Hari/3 Bulan (total, rata-rata per hari, garis batas, legenda puncak vs bawah target), Distribusi Budget + status AMAN/MENDEKATI/MELEBIHI + Atur Limit, kartu Peringatan Kuota, Saku Insight. Empty bila belum ada data.
- **Anggaran** - limit per kategori + progress, diatur lewat AlokasiSheet dari Beranda dan Analisis. Hook sisa harian (`useDailyBudget`) ada tapi belum dipakai di layar mana pun.
- **Profil dan Pengaturan** - foto + nama + email + badge Akun Terverifikasi statis (tampil untuk semua user yang login, bukan hasil verifikasi nyata), Edit Profil (nama 1-60, ganti foto max 512px JPEG), Keamanan dan Kata Sandi (3 field + validasi beda dari lama), tema Sistem/Terang/Gelap via modal, kunci biometrik (muncul bila perangkat mendukung), toggle Notifikasi lokal, Keluar dengan dialog konfirmasi, tampilkan Versi app.
- **Backup diam-diam** - provider auto-restore mirror lokal saat install ulang dan jadi gate sebelum provider data baca storage. API restore manual (`restoreBackup`) ada tapi belum dipakai layar mana pun. Tanpa tombol ekspor/impor di layar.

## Yang belum ada di UI

Jujur agar README tidak overklaim:

- **Bahasa** terkunci Indonesia dan non-interaktif. **Pusat Bantuan & FAQ** dan **Kebijakan Privasi** baris placeholder non-interaktif (TODO di kode).
- **KYC** dan **2 Langkah aktif** hanya subtitle statis di Profil, bukan status verifikasi nyata.
- **Transaksi berulang**: kode `src/features/recurring` ada dan teruji, tapi provider tidak dipasang di layout dan tanpa layar. Jadi belum berjalan untuk pengguna.
- **Ekspor/impor CSV/JSON**: util `src/utils/csv.ts` dan `src/utils/backup.ts` ada dan teruji, tapi tanpa tombol di layar.
- **MonthNavigator**: komponen ada tapi tidak dipakai layar mana pun. Chip bulan di Beranda hanya label bulan berjalan, tanpa navigasi bulan.
- **Showcase** (`/showcase`): kontrak visual untuk dev, tidak ditautkan dari UI produk.

## Teknologi

| | |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev) 0.86.2 |
| Navigasi | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| Bahasa | TypeScript (strict) |
| State & storage data | React Context + AsyncStorage (offline, tanpa backend) |
| Auth | Firebase-first bila dikonfigurasi, fallback server Node sendiri (`server/auth-server.js`) |
| Token | Web: cookie httpOnly `saku_token`; Native: SecureStore (Keychain/Keystore) |
| Validasi | [Zod](https://zod.dev) |
| Font | Plus Jakarta Sans (via `@expo-google-fonts`) |
| Desain | Design system emerald (Safe Stewardship), lihat [`DESIGN.md`](DESIGN.md) |

## Auth: dua mode

1. **Firebase** - aktif bila semua `EXPO_PUBLIC_FIREBASE_*` diisi (API key, auth domain, project ID, app ID). Sesi dibaca dari Firebase SDK langsung.
2. **Server lokal** - default tanpa konfigurasi Firebase. JWT HS256 custom, TTL 30 hari, password scrypt, simpan `server/users.json` (atomic write). Opsional mirror profil ke Firestore bila `FIREBASE_PROJECT_ID` + kredensial Admin SDK diisi.

### Endpoint server

| Method & path | Auth | Sukses | Validasi / catatan |
|---|---|---|---|
| `POST /register` | - | `201 { token, user }` + set cookie | email valid, password min 8, nama 1-60; `409` bila email terdaftar; rate-limit 20/15 mnt per IP |
| `POST /login` | - | `200 { token, user }` + set cookie | `401` bila email/password salah (timing-safe, dummy hash bila akun tak ada); rate-limit sama |
| `GET /me` | Bearer / cookie | `200 { user }` | `401` bila token hilang/kedaluwarsa/rusak/versi dicabut |
| `PATCH /me` | Bearer / cookie | `200 { user }` | nama 1-60 |
| `PATCH /me/password` | Bearer / cookie | `204` | verifikasi password lama; baru min 8; akun Firebase-only ditolak dengan arahan (cek beda dari lama hanya di client) |
| `POST /logout` | opsional | `204` + hapus cookie | selalu 204; bila token valid, `tokenVersion` naik, semua sesi user dicabut |

Respons error: `{ error: string }` berbahasa Indonesia. `user` publik hanya `{ id, email, name }`, tanpa salt/hash.

## Menjalankan

Butuh Node.js 20+ dan [pnpm](https://pnpm.io).

```bash
pnpm install
```

Login butuh app + server auth (`:4000`) sekaligus, pakai varian `:full`:

```bash
pnpm dev:full       # Expo + server auth sekaligus (pengembangan)
pnpm web:full       # browser + server
pnpm android:full   # emulator/perangkat Android + server
pnpm ios:full       # simulator iOS + server
```

Tanpa server (data offline saja, tanpa login):

```bash
pnpm dev            # Expo saja
pnpm web            # browser saja
pnpm start          # Expo dev server (pilih platform di terminal)
pnpm server         # hanya server auth (:4000)
```

## Konfigurasi

Lihat `.env.example` sebagai dokumentasi. Tanpa semua variabel, app + server jalan memakai JWT kustom + `users.json`, nol konfigurasi.

| Variabel | Untuk | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Client ke server auth | host Metro + `:4000` (fallback `http://localhost:4000`) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` / `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` / `EXPO_PUBLIC_FIREBASE_PROJECT_ID` / `EXPO_PUBLIC_FIREBASE_APP_ID` | Client Firebase-first | kosong (fallback server lokal) |
| `PORT` | Server | `4000` |
| `AUTH_SECRET` | Server (wajib di produksi, fail-fast bila kosong saat `NODE_ENV=production`) | `dev-secret-ganti-di-produksi` |
| `USERS_FILE` | Server | `server/users.json` |
| `FIREBASE_PROJECT_ID` + (`FIREBASE_SERVICE_ACCOUNT_JSON` atau `GOOGLE_APPLICATION_CREDENTIALS` atau `FIRESTORE_EMULATOR_HOST`) | Server verifikasi ID token + Firestore | kosong (mode file lokal) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | Server | `900000` / `20` |
| `ALLOWED_ORIGINS` | Server CORS (comma-separated, credentials diizinkan) | kosong (dev: echo origin request agar cookie web jalan) |

Catatan file env: client baca `.env.local` (Expo), server baca `server/.env` (lihat skrip `pnpm server`).

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm typecheck` | `tsc --noEmit`, cek tipe |
| `pnpm lint` | `eslint .` |
| `pnpm test` | unit test client (Vitest) |
| `pnpm test:coverage` | unit test + coverage |
| `pnpm test:e2e` | end-to-end (Playwright, web; bypass login via flag `bendahara.e2e.authenticated`) |
| `npx expo export --platform web` | build statis web ke `dist/` |
| `pnpm server` | `node --env-file=server/.env server/auth-server.js` |
| `npm test --prefix server` | test server (`node --test`: kontrak auth + firebase) |

## Struktur

```
app/                  # layar & navigasi (expo-router): onboarding, (tabs), add-transaction, transaction/[id], edit-profile, change-password, showcase (dev)
src/components/       # UI bersama: ScreenShell, HeroCard, TransactionRow, MonthNavigator (tak dipakai), SegmentedControl, chart, auth forms
src/features/         # domain: transactions, budgets, settings, auth, backup (auto-restore), recurring (kode saja, belum dipasang)
src/storage/          # AsyncStorage/SecureStore: transactions, budgets, recurring, backup, settings, auth, profile, onboarding
src/theme/            # token desain: warna light/dark, tipografi, jarak, shadow
src/utils/            # currency (Rp), dates (id-ID), csv, backup
server/               # auth backend Node http murni: auth-server.js, firebase.js, users.json, migrate-users-to-firestore.js
e2e/                  # spec Playwright + helpers
attic/                # kode lama diarsipkan (routes, e2e, budget screens); tidak dipakai build
DESIGN.md             # dokumentasi design system
```

## Struktur data client

- Transaksi: `{ id, type: income|expense, amount, category, note, date }` (Zod, key AsyncStorage `bendahara.transactions.v1`).
- Anggaran: map `kategori ke limit` (`bendahara.budgets.v1`). Hook sisa harian (`useDailyBudget`) ada tapi belum dipakai di layar mana pun.
- Recurring tersimpan (`bendahara.recurring.v1`) tapi provider belum dipasang, jadi belum diterapkan otomatis di UI.
- Backup mirror (`bendahara.backup.mirror.v1`) untuk auto-restore, bukan ekspor manual.
- Settings (`bendahara.settings.v1`, default tema light + biometricLock true), onboarding (`bendahara.onboarding.v1`), foto profil (`bendahara.profile.photo.v1`), token (`bendahara.auth.token.v1`).

## Lisensi

[MIT](LICENSE)
