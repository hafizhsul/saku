import AsyncStorage from "@react-native-async-storage/async-storage"
import { z } from "zod"

export const SETTINGS_STORAGE_KEY = "bendahara.settings.v1"

const SettingsSchema = z
  .object({
    theme: z.enum(["system", "light", "dark"]),
  })
  .readonly()

export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings: Settings = { theme: "light" }

export class SettingsStorageError extends Error {
  readonly name = "SettingsStorageError"

  constructor(readonly operation: "read" | "write", cause: unknown) {
    super(`Unable to ${operation} settings`, { cause })
  }
}

export async function loadSettings(): Promise<Settings> {
  try {
    const serialized = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY)
    if (serialized === null) {
      return defaultSettings
    }

    const rawValue: unknown = JSON.parse(serialized)
    const parsed = SettingsSchema.safeParse(rawValue)
    return parsed.success ? parsed.data : defaultSettings
  } catch (error) {
    if (error instanceof SettingsStorageError) {
      throw error
    }

    throw new SettingsStorageError("read", error)
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    if (error instanceof SettingsStorageError) {
      throw error
    }

    throw new SettingsStorageError("write", error)
  }
}
