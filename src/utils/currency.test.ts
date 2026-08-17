import { describe, expect, it } from "vitest"

import { formatCompactCurrency, formatCurrency, formatSignedCurrency } from "./currency"

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

  it("formats compact currency in rb and jt units", () => {
    expect(formatCompactCurrency(500)).toBe("Rp 500")
    expect(formatCompactCurrency(1_500)).toBe("Rp 2 rb")
    expect(formatCompactCurrency(950_000)).toBe("Rp 950 rb")
    expect(formatCompactCurrency(1_500_000)).toBe("Rp 1,5 jt")
  })

  it("keeps the sign in compact currency", () => {
    expect(formatCompactCurrency(-2_300_000)).toBe("-Rp 2,3 jt")
    expect(formatCompactCurrency(-750)).toBe("-Rp 750")
  })
})
