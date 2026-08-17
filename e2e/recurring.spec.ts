import { expect, test } from "@playwright/test"

import { openHome } from "./helpers"

test("transaksi berulang tersimpan, tidak membuat transaksi bulan ini, dan bertahan", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Transaksi berulang" }).click()
  await expect(page.getByRole("button", { name: "Tambah transaksi berulang" })).toBeVisible()
  await page.getByRole("button", { name: "Tambah transaksi berulang" }).click()

  await page.getByRole("tab", { name: "Pemasukan" }).click()
  await page.getByLabel("Nominal transaksi berulang", { exact: true }).fill("6000000")
  await page.getByLabel("Tanggal jatuh tempo", { exact: true }).fill("1")
  await page.getByLabel("Catatan transaksi berulang", { exact: true }).fill("Gaji bulanan")
  await page.getByRole("button", { name: "Simpan", exact: true }).click()

  await expect(page.getByLabel("Nominal transaksi berulang", { exact: true })).toBeHidden()
  await expect(page.getByText("Gaji bulanan", { exact: true })).toBeVisible()
  await expect(page.getByText("Gaji · tiap tanggal 1", { exact: true })).toBeVisible()

  // Kembali ke Beranda: belum ada transaksi yang dibuat otomatis bulan ini.
  await page.getByRole("button", { name: "Tutup transaksi berulang" }).click()
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible()

  // Buka ulang: definisi bertahan dan tetap tidak menambah transaksi.
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Tambah transaksi" }).first()).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Transaksi berulang" }).click()
  await expect(page.getByText("Gaji bulanan", { exact: true })).toBeVisible()
})
