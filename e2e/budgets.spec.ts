import { expect, test } from "@playwright/test"

import { openHome } from "./helpers"

test("anggaran kategori dibuat, diedit, dan dihapus", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Alokasi anggaran" }).click()
  await expect(page.getByText("Atur anggaran", { exact: true })).toBeVisible()

  // Chip "Sisa bulan ini" di kartu hero: bukti nilai anggaran yang unik dan terlihat.
  const remainingChip = page.getByText("Sisa bulan ini", { exact: true }).locator("..")

  // Buat anggaran baru.
  await page.getByRole("button", { name: "Tambah anggaran" }).click()
  await expect(page.getByText("Pilih kategori", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Transportasi" }).click()
  await page.getByLabel("Nominal anggaran", { exact: true }).fill("500000")
  await page.getByRole("button", { name: "Tambah", exact: true }).click()
  await expect(page.getByLabel("Nominal anggaran", { exact: true })).toBeHidden()
  // Baris anggaran punya tombol aksi unik di layar Atur anggaran.
  await expect(page.getByRole("button", { name: "Edit anggaran Transportasi" })).toBeVisible()
  await expect(remainingChip.getByText("Rp 500.000", { exact: true })).toBeVisible()

  // Ubah batasnya.
  await page.getByRole("button", { name: "Edit anggaran Transportasi" }).click()
  await expect(page.getByText("Edit anggaran", { exact: true })).toBeVisible()
  await page.getByLabel("Nominal anggaran", { exact: true }).fill("600000")
  await page.getByRole("button", { name: "Simpan", exact: true }).click()
  await expect(page.getByLabel("Nominal anggaran", { exact: true })).toBeHidden()
  await expect(remainingChip.getByText("Rp 600.000", { exact: true })).toBeVisible()

  // Hapus anggaran.
  await page.getByRole("button", { name: "Hapus anggaran Transportasi" }).click()
  await expect(page.getByText("Belum ada anggaran", { exact: true })).toBeVisible()
})
