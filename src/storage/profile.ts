import AsyncStorage from "@react-native-async-storage/async-storage"

export const PROFILE_PHOTO_KEY = "bendahara.profile.photo.v1"

// Foto profil disimpan sebagai data URI (base64) agar satu nilai, portabel
// web & native. ponytail: kompres/resize gambar sebelum simpan bila ukuran
// data URI membengkak.
export async function loadProfilePhoto(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PROFILE_PHOTO_KEY)
  } catch {
    return null
  }
}

export async function saveProfilePhoto(dataUri: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PROFILE_PHOTO_KEY, dataUri)
  } catch {
    // Gagal simpan: foto hanya berlaku sesi ini, dicoba lagi lain kali.
  }
}