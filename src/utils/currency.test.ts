import { describe, expect, it } from "vitest"

import { formatCurrency, formatSignedCurrency } from "./currency"

describe("currency formatter", () => {
  it("formats a positive number as whole Rupiah", () => {
    expect(formatCurrency(1_234_567)).toBe("Rp 1.234.567")
  })

  it("formats zero without a decimal fraction", () => {
    expect(formatCurrency(0)).toBe("Rp 0")
  })

  it("adds a sign based on the transaction type", () => {
    expect(formatSignedCurrency(75_000, "income")).toBe("+ Rp 75.000")
    expect(formatSignedCurrency(75_000, "expense")).toBe("- Rp 75.000")
  })
})
