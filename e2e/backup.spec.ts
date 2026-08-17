import { readFileSync } from "node:fs"

import { expect, test } from "@playwright/test"

import { addTransaction, hasBackgroundColor, openDataScreen, openHome } from "./helpers"

const MIRROR_KEY = "bendahara.backup.mirror.v1"

test("ekspor JSON mengunduh file cadangan yang valid", async ({ page }) => {
  await openHome(page)
  await addTransaction(page, { type: "expense", amount: "50000", note: "Makan siang" })
  await openDataScreen(page)

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Ekspor JSON" }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toMatch(/^saku-cadangan-\d{4}-\d{2}\.json$/)
  const downloadPath = await download.path()
  expect(downloadPath).not.toBeNull()
  const parsed: unknown = JSON.parse(readFileSync(downloadPath as string, "utf-8"))
  expect(parsed).toMatchObject({ schemaVersion: 1 })
  expect((parsed as { transactions: unknown[] }).transactions).toHaveLength(1)
})

test("data kosong dipulihkan otomatis dari cadangan saat peluncuran", async ({ page }) => {
  // Simulasikan instal ulang: semua data kosong, tetapi file cadangan
  // (mirror) tersedia di perangkat seperti yang dipulihkan oleh sistem.
  const backupJson = JSON.stringify({
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    transactions: [
      {
        id: "e2e-auto-restore",
        type: "expense",
        amount: 45000,
        category: "Makan & Minum",
        note: "Makan siang pulih",
        date: new Date().toISOString(),
      },
    ],
    budgets: { "Makan & Minum": 300000 },
    recurring: [],
    settings: { theme: "dark" },
  })

  await page.addInitScript(
    ([key, value]) => {
      localStorage.setItem(key, value)
    },
    [MIRROR_KEY, backupJson] as const,
  )

  await openHome(page)

  // Transaksi dari cadangan tampil di Beranda.
  await expect(page.getByText("Makan siang pulih", { exact: true })).toBeVisible()

  // Pengaturan ikut dipulihkan: tema gelap aktif.
  await expect.poll(() => hasBackgroundColor(page, "rgb(22, 24, 26)")).toBe(true)
})
