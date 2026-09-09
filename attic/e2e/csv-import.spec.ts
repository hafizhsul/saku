import { expect, test } from "@playwright/test"

import { openDataScreen, openHome } from "./helpers"

const VALID_CSV = [
  "id,type,amount,category,note,date",
  "csv-import-1,expense,25000,Transportasi,Ojek ke kantor,2026-08-01T00:00:00.000Z",
  "csv-import-2,income,2000000,Gaji,Gaji bulanan,2026-08-05T00:00:00.000Z",
].join("\n")

async function importCsv(page: import("@playwright/test").Page, content: string): Promise<void> {
  const chooserPromise = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Impor CSV" }).click()
  const chooser = await chooserPromise
  await chooser.setFiles({ name: "transaksi.csv", mimeType: "text/csv", buffer: Buffer.from(content) })
}

test("impor CSV valid menambah transaksi dan menampilkannya di daftar", async ({ page }) => {
  await openHome(page)
  await openDataScreen(page)

  await importCsv(page, VALID_CSV)
  await expect(page.getByText("2 transaksi diimpor, 0 dilewati.", { exact: true })).toBeVisible()

  // Kembali ke daftar transaksi: data impor langsung tampil.
  // (Home dan tab Transaksi sama-sama ter-mount, jadi pakai .first().)
  await page.getByRole("button", { name: "Kembali" }).click()
  await expect(page.getByText("Ojek ke kantor", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Gaji bulanan", { exact: true }).first()).toBeVisible()
})

test("impor CSV tanpa baris valid menampilkan pesan kesalahan", async ({ page }) => {
  await openHome(page)
  await openDataScreen(page)

  const invalidCsv = ["id,type,amount,category,note,date", "x,expense,bukan-angka,Makan & Minum,,2026-08-01T00:00:00.000Z"].join("\n")
  await importCsv(page, invalidCsv)

  await expect(page.getByText("Tidak ada transaksi valid di file tersebut.", { exact: true })).toBeVisible()
})
