import { expect, test } from "@playwright/test"

import { hasBackgroundColor, openHome } from "./helpers"

test("tema gelap diterapkan dari pengaturan dan bertahan setelah buka ulang", async ({ page }) => {
  await openHome(page)

  await page.getByText("Profil", { exact: true }).first().click()
  const temaRow = page.getByText("Tema", { exact: true })
  await expect(temaRow).toBeVisible()

  // Baris Tema memutar preferensi: Sistem → Terang → Gelap. Default instalasi
  // baru adalah Terang, jadi satu klik langsung menuju Gelap.
  await temaRow.click()
  await expect.poll(() => hasBackgroundColor(page, "rgb(22, 24, 26)")).toBe(true)

  // Preferensi tersimpan di storage: buka ulang, palet tetap gelap.
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Tambah transaksi" }).first()).toBeVisible({ timeout: 120_000 })
  await expect.poll(() => hasBackgroundColor(page, "rgb(22, 24, 26)")).toBe(true)

  // Kembali ke terang: Gelap → Sistem → Terang.
  await page.getByText("Profil", { exact: true }).first().click()
  await temaRow.click()
  await temaRow.click()
  await expect.poll(() => hasBackgroundColor(page, "rgb(244, 245, 244)")).toBe(true)
})