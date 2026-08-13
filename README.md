<p align="center">
  <img src="assets/logo-lockup.svg" alt="Saku — catatan keuangan harian" width="440">
</p>

<p align="center">
  Aplikasi catatan keuangan pribadi yang tenang dan mudah: catat pemasukan &amp; pengeluaran, kendalikan anggaran bulanan, dan biarkan transaksi berulang tercatat otomatis.
</p>

<p align="center">
  <strong>React Native</strong> · <strong>Expo Router</strong> · <strong>TypeScript</strong> · offline-first, data tersimpan di perangkat
</p>

---

## Fitur

- **Beranda ringkas** — saldo, pemasukan/pengeluaran bulan berjalan, tren netto 6 bulan, dan pengeluaran per kategori dalam satu layar. Navigasi bulan untuk melihat riwayat.
- **Catatan transaksi** — tambah/edit/hapus pemasukan &amp; pengeluaran dengan kategori yang realistis per jenis (Gaji, Bonus, Freelance, Bisnis, Investasi vs Makan &amp; Minum, Transportasi, Kesehatan, dan lainnya), input tanggal native, dan pencarian + filter bulan di tab Transaksi.
- **Anggaran bulanan** — batas pengeluaran per kategori dengan progress bar, indikator *sisa harian* (≈ Rp X/hari), dan peringatan saat mendekati atau melebihi batas.
- **Transaksi berulang** — gaji dan tagihan bulanan masuk otomatis saat bulan berganti.
- **Tema terang/gelap/sistem** — token warna yang sama, dua palet konsisten; favicon web ikut menyesuaikan mode gelap browser.
- **Data &amp; pencadangan** — ekspor/impor JSON dan CSV, pulihkan otomatis dari cadangan saat instal ulang.
- **Aksesibilitas** — label, peran, dan urutan fokus untuk layar modal dan tab; hormati *reduced motion*.
- **Onboarding** — alur singkat untuk pengguna baru (bisa dilewati).

## Teknologi

| | |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 57) + [React Native](https://reactnative.dev) 0.86 |
| Navigasi | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| Bahasa | TypeScript (strict) |
| State & storage | React Context + AsyncStorage (offline, tanpa backend) |
| Validasi | [Zod](https://zod.dev) |
| Font | Plus Jakarta Sans (via `@expo-google-fonts`) |
| Desain | Design system bone–charcoal–amber — lihat [`DESIGN.md`](DESIGN.md) |

## Menjalankan

Butuh Node.js 20+ dan [pnpm](https://pnpm.io).

```bash
pnpm install
```

Jalankan di platform pilihan:

```bash
pnpm start          # Expo dev server (pilih platform di terminal)
pnpm web            # browser (localhost:8081)
pnpm android        # emulator/perangkat Android
pnpm ios            # simulator iOS
```

## Skrip

| Skrip | Fungsi |
|---|---|
| `pnpm typecheck` | `tsc --noEmit` — cek tipe |
| `pnpm test` | unit test (Vitest) |
| `pnpm test:coverage` | unit test + laporan coverage |
| `pnpm test:e2e` | end-to-end (Playwright, web) |
| `npx expo export --platform web` | build statis web ke `dist/` |

## Struktur

```
app/                  # layar & navigasi (expo-router)
src/components/       # komponen UI bersama (HeroCard, MonthNavigator, …)
src/features/         # logika domain: transaksi, anggaran, berulang, tema
src/storage/          # penyimpanan AsyncStorage + cadangan
src/theme/            # token desain: warna, tipografi, jarak, shadow
e2e/                  # spec Playwright
DESIGN.md             # dokumentasi design system
```

## Lisensi

[MIT](LICENSE)
