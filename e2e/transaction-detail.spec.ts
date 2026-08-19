import { expect, test } from "@playwright/test"

import { addTransaction, openHome } from "./helpers"

test("detail transaksi menampilkan informasi dan bisa diedit", async ({ page }) => {
  await openHome(page)
  await addTransaction(page, { type: "expense", amount: "25000", note: "Ojek ke kantor" })

  // Buka detail dari baris transaksi terbaru di Beranda.
  await page.getByText("Ojek ke kantor", { exact: true }).click()
  await expect(page.getByText("Detail Saku", { exact: true })).toBeVisible()
  await expect(page.getByLabel(/Pengeluaran, - Rp 25\.000/)).toBeVisible()
  // Kategori default "Makan & Minum" (home tersembunyi juga punya baris kategori, jadi .last()).
  await expect(page.getByText("Makan & Minum", { exact: true }).last()).toBeVisible()
  // Catatan muncul di baris detail (home yang tersembunyi ikut ter-mount, jadi .last()).
  await expect(page.getByText("Ojek ke kantor", { exact: true }).last()).toBeVisible()

  // Edit: form terisi nilai lama, lalu ubah nominal dan catatan.
  await page.getByRole("button", { name: "Edit transaksi" }).click()
  await expect(page.getByText("EDIT CATATAN", { exact: true })).toBeVisible()
  await expect(page.getByLabel("Nominal transaksi", { exact: true })).toHaveValue("25.000")
  await page.getByLabel("Nominal transaksi", { exact: true }).fill("30000")
  await page.getByLabel("Catatan transaksi", { exact: true }).fill("Ojek ke kantor (revisi)")
  await page.getByRole("button", { name: "Simpan perubahan" }).click()

  // Kembali ke detail: nilai baru tampil.
  await expect(page.getByLabel("Nominal transaksi", { exact: true })).toBeHidden({ timeout: 30_000 })
  await expect(page.getByLabel(/Pengeluaran, - Rp 30\.000/)).toBeVisible()
  await expect(page.getByText("Ojek ke kantor (revisi)", { exact: true }).last()).toBeVisible()
})

test("transaksi bisa dihapus dari layar detail", async ({ page }) => {
  await openHome(page)
  await addTransaction(page, { type: "expense", amount: "15000", note: "Jajan di kantin" })

  await page.getByText("Jajan di kantin", { exact: true }).click()
  await expect(page.getByText("Detail Saku", { exact: true })).toBeVisible()

  // Konfirmasi lalu hapus.
  await page.getByRole("button", { name: "Hapus transaksi" }).click()
  await expect(page.getByText("Hapus transaksi ini?", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Hapus transaksi" }).click()

  // Kembali ke Beranda yang kosong lagi.
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible({ timeout: 30_000 })
})
