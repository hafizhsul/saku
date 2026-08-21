import { defineConfig, devices } from "@playwright/test"

const PORT = 8083
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    navigationTimeout: 180_000,
    actionTimeout: 30_000,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `npx expo start --port ${PORT} --web`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      // File pengguna dipisahkan dari data lokal agar suite tak menumpuk akun.
      command: `USERS_FILE=${process.env.E2E_USERS_FILE ?? "/tmp/saku-e2e-users.json"} node server/auth-server.js`,
      port: 4000,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
