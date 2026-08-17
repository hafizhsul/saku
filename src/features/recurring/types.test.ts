import { describe, expect, it } from "vitest"

import {
  RecurringIdSchema,
  createRecurringDefinition,
  createRecurringId,
  parseStoredRecurringDefinitions,
  updateRecurringDefinition,
} from "./types"

const draft = {
  type: "expense" as const,
  amount: 500_000,
  category: "Tempat Tinggal",
  note: "Sewa",
  dayOfMonth: 1,
}

describe("recurring domain values", () => {
  it("creates a definition stamped with the current month", () => {
    const definition = createRecurringDefinition(draft, "2026-08")

    expect(RecurringIdSchema.safeParse(definition.id).success).toBe(true)
    expect(definition.lastApplied).toBe("2026-08")
    expect(definition).toMatchObject({
      type: "expense",
      amount: 500_000,
      category: "Tempat Tinggal",
      note: "Sewa",
      dayOfMonth: 1,
    })
  })

  it("generates a valid recurring id", () => {
    expect(RecurringIdSchema.safeParse(createRecurringId()).success).toBe(true)
  })

  it("rejects a due day beyond 28", () => {
    expect(() => createRecurringDefinition({ ...draft, dayOfMonth: 29 }, "2026-08")).toThrow()
  })

  it("updates a definition keeping id and lastApplied", () => {
    const original = createRecurringDefinition(draft, "2026-08")
    const updated = updateRecurringDefinition(original, { ...draft, amount: 600_000, category: "Kebutuhan" })

    expect(updated.id).toBe(original.id)
    expect(updated.lastApplied).toBe("2026-08")
    expect(updated.amount).toBe(600_000)
    expect(updated.category).toBe("Kebutuhan")
  })

  it("parses stored definitions and falls back for invalid values", () => {
    const definition = createRecurringDefinition(draft, "2026-08")

    expect(parseStoredRecurringDefinitions([definition])).toEqual([definition])
    expect(parseStoredRecurringDefinitions({ nope: true })).toEqual([])
  })
})
