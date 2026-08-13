import { describe, expect, it } from "vitest"

import { createTransaction } from "../features/transactions/types"
import { parseTransactionsCsv, serializeTransactionsToCsv } from "./csv"

describe("transaction csv", () => {
  it("round-trips transactions through serialize and parse", () => {
    const transactions = [
      createTransaction({
        type: "expense",
        amount: 85_000,
        category: "Makan & Minum",
        date: "2026-08-11T12:00:00.000Z",
        note: "Makan siang, bersama tim",
      }),
      createTransaction({
        type: "income",
        amount: 6_500_000,
        category: "Gaji",
        date: "2026-08-01T12:00:00.000Z",
      }),
    ]

    const { rows, skipped } = parseTransactionsCsv(serializeTransactionsToCsv(transactions))

    expect(skipped).toBe(0)
    expect(rows).toHaveLength(2)
    expect(rows[0]?.id).toBe(transactions[0]?.id)
    expect(rows[0]?.draft).toEqual({
      type: "expense",
      amount: 85_000,
      category: "Makan & Minum",
      date: "2026-08-11T12:00:00.000Z",
      note: "Makan siang, bersama tim",
    })
    expect(rows[1]?.draft.note).toBeUndefined()
  })

  it("skips malformed rows instead of failing", () => {
    const csv = [
      "id,type,amount,category,note,date",
      "x,expense,50000,\"Makan & Minum\",,2026-08-11T12:00:00.000Z",
      "y,expense,not-a-number,Lainnya,,2026-08-11T12:00:00.000Z",
      "z,income,100000,Gaji,,\"bad date\"",
    ].join("\n")

    const { rows, skipped } = parseTransactionsCsv(csv)

    expect(rows).toHaveLength(1)
    expect(skipped).toBe(2)
  })

  it("handles quoted fields with commas, quotes, and empty note", () => {
    const csv = [
      "id,type,amount,category,note,date",
      "row-1,expense,10000,\"Kebutuhan, rumah\",\"Kata \"\"dalam\"\" catatan\",2026-08-01T12:00:00.000Z",
    ].join("\n")

    const { rows, skipped } = parseTransactionsCsv(csv)

    expect(skipped).toBe(0)
    expect(rows[0]?.draft).toMatchObject({
      category: "Kebutuhan, rumah",
      note: "Kata \"dalam\" catatan",
    })
  })
})
