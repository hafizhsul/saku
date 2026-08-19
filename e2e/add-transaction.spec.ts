import { expect, test } from "@playwright/test"

import { formatWebDate, openHome } from "./helpers"

test("form transaksi memvalidasi nominal kosong", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Tambah transaksi" }).click()
  await expect(page.getByText("Tambah Transaksi", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Simpan transaksi" }).click()
  await expect(page.getByText("Masukkan nominal lebih dari 0.", { exact: true })).toBeVisible()
})

test("transaksi pengeluaran lengkap tersimpan dan tampil di Beranda", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Tambah transaksi" }).click()
  await page.getByLabel("Nominal transaksi", { exact: true }).fill("25000")
  await page.getByRole("button", { name: "Transportasi" }).click()
  await page.getByLabel("Tanggal transaksi", { exact: true }).fill(formatWebDate(new Date()))
  await page.getByLabel("Catatan transaksi", { exact: true }).fill("Ojek ke kantor")
  await page.getByRole("button", { name: "Simpan transaksi" }).click()

  // Kembali ke Beranda: catatan tampil di daftar terbaru.
  await expect(page.getByLabel("Nominal transaksi", { exact: true })).toBeHidden({ timeout: 30_000 })
  await expect(page.getByText("Ojek ke kantor", { exact: true })).toBeVisible()
  await expect(page.getByText("- Rp 25.000", { exact: true })).toBeVisible()
})

test("tombol tambah transaksi tersedia di layar Transaksi", async ({ page }) => {
  await openHome(page)

  // Tab Riwayat menampilkan daftar semua transaksi + FAB tambah tetap tersedia.
  await page.getByRole("button", { name: "Riwayat" }).click()
  await expect(page.getByLabel("Cari transaksi", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Tambah transaksi" })).toBeVisible()

  await page.getByRole("button", { name: "Tambah transaksi" }).click()
  await expect(page.getByText("Tambah Transaksi", { exact: true })).toBeVisible()
})
