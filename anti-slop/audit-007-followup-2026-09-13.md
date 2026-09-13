# Audit antislop 007 — follow-up 2026-09-13 (semua 30 diperbaiki)

Pemetaan fix per nomor audit-007. Verifikasi: typecheck PASS, lint PASS,
unit 110/110, server 28/28. e2e tidak dijalankan di sesi ini.

## HIGH

1. Onboarding `DATA LOKAL / Tersimpan di perangkat ini` + badge `Contoh`
   (`app/onboarding.tsx`). Klaim enkripsi/real-time hilang.
2. Settings: `Akun Aktif`, subtitle `Nama & foto profil` / `Ubah kata sandi`
   (`app/(tabs)/settings.tsx:97-127`). Badge verifikasi + KYC/2FA hilang.
3. Placeholder jujur: Bahasa + Bantuan + Privasi berlabel `Segera hadir`;
   `Lupa sandi? (Segera hadir)` (`LoginForm.tsx`). Dead control tanpa label hilang.
4. Nol hex di luar `src/theme` (cek python, total 0). Token baru:
   auth*/warning*/slate*/onAccent/errorOnHero/segment* (light+dark).
   Auth/detail/segmen/form/onboarding/analisis/riwayat ikut mode (R-34).
5. Kontras diukur via python: heroMuted/heroBackground 4.54 (light) / 8.00
   (dark); label nonaktif segmen kini `textSecondary`, bukan slate-di-track.
   Rasio dicatat di audit, bukan klaim.
6. Link `Masuk` onboarding dapat `loginPress` min 44x44 (`onboarding.tsx`).

## MEDIUM

7-8. Alasan visual onboarding ditulis di komentar (motif kantong, ring,
   ikon mockup). Klaim sudah dinetralkan (butir 1).
9. Grid Saku: kartu over-budget memakai `sakuCardOver`
   (latar + border expense). Satu variasi hierarki "perlu perhatian".
10. DESIGN.md: font = Plus Jakarta Sans + alasan R-31 (bukan Inter).
11. Dial MOTION 1 di `src/theme` (`motion.lockPulse`); AuthGate memakai token;
    reduced-motion tetap dihormati.
12. `sakuIconConfig` fallback = satu tone netral + alasan (warna acak dihapus).
13. Peran palet dibekukan di DESIGN.md (R-29): emerald, mint, crimson, amber
    khusus kuota, slate sekunder, tint khusus insight.
14. Motif identitas "tilted pocket" didokumentasikan di DESIGN.md (R-20).

## LOW

15. CTA: `Lanjut ke Saku`, `Mulai catat` (+ e2e spec ikut), `Kelola`,
    `Lihat semua transaksi`.
16. Badge: `Catat dalam 10 detik`, `Ringkasan bulanan nyata`.
17. Sapaan konsisten `Anda` (settings, analisis, riwayat, breakdown).
18. Lihat butir 3.
19. `WebDateInput` fokus web terlihat (outline `colors.focus`).
20. Settings loading memakai skeleton baris, bukan EmptyState generik.
21. Kartu hero onboarding `maxWidth 78%` agar aman di 320px.
22. Komposisi analisis didokumentasikan RHYTHM 2 (tren/alokasi/peringatan/insight beda).
23. `getStorageMessage` disederhanakan + alasan privasi pesan.
24. Selector baru `selectMonthlyTotals/selectBudgetAllocations/selectBudgetImpact`;
    dipakai riwayat/analisis/detail. Duplikasi inline hilang.
25. `currency.ts` impor relatif (alias `@/` hilang).
26-27. `TransactionRow`: label a11y singkat + kata kerja; gaya disabled dihapus
    dari baris non-pressable (+ impor tak terpakai dibersihkan).
28. Modal settings dapat `onDismiss` + komentar Escape web.
29. `formatNativeDate/parseNativeDate/chunkRows` pindah ke `src/utils/dates.ts`
    + 3 unit test baru (110 total, sebelumnya 107).
30. Placeholder pencarian presisi: `Cari kategori atau catatan...`.

## Delivery Gate: PASS (dengan catatan)

- Block 1 Hard Gate: PASS (tanpa run/build/click-through sesi ini).
- Block 2 Purpose-Gate: PASS (alasan tertulis di kode/DESIGN.md).
- Block 3 Liveliness: ENERGY 1 / RHYTHM 2 / MOTION 1; focal point hero +
  aksen emerald + motif kantong miring.
- Block 4 Craftsmanship: PASS statis; e2e/bukti visual menyusul bila diminta.
