import { describe, expect, it } from "vitest"

import { createRecurringDefinition } from "./types"
import { computeDueRecurring } from "./apply"

const today = new Date(2026, 7, 13) // 13 Agustus 2026

function makeDefinition(dayOfMonth: number, lastApplied: string) {
  return createRecurringDefinition(
    {
      type: "expense",
      amount: 1_500_000,
      category: "Tempat Tinggal",
      note: "Sewa kos",
      dayOfMonth,
    },
    lastApplied,
  )
}

describe("recurring apply", () => {
  it("creates due transactions and advances lastApplied", () => {
    const definition = makeDefinition(5, "2026-07")
    const result = computeDueRecurring([definition], "2026-08", today)

    expect(result.added).toHaveLength(1)
    expect(result.added[0]).toMatchObject({
      type: "expense",
      amount: 1_500_000,
      category: "Tempat Tinggal",
      note: "Sewa kos",
    })
    expect(result.added[0]?.date.startsWith("2026-08-05")).toBe(true)
    expect(result.updated[0]?.lastApplied).toBe("2026-08")
  })

  it("skips definitions already applied for the month", () => {
    const definition = makeDefinition(5, "2026-08")
    const result = computeDueRecurring([definition], "2026-08", today)

    expect(result.added).toHaveLength(0)
    expect(result.updated).toHaveLength(0)
  })

  it("waits for the due day instead of backdating", () => {
    const definition = makeDefinition(28, "2026-07")
    const result = computeDueRecurring([definition], "2026-08", today)

    expect(result.added).toHaveLength(0)
    expect(result.updated).toHaveLength(0)
  })

  it("applies multiple due definitions in one pass", () => {
    const salary = createRecurringDefinition(
      { type: "income", amount: 6_000_000, category: "Gaji", dayOfMonth: 1 },
      "2026-07",
    )
    const rent = makeDefinition(10, "2026-07")
    const future = makeDefinition(20, "2026-07")

    const result = computeDueRecurring([salary, rent, future], "2026-08", today)

    expect(result.added).toHaveLength(2)
    expect(result.updated.map((definition) => definition.lastApplied)).toEqual(["2026-08", "2026-08"])
  })
})
