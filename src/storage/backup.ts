import AsyncStorage from "@react-native-async-storage/async-storage"
import { File, Paths } from "expo-file-system"
import { Platform } from "react-native"

import type { BackupPayload } from "../utils/backup"
import { BUDGETS_STORAGE_KEY, saveBudgets } from "./budgets"
import { RECURRING_STORAGE_KEY, saveRecurringDefinitions } from "./recurring"
import { SETTINGS_STORAGE_KEY, saveSettings } from "./settings"
import { TRANSACTIONS_STORAGE_KEY, saveTransactions } from "./transactions"

export const BACKUP_MIRROR_KEY = "bendahara.backup.mirror.v1"
export const AUTO_RESTORE_MARKER_KEY = "bendahara.backup.autoRestored.v1"
export const BACKUP_SETTINGS_KEY = "bendahara.backup.settings.v1"
export const BACKUP_FILE_NAME = "bendahara-cadangan.json"

export class BackupStorageError extends Error {
  readonly name = "BackupStorageError"

  constructor(message: string) {
    super(message)
  }
}

type BackupSettings = { readonly autoRestore: boolean }

export async function loadBackupSettings(): Promise<BackupSettings> {
  try {
    const serialized = await AsyncStorage.getItem(BACKUP_SETTINGS_KEY)
    if (serialized === null) {
      return { autoRestore: true }
    }

    const raw: unknown = JSON.parse(serialized)
    if (typeof raw === "object" && raw !== null && "autoRestore" in raw && typeof (raw as { autoRestore: unknown }).autoRestore === "boolean") {
      return { autoRestore: (raw as { autoRestore: boolean }).autoRestore }
    }

    return { autoRestore: true }
  } catch {
    return { autoRestore: true }
  }
}

export async function saveBackupSettings(settings: BackupSettings): Promise<void> {
  await AsyncStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings))
}

/**
 * Sumber data untuk auto-restore. Mirror disimpan di AsyncStorage (web) dan
 * sebagai file di document directory (native). Saat instal ulang, file ini
 * ikut dipulihkan oleh backup sistem (Android Auto Backup / iCloud), lalu
 * dipakai untuk mengisi ulang seluruh data.
 */
export async function writeAutoRestoreMirror(json: string): Promise<void> {
  try {
    await AsyncStorage.setItem(BACKUP_MIRROR_KEY, json)
  } catch {
    // Non-fatal; file mirror native tetap ditulis di bawah.
  }

  if (Platform.OS === "web") {
    return
  }

  const file = new File(Paths.document, BACKUP_FILE_NAME)
  if (file.exists) {
    file.delete()
  }
  file.create()
  file.write(json)
}

export async function readAutoRestoreMirror(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(BACKUP_MIRROR_KEY)
  if (stored !== null) {
    return stored
  }

  if (Platform.OS === "web") {
    return null
  }

  try {
    const file = new File(Paths.document, BACKUP_FILE_NAME)
    return file.exists ? await file.text() : null
  } catch {
    return null
  }
}

export async function hasAnyStoredData(): Promise<boolean> {
  const keys = [TRANSACTIONS_STORAGE_KEY, BUDGETS_STORAGE_KEY, RECURRING_STORAGE_KEY, SETTINGS_STORAGE_KEY]
  const found = await AsyncStorage.getMany(keys)
  return keys.some((key) => found[key] !== null)
}

export async function writeRestoredData(payload: BackupPayload): Promise<void> {
  await saveTransactions(payload.transactions)
  await saveBudgets(payload.budgets)
  await saveRecurringDefinitions(payload.recurring)
  await saveSettings(payload.settings)
}

export async function hasAutoRestoreMarker(): Promise<boolean> {
  return (await AsyncStorage.getItem(AUTO_RESTORE_MARKER_KEY)) !== null
}

export async function markAutoRestored(): Promise<void> {
  await AsyncStorage.setItem(AUTO_RESTORE_MARKER_KEY, new Date().toISOString())
}
