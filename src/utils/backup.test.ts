import { describe, expect, it } from "vitest"

import { createRecurringDefinition } from "../features/recurring/types"
import { createTransaction } from "../features/transactions/types"
import { parseBackup, serializeBackup, buildBackupPayload, BackupFormatError, type BackupPayload } from "./backup"

function samplePayload(): BackupPayload {
  return buildBackupPayload({
    transactions: [
      createTransaction({
        type: "income",
        amount: 2000000,
        category: "Gaji",
        note: "Gaji bulanan",
        date: "2026-07-15T04:00:00.000Z",
      }),
    ],
    budgets: { "Makan & Minum": 1000000 },
    recurring: [
      createRecurringDefinition(
        {
          type: "expense",
          amount: 500000,
          category: "Tempat Tinggal",
          note: "Sewa",
          dayOfMonth: 1,
        },
        "2026-07",
      ),
    ],
    settings: { theme: "dark", biometricLock: true },
  })
}

describe("buildBackupPayload", () => {
  it("membuat payload dengan schemaVersion dan createdAt", () => {
    const payload = samplePayload()
    expect(payload.schemaVersion).toBe(1)
    expect(payload.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(payload.transactions[0]?.amount).toBe(2000000)
  })
})

describe("serializeBackup / parseBackup", () => {
  it("roundtrip mengembalikan data yang sama", () => {
    const payload = samplePayload()
    const parsed = parseBackup(serializeBackup(payload))
    expect(parsed).toEqual(payload)
  })

  it("menolak JSON yang tidak valid", () => {
    expect(() => parseBackup("{bukan json")).toThrow(BackupFormatError)
  })

  it("menolak payload dengan schemaVersion lain", () => {
    const json = JSON.stringify({ ...samplePayload(), schemaVersion: 99 })
    expect(() => parseBackup(json)).toThrow(BackupFormatError)
  })

  it("membuang transaksi yang tidak valid di dalam payload", () => {
    const payload = samplePayload()
    const invalid = { ...payload, transactions: [...payload.transactions, { id: "bad", type: "income", amount: -5, category: "Gaji", date: "bukan-tanggal" }] }
    const parsed = parseBackup(JSON.stringify(invalid))
    expect(parsed.transactions).toHaveLength(1)
  })

  it("membuang anggaran yang tidak valid", () => {
    const payload = samplePayload()
    const parsed = parseBackup(JSON.stringify({ ...payload, budgets: { "Makan & Minum": -100 } }))
    expect(parsed.budgets).toEqual({})
  })
})
