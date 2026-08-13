import { expect, type Page } from "@playwright/test"

export async function openHome(page: Page): Promise<void> {
  // Konteks e2e fresh: tandai onboarding selesai agar Beranda langsung tampil.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("bendahara.onboarding.v1", "done")
    } catch {
      // Storage tidak tersedia di konteks ini; onboarding tetap bisa dilewati manual.
    }
  })
  await page.goto("/")
  await expect(page.getByText("Saku", { exact: true }).first()).toBeVisible({ timeout: 120_000 })
}

// Input tanggal web memakai <input type="date"> native (format YYYY-MM-DD).
export function formatWebDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function previousMonthDate(): string {
  const now = new Date()
  return formatWebDate(new Date(now.getFullYear(), now.getMonth() - 1, 15))
}

export async function addTransaction(
  page: Page,
  options: { readonly type: "income" | "expense"; readonly amount: string; readonly date?: string; readonly note?: string },
): Promise<void> {
  await page.getByRole("button", { name: "Tambah transaksi" }).first().click()
  await page.getByRole("tab", { name: options.type === "income" ? "Pemasukan" : "Pengeluaran" }).click()
  await page.getByLabel("Nominal transaksi", { exact: true }).fill(options.amount)
  if (options.date !== undefined) {
    await page.getByLabel("Tanggal transaksi", { exact: true }).fill(options.date)
  }
  if (options.note !== undefined) {
    await page.getByLabel("Catatan transaksi", { exact: true }).fill(options.note)
  }
  await page.getByRole("button", { name: "Simpan transaksi" }).click()
  await expect(page.getByLabel("Nominal transaksi", { exact: true })).toBeHidden({ timeout: 30_000 })
}

export async function openDataScreen(page: Page): Promise<void> {
  await page.getByText("Transaksi", { exact: true }).first().click()
  await page.getByRole("button", { name: "Kelola data transaksi" }).click()
  await expect(page.getByText("Kelola data", { exact: true })).toBeVisible()
}

export function hasBackgroundColor(page: Page, color: string): Promise<boolean> {
  return page.evaluate((expected) => {
    return Array.from(document.querySelectorAll("*")).some((element) => {
      return getComputedStyle(element).backgroundColor === expected
    })
  }, color)
}
