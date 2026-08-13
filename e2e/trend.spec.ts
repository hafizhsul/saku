import { expect, test } from "@playwright/test"

import { addTransaction, openHome, previousMonthDate } from "./helpers"

test("tren 6 bulan menampilkan netto bulan sebelumnya", async ({ page }) => {
  await openHome(page)

  await addTransaction(page, { type: "income", amount: "2000000", date: previousMonthDate(), note: "Bonus proyek" })

  await expect(page.getByText("Tren 6 bulan", { exact: true })).toBeVisible()
  await expect(page.getByText("Netto per bulan", { exact: true })).toBeVisible()
  await expect(page.getByText("Rp 2 jt", { exact: true })).toBeVisible()
})
