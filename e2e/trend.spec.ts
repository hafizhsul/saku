import { expect, test } from "@playwright/test"

import { addTransaction, openHome, previousMonthDate } from "./helpers"

test("analisis menampilkan total saldo dan tren mingguan", async ({ page }) => {
  await openHome(page)

  await addTransaction(page, { type: "income", amount: "2000000", date: previousMonthDate(), note: "Bonus proyek" })

  await page.getByText("Analisis", { exact: true }).first().click()
  await expect(page.getByText("Total Saldo Tergabung", { exact: true })).toBeVisible()
  await expect(page.getByText("Rp 2.000.000", { exact: true })).toBeVisible()

  await expect(page.getByText("Tren Pengeluaran", { exact: true })).toBeVisible()
  await expect(page.getByText("Total Minggu Ini", { exact: true })).toBeVisible()

  await expect(page.getByText("Saku Insight", { exact: true })).toBeVisible()
})