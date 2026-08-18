import { Platform } from "react-native"
import * as SecureStore from "expo-secure-store"

export const AUTH_TOKEN_STORAGE_KEY = "bendahara.auth.token.v1"

// Web: token hidup di cookie httpOnly yang diset server dan dikirim otomatis
// oleh browser — tidak disimpan di JS agar tak bisa dibaca oleh XSS.
// Native: SecureStore (Keychain/Keystore).
export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return null
  }

  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    return
  }

  try {
    await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token)
  } catch {
    // Token gagal disimpan: pengguna akan login ulang di sesi berikutnya.
  }
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    return
  }

  try {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY)
  } catch {
    // Token gagal dihapus: akan ditimpa pada login berikutnya.
  }
}
