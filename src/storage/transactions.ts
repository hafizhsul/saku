import AsyncStorage from "@react-native-async-storage/async-storage"

import {
  parseStoredTransactions,
  type Transaction,
} from "../features/transactions/types"

export const TRANSACTIONS_STORAGE_KEY = "bendahara.transactions.v1"

type StorageOperation = "read" | "write"

export class TransactionStorageError extends Error {
  readonly name = "TransactionStorageError"

  constructor(readonly operation: StorageOperation, cause: unknown) {
    super(`Unable to ${operation} transactions`, { cause })
  }
}

export async function loadTransactions(): Promise<readonly Transaction[]> {
  try {
    const serialized = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY)
    if (serialized === null) {
      return []
    }

    const rawValue: unknown = JSON.parse(serialized)
    return parseStoredTransactions(rawValue)
  } catch (error) {
    if (error instanceof TransactionStorageError) {
      throw error
    }

    throw new TransactionStorageError("read", error)
  }
}

export async function saveTransactions(transactions: readonly Transaction[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions))
  } catch (error) {
    if (error instanceof TransactionStorageError) {
      throw error
    }

    throw new TransactionStorageError("write", error)
  }
}
