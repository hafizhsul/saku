import { expect, test } from "@playwright/test"

import { openHome } from "./helpers"

// Alokasi anggaran lewat bottom-sheet di Beranda: tambah, geser, simpan,
// hapus (geser ke nol).
test("alokasi anggaran diatur lewat sheet", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Alokasi anggaran" }).click()
  await expect(page.getByText("Sesuaikan Alokasi Anggaran", { exact: true })).toBeVisible()

  // Tambah kategori Transportasi (default Rp 100.000).
  await page.getByRole("button", { name: "Tambah anggaran Transportasi" }).click()
  const track = page.getByLabel("Ubah alokasi Transportasi", { exact: true })
  await expect(track).toBeVisible()
  await expect(page.getByLabel("Nilai alokasi Transportasi")).toHaveText("Rp 100.000")

  // Geser ke tengah track → Rp 1.500.000 (maks 3jt, step 50rb).
  // locator.click + position: scroll otomatis, koordinat tidak basi.
  const trackBox = await track.boundingBox()
  expect(trackBox).not.toBeNull()
  await track.click({ position: { x: trackBox!.width * 0.5, y: 22 } })
  await expect(page.getByLabel("Nilai alokasi Transportasi")).toHaveText("Rp 1.500.000")

  // Simpan lalu buka ulang: nilai bertahan.
  await page.getByRole("button", { name: "Simpan Alokasi Baru" }).click()
  await expect(page.getByText("Sesuaikan Alokasi Anggaran", { exact: true })).toBeHidden({ timeout: 15_000 })
  await page.getByRole("button", { name: "Alokasi anggaran" }).click()
  await expect(page.getByLabel("Nilai alokasi Transportasi")).toHaveText("Rp 1.500.000", { timeout: 15_000 })

  // Geser ke ujung kiri (nol) lalu simpan = hapus.
  const track2 = page.getByLabel("Ubah alokasi Transportasi", { exact: true })
  await track2.click({ position: { x: 2, y: 22 } })
  await expect(page.getByLabel("Nilai alokasi Transportasi")).toHaveText("Rp 0")
  await page.getByRole("button", { name: "Simpan Alokasi Baru" }).click()
  await expect(page.getByText("Sesuaikan Alokasi Anggaran", { exact: true })).toBeHidden({ timeout: 15_000 })
  await page.getByRole("button", { name: "Alokasi anggaran" }).click()
  await expect(page.getByText("Sesuaikan Alokasi Anggaran", { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole("button", { name: "Tambah anggaran Transportasi" })).toBeVisible({ timeout: 15_000 })
})
