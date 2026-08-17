import { expect, test } from "@playwright/test"

import { openHome } from "./helpers"

test("form transaksi berulang memvalidasi nominal dan tanggal jatuh tempo", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Transaksi berulang" }).click()
  await page.getByRole("button", { name: "Tambah transaksi berulang" }).click()

  await page.getByRole("button", { name: "Simpan", exact: true }).click()
  await expect(page.getByText("Masukkan nominal lebih dari 0.", { exact: true })).toBeVisible()

  await page.getByLabel("Nominal transaksi berulang", { exact: true }).fill("100000")
  await page.getByLabel("Tanggal jatuh tempo", { exact: true }).fill("29")
  await page.getByRole("button", { name: "Simpan", exact: true }).click()
  await expect(page.getByText("Tanggal jatuh tempo harus antara 1 dan 28.", { exact: true })).toBeVisible()
})

test("transaksi berulang bisa diedit dari daftar", async ({ page }) => {
  await openHome(page)

  // Buat satu transaksi berulang pengeluaran.
  await page.getByRole("button", { name: "Transaksi berulang" }).click()
  await page.getByRole("button", { name: "Tambah transaksi berulang" }).click()
  await page.getByLabel("Nominal transaksi berulang", { exact: true }).fill("150000")
  await page.getByLabel("Tanggal jatuh tempo", { exact: true }).fill("5")
  await page.getByLabel("Catatan transaksi berulang", { exact: true }).fill("Tagihan listrik")
  await page.getByRole("button", { name: "Simpan", exact: true }).click()
  await expect(page.getByLabel("Nominal transaksi berulang", { exact: true })).toBeHidden()

  // Buka form edit dari baris daftar: nilai lama terisi.
  await page.getByRole("button", { name: /Tagihan listrik, pengeluaran, tiap tanggal 5/ }).click()
  await expect(page.getByText("Edit transaksi berulang", { exact: true })).toBeVisible()
  await expect(page.getByLabel("Nominal transaksi berulang", { exact: true })).toHaveValue("150.000")
  await expect(page.getByLabel("Tanggal jatuh tempo", { exact: true })).toHaveValue("5")
  await expect(page.getByLabel("Catatan transaksi berulang", { exact: true })).toHaveValue("Tagihan listrik")

  // Ubah nominal lalu simpan.
  await page.getByLabel("Nominal transaksi berulang", { exact: true }).fill("175000")
  await page.getByRole("button", { name: "Simpan perubahan" }).click()

  // Kembali ke daftar: nilai baru tampil.
  await expect(page.getByLabel("Nominal transaksi berulang", { exact: true })).toBeHidden({ timeout: 30_000 })
  await expect(page.getByText("- Rp 175.000", { exact: true })).toBeVisible()
  await expect(page.getByText("Tagihan listrik", { exact: true })).toBeVisible()
  await expect(page.getByText("Makan & Minum · tiap tanggal 5", { exact: true })).toBeVisible()
})
