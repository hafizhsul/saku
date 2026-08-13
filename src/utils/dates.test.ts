import { describe, expect, it } from "vitest"

import { shiftMonth, toMonthKey } from "./dates"

describe("month shifting", () => {
  it("shifts forward and backward within a year", () => {
    expect(shiftMonth("2026-08", 1)).toBe("2026-09")
    expect(shiftMonth("2026-08", -1)).toBe("2026-07")
  })

  it("rolls over across year boundaries", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12")
    expect(shiftMonth("2026-12", 1)).toBe("2027-01")
  })

  it("matches the month key of the shifted date", () => {
    expect(shiftMonth("2026-08", -3)).toBe(toMonthKey(new Date(2026, 4, 1)))
  })
})
