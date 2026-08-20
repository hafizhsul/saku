import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Aplikasi menargetkan pengguna Indonesia (WIB); test tanggal mengasumsikan
    // UTC+7. Tetapkan timezone agar deterministik di runner mana pun (CI = UTC).
    env: { TZ: "Asia/Jakarta" },
  },
})
