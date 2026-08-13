# Desain MVP Pencatatan Keuangan

Tanggal: 2026-08-12

## 1. Tujuan

Membuat aplikasi mobile Expo untuk satu pengguna yang ingin mencatat pemasukan dan pengeluaran secara cepat, melihat saldo dan ringkasan bulan berjalan, serta menemukan kembali transaksi setelah aplikasi ditutup dan dibuka ulang.

MVP ini bersifat offline-first. Tidak ada login, sinkronisasi cloud, atau kebutuhan akun.

## 2. Ruang lingkup

### Termasuk

- Penyimpanan transaksi lokal di perangkat.
- Tipe transaksi pemasukan dan pengeluaran.
- Nominal dalam Rupiah.
- Kategori transaksi.
- Tanggal transaksi, default ke hari ini.
- Catatan opsional.
- Saldo berjalan berdasarkan seluruh transaksi.
- Ringkasan pemasukan dan pengeluaran bulan berjalan.
- Daftar transaksi terbaru dan daftar lengkap.
- Filter transaksi berdasarkan semua, pemasukan, atau pengeluaran.
- Empty state saat belum ada transaksi.

### Tidak termasuk

- Login, multi-user, dan cloud sync.
- Rekening atau dompet terpisah.
- Transfer antar-akun.
- Transaksi berulang.
- Anggaran dan notifikasi.
- Ekspor data, backup, dan impor data.
- Grafik kompleks atau laporan lintas periode.

## 3. Pengalaman pengguna

### Beranda

Beranda menampilkan:

1. Header dengan sapaan singkat dan periode bulan aktif.
2. Kartu saldo sebagai elemen visual utama.
3. Dua kartu statistik untuk total pemasukan dan pengeluaran bulan aktif.
4. Ringkasan pengeluaran berdasarkan kategori.
5. Beberapa transaksi terbaru.
6. Tombol tambah transaksi yang mudah dijangkau.

Saldo dihitung sebagai total seluruh pemasukan dikurangi total seluruh pengeluaran. Statistik pemasukan, pengeluaran, dan kategori dibatasi ke bulan aktif.

### Daftar transaksi

Layar transaksi menampilkan semua catatan dari yang terbaru ke terlama. Filter berbentuk chip menyediakan pilihan Semua, Pemasukan, dan Pengeluaran. Setiap baris memperlihatkan ikon kategori, nama kategori, tanggal atau catatan singkat, serta nominal dengan warna semantik.

### Tambah transaksi

Form dibuka sebagai modal melalui tombol tambah. Form berisi:

- Toggle Pemasukan/Pengeluaran.
- Input nominal numerik.
- Pilihan kategori berbentuk chip.
- Pemilih tanggal, default ke hari ini.
- Input catatan opsional.
- Tombol Simpan.

Tombol Simpan nonaktif ketika nominal kosong atau tidak lebih besar dari nol, atau ketika kategori belum dipilih. Setelah berhasil, modal ditutup dan layar asal langsung memperlihatkan data terbaru.

## 4. Model data dan state

```ts
type TransactionType = "income" | "expense";

type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  date: string;
};
```

Tanggal disimpan sebagai string ISO agar konsisten saat diproses dan dipersist. Nominal disimpan sebagai angka positif; tipe transaksi menentukan apakah nominal ditambah atau dikurangi dalam selector.

State transaksi dikelola oleh provider lokal berbasis `useReducer`. Provider memuat array transaksi saat aplikasi dibuka, menyediakan aksi penambahan transaksi, dan menulis state terbaru ke AsyncStorage. Tidak ada state management library tambahan.

Key penyimpanan menggunakan versi eksplisit: `bendahara.transactions.v1`. Jika data belum tersedia, state awal adalah array kosong.

Selector murni yang dipakai bersama oleh layar:

- `selectBalance(transactions)`.
- `selectMonthlySummary(transactions, month)`.
- `selectRecentTransactions(transactions, limit)`.
- `selectTransactionsByType(transactions, type)`.
- `selectCategoryBreakdown(transactions, month)`.

## 5. Arsitektur file

```text
app/
  _layout.tsx
  add-transaction.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    transactions.tsx
src/
  components/
    BalanceCard.tsx
    CategoryBreakdown.tsx
    EmptyState.tsx
    StatCard.tsx
    TransactionRow.tsx
  features/transactions/
    types.ts
    reducer.ts
    selectors.ts
    TransactionsProvider.tsx
  storage/
    transactions.ts
  theme/
    index.ts
  utils/
    currency.ts
    date.ts
```

Expo Router menyediakan navigasi tab untuk Beranda dan Transaksi, serta route modal untuk Tambah Transaksi. Komponen presentasi tidak membaca AsyncStorage secara langsung; semua data mengalir melalui provider dan selector.

## 6. Sistem visual

Aplikasi menggunakan gaya “catatan keuangan pribadi yang tenang” dengan fondasi berikut:

- Latar krem terang untuk memberi rasa seperti kertas.
- Kartu putih hangat untuk membedakan kelompok informasi.
- Teks biru-navy gelap untuk kontras dan kesan tepercaya.
- Hijau untuk pemasukan dan saldo positif.
- Terracotta untuk pengeluaran.
- Radius kartu besar, border tipis, dan bayangan rendah.
- Font sistem agar tampilan ringan dan konsisten di Android serta iOS.
- Spacing dan warna didefinisikan sebagai token di `src/theme`, bukan tersebar di layar.

Ukuran target sentuh minimum 44 pt. Semua warna teks dan ikon utama harus memenuhi kontras yang terbaca. Label form tetap terlihat saat field fokus atau berisi.

## 7. Penanganan error

- Kegagalan membaca AsyncStorage mempertahankan state aman di memori dan menampilkan pesan yang bisa dipahami pengguna.
- Kegagalan menulis AsyncStorage tidak menghapus transaksi dari layar; pengguna mendapat pemberitahuan bahwa perubahan belum tersimpan permanen.
- Input nominal yang tidak valid ditolak di batas form.
- State kosong ditangani sebagai kondisi normal, bukan error.

## 8. Verifikasi

### Automated

- TypeScript tanpa error.
- Lint/diagnostik tanpa error pada file yang diubah.
- Unit test untuk selector saldo, ringkasan bulan, filter tipe, breakdown kategori, serta formatter Rupiah.
- Expo export/build untuk target yang tersedia.

### Manual QA

1. Buka aplikasi tanpa data dan pastikan empty state tampil.
2. Tambah pemasukan dan pastikan saldo serta ringkasan berubah.
3. Tambah pengeluaran dan pastikan saldo berkurang dengan benar.
4. Pastikan daftar transaksi mengurutkan data terbaru lebih dulu.
5. Uji filter Semua, Pemasukan, dan Pengeluaran.
6. Tutup lalu buka ulang aplikasi dan pastikan transaksi tetap ada.
7. Uji nominal kosong, nol, dan nominal valid.
8. Periksa layout pada layar kecil dan keyboard saat mengisi form.

## 9. Kriteria penerimaan

MVP dianggap selesai ketika pengguna dapat mencatat pemasukan atau pengeluaran secara offline, melihat saldo dan ringkasan bulan berjalan yang benar, memfilter daftar transaksi, serta menemukan data yang sama setelah aplikasi dibuka ulang. Tidak boleh ada error TypeScript atau build yang berasal dari perubahan implementasi.

