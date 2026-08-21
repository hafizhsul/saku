import { expect, test } from "@playwright/test"

// Alur auth nyata lewat auth server dev: daftar → keluar → masuk ulang.
test("daftar, keluar, dan masuk ulang lewat layar autentikasi", async ({ page }) => {
  const email = `e2e-${Date.now()}@saku-test.id`
  const password = "sandi-rahasia-123"

  await page.addInitScript(() => {
    try {
      localStorage.setItem("bendahara.onboarding.v1", "done")
    } catch {
      // Storage tidak tersedia; onboarding bisa dilewati manual.
    }
  })

  await page.goto("/")
  await page.getByText("Selamat Datang", { exact: true }).waitFor({ timeout: 120_000 })

  // Daftar akun baru.
  await page.getByText("Daftar Sekarang", { exact: true }).click()
  await page.getByLabel("Nama").fill("Pengguna Uji")
  await page.getByLabel("Email").fill(email)
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password)
  await page.getByRole("button", { name: "Daftar Sekarang" }).click()

  // Beranda tampil dengan sapaan nama depan.
  await expect(page.getByText("Halo, Pengguna")).toBeVisible({ timeout: 30_000 })

  // Keluar.
  await page.getByText("Profil", { exact: true }).first().click()
  await page.getByText("Keluar", { exact: true }).first().click()
  await page.getByRole("button", { name: "Konfirmasi keluar" }).click()
  await expect(page.getByText("Selamat Datang", { exact: true })).toBeVisible({ timeout: 15_000 })

  // Masuk ulang dengan akun yang sama.
  await page.getByLabel("Email").fill(email)
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password)
  await page.getByRole("button", { name: "Masuk ke Akun" }).click()
  await expect(page.getByRole("button", { name: "Tambah transaksi" }).first()).toBeVisible({ timeout: 30_000 })
})