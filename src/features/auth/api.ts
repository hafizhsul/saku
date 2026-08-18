import Constants from "expo-constants"

// Default untuk dev: pakai host server Metro (hostUri) agar perangkat fisik
// dan emulator bisa menjangkau server auth di mesin yang sama (bukan
// localhost — itu menunjuk ke perangkat itu sendiri).
// Produksi: wajib set EXPO_PUBLIC_API_URL ke HTTPS.
function defaultBaseUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(":")[0]
  return host ? `http://${host}:4000` : "http://localhost:4000"
}

export const API_BASE_URL: string =
  (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined) ?? defaultBaseUrl()
