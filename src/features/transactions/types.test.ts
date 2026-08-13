import { describe, expect, it } from "vitest"

import {
  TransactionIdSchema,
  createTransaction,
  parseStoredTransactions,
  updateTransaction,
} from "./types"

describe("transaction domain values", () => {
  it("creates a transaction with a generated branded id", () => {
    const transaction = createTransaction({
      type: "income",
      amount: 1_000_000,
      category: "Gaji",
      date: "2026-08-12T12:00:00.000Z",
      note: "  Gaji bulanan  ",
    })

    expect(TransactionIdSchema.safeParse(transaction.id).success).toBe(true)
    expect(transaction.note).toBe("Gaji bulanan")
  })

  it("rejects invalid drafts at the domain boundary", () => {
    expect(() => createTransaction({
      type: "expense",
      amount: 0,
      category: "Makan & Minum",
      date: "2026-08-12T12:00:00.000Z",
    })).toThrow()
  })

  it("parses valid stored transactions and falls back for invalid values", () => {
    const transaction = {
      id: "stored-transaction",
      type: "expense",
      amount: 10_000,
      category: "Lainnya",
      date: "2026-08-12T12:00:00.000Z",
    }

    expect(parseStoredTransactions([transaction])).toEqual([transaction])
    expect(parseStoredTransactions({ invalid: true })).toEqual([])
  })

  it("updates a transaction while keeping its id", () => {
    const original = createTransaction({
      type: "expense",
      amount: 50_000,
      category: "Makan & Minum",
      date: "2026-08-10T12:00:00.000Z",
      note: "Makan siang",
    })

    const updated = updateTransaction(original, {
      type: "income",
      amount: 2_500_000,
      category: "Gaji",
      date: "2026-08-11T12:00:00.000Z",
    })

    expect(updated.id).toBe(original.id)
    expect(updated).toMatchObject({
      type: "income",
      amount: 2_500_000,
      category: "Gaji",
      date: "2026-08-11T12:00:00.000Z",
    })
    expect(updated.note).toBeUndefined()
  })

  it("rejects invalid updates at the domain boundary", () => {
    const original = createTransaction({
      type: "expense",
      amount: 50_000,
      category: "Makan & Minum",
      date: "2026-08-10T12:00:00.000Z",
    })

    expect(() => updateTransaction(original, {
      type: "expense",
      amount: -1,
      category: "Makan & Minum",
      date: "2026-08-10T12:00:00.000Z",
    })).toThrow()
  })
})
