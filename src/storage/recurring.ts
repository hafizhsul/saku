import AsyncStorage from "@react-native-async-storage/async-storage"

import {
  parseStoredRecurringDefinitions,
  type RecurringDefinition,
} from "../features/recurring/types"

export const RECURRING_STORAGE_KEY = "bendahara.recurring.v1"

type StorageOperation = "read" | "write"

export class RecurringStorageError extends Error {
  readonly name = "RecurringStorageError"

  constructor(readonly operation: StorageOperation, cause: unknown) {
    super(`Unable to ${operation} recurring transactions`, { cause })
  }
}

export async function loadRecurringDefinitions(): Promise<readonly RecurringDefinition[]> {
  try {
    const serialized = await AsyncStorage.getItem(RECURRING_STORAGE_KEY)
    if (serialized === null) {
      return []
    }

    const rawValue: unknown = JSON.parse(serialized)
    return parseStoredRecurringDefinitions(rawValue)
  } catch (error) {
    if (error instanceof RecurringStorageError) {
      throw error
    }

    throw new RecurringStorageError("read", error)
  }
}

export async function saveRecurringDefinitions(definitions: readonly RecurringDefinition[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECURRING_STORAGE_KEY, JSON.stringify(definitions))
  } catch (error) {
    if (error instanceof RecurringStorageError) {
      throw error
    }

    throw new RecurringStorageError("write", error)
  }
}
