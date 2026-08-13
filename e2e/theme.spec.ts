import { expect, test } from "@playwright/test"

import { hasBackgroundColor, openHome } from "./helpers"

test("tema gelap diterapkan dari pengaturan dan bertahan setelah buka ulang", async ({ page }) => {
  await openHome(page)

  await page.getByRole("button", { name: "Pengaturan tampilan" }).click()
  await expect(page.getByText("Tampilan", { exact: true })).toBeVisible()

  await page.getByRole("tab", { name: "Gelap" }).click()
  await expect.poll(() => hasBackgroundColor(page, "rgb(23, 25, 24)")).toBe(true)

  // Preferensi tersimpan di storage: buka ulang, palet tetap gelap.
  await page.goto("/")
  await expect(page.getByText("Saku", { exact: true }).first()).toBeVisible({ timeout: 120_000 })
  await expect.poll(() => hasBackgroundColor(page, "rgb(23, 25, 24)")).toBe(true)

  // Kembali ke terang.
  await page.getByRole("button", { name: "Pengaturan tampilan" }).click()
  await page.getByRole("tab", { name: "Terang" }).click()
  await expect.poll(() => hasBackgroundColor(page, "rgb(247, 246, 243)")).toBe(true)
})
