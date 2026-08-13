import AsyncStorage from "@react-native-async-storage/async-storage"

export const ONBOARDING_STORAGE_KEY = "bendahara.onboarding.v1"

export async function getOnboardingDone(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)) === "done"
  } catch {
    return false
  }
}

export async function setOnboardingDone(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "done")
  } catch {
    // Flag gagal disimpan: onboarding akan tampil lagi di peluncuran berikutnya.
  }
}
