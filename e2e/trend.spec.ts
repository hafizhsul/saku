import { expect, test } from "@playwright/test"

import { addTransaction, openHome, previousMonthPaperDate } from "./helpers"

test("analisis menampilkan total saldo dan tren mingguan", async ({ page }) => {
  await openHome(page)

  await addTransaction(page, { type: "income", amount: "2000000", date: previousMonthPaperDate(), note: "Bonus proyek" })

  await page.getByText("Analisis", { exact: true }).first().click()
  await expect(page.getByText("Total Saldo Tergabung", { exact: true })).toBeVisible()
  // Saldo hero di kartu Analisis (Beranda masih ter-mount di bawah, punya angka saldo juga).
  const balanceCard = page.getByText("Total Saldo Tergabung", { exact: true }).locator("..")
  await expect(balanceCard.getByText("Rp 2.000.000", { exact: true })).toBeVisible()

  await expect(page.getByText("Tren Pengeluaran", { exact: true })).toBeVisible()
  await expect(page.getByText("Total Minggu Ini", { exact: true })).toBeVisible()

  await expect(page.getByText("Saku Insight", { exact: true })).toBeVisible()
})