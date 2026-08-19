// https://docs.expo.dev/guides/using-eslint/
const { createRequire } = require("node:module")
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")

// server/ adalah proyek Node.js terpisah (CommonJS): butuh globals node,
// bukan browser. globals di-resolve lewat dep eslint-config-expo supaya
// tidak perlu dependency baru.
const requireFromExpo = createRequire(require.resolve("eslint-config-expo/flat"))
const globals = requireFromExpo("globals")

module.exports = defineConfig([
  expoConfig,
  {
    files: ["server/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ignores: ["dist/*", "coverage/*", ".expo/*", ".playwright-cli/*", "output/*", "test-results/*"],
  },
])
