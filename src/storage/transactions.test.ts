import AsyncStorage from "@react-native-async-storage/async-storage"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TransactionIdSchema, type Transaction } from "../features/transactions/types"
import {
  TRANSACTIONS_STORAGE_KEY,
  TransactionStorageError,
  loadTransactions,
  saveTransactions,
} from "./transactions"

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}))

const mockedGetItem = vi.mocked(AsyncStorage.getItem)
const mockedSetItem = vi.mocked(AsyncStorage.setItem)

const transaction: Transaction = {
  id: TransactionIdSchema.parse("storage-transaction"),
  type: "expense",
  amount: 45_000,
  category: "Makan & Minum",
  date: "2026-08-12T12:00:00.000Z",
}

describe("transaction storage boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns an empty collection when the storage key is absent", async () => {
    mockedGetItem.mockResolvedValueOnce(null)

    const result = await loadTransactions()

    expect(result).toEqual([])
    expect(mockedGetItem).toHaveBeenCalledWith(TRANSACTIONS_STORAGE_KEY)
  })

  it("round-trips valid transactions through JSON storage", async () => {
    mockedGetItem.mockResolvedValueOnce(JSON.stringify([transaction]))

    const loaded = await loadTransactions()
    await saveTransactions([transaction])

    expect(loaded).toEqual([transaction])
    expect(mockedSetItem).toHaveBeenCalledWith(
      TRANSACTIONS_STORAGE_KEY,
      JSON.stringify([transaction]),
    )
  })

  it("returns a typed error when stored JSON cannot be parsed", async () => {
    mockedGetItem.mockResolvedValueOnce("not-json")

    await expect(loadTransactions()).rejects.toBeInstanceOf(TransactionStorageError)
  })

  it("ignores stored JSON with an invalid transaction shape", async () => {
    mockedGetItem.mockResolvedValueOnce(JSON.stringify([{ amount: "not-a-number" }]))

    await expect(loadTransactions()).resolves.toEqual([])
  })

  it("returns a typed error when writing to storage fails", async () => {
    mockedSetItem.mockRejectedValueOnce(new Error("storage unavailable"))

    await expect(saveTransactions([transaction])).rejects.toMatchObject({
      name: "TransactionStorageError",
      operation: "write",
    })
  })
})
