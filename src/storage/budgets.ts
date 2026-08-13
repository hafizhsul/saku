import AsyncStorage from "@react-native-async-storage/async-storage"

import { parseStoredBudgets, type BudgetsMap } from "../features/budgets/types"

export const BUDGETS_STORAGE_KEY = "bendahara.budgets.v1"

type StorageOperation = "read" | "write"

export class BudgetsStorageError extends Error {
  readonly name = "BudgetsStorageError"

  constructor(readonly operation: StorageOperation, cause: unknown) {
    super(`Unable to ${operation} budgets`, { cause })
  }
}

export async function loadBudgets(): Promise<BudgetsMap> {
  try {
    const serialized = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY)
    if (serialized === null) {
      return {}
    }

    const rawValue: unknown = JSON.parse(serialized)
    return parseStoredBudgets(rawValue)
  } catch (error) {
    if (error instanceof BudgetsStorageError) {
      throw error
    }

    throw new BudgetsStorageError("read", error)
  }
}

export async function saveBudgets(budgets: BudgetsMap): Promise<void> {
  try {
    await AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(budgets))
  } catch (error) {
    if (error instanceof BudgetsStorageError) {
      throw error
    }

    throw new BudgetsStorageError("write", error)
  }
}
