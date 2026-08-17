import { expect, test } from "@playwright/test"

// Konteks e2e segar: tanpa inisialisasi localStorage, onboarding tampil pertama kali.
async function openOnboarding(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/")
  await expect(page.getByText("Catat tanpa ribet", { exact: true })).toBeVisible({ timeout: 120_000 })
}

test("onboarding selesai membawa ke Beranda dan tidak tampil lagi", async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole("button", { name: "Lanjut" }).click()
  await expect(page.getByText("Kendalikan anggaran", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Lanjut" }).click()
  await expect(page.getByText("Otomatiskan tagihan", { exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Mulai mencatat" }).click()

  // Beranda dengan aksi utama tambah transaksi.
  await expect(page.getByRole("button", { name: "Tambah transaksi" })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible()

  // Tandai onboarding tersimpan: buka ulang langsung ke Beranda.
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Tambah transaksi" })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText("Catat tanpa ribet", { exact: true })).toBeHidden()
})

test("onboarding bisa dilewati langsung", async ({ page }) => {
  await openOnboarding(page)

  await page.getByRole("button", { name: "Lewati onboarding" }).click()

  await expect(page.getByRole("button", { name: "Tambah transaksi" })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByText("Belum ada transaksi", { exact: true })).toBeVisible()
})
