import { describe, expect, it, vi } from "vitest"

import { formatAmountInput, formatMonthLabel, formatRelativeTransactionTime, formatShortMonthLabel, formatTransactionDate, parseAmountInput, shiftMonth, toMonthKey } from "./dates"

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

describe("month and date labels", () => {
  it("formats month labels in Indonesian", () => {
    expect(formatMonthLabel("2026-08")).toBe("Agustus 2026")
    expect(formatShortMonthLabel("2026-08")).toBe("Agu")
  })

  it("formats a transaction date in the id-ID style", () => {
    expect(formatTransactionDate("2026-08-12T12:00:00.000Z")).toBe("12 Agu 2026")
  })
})

describe("relative transaction time", () => {
  it("labels today and yesterday with time", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 18, 9, 0))
    expect(formatRelativeTransactionTime("2026-08-18T12:30:00.000Z")).toBe("Hari ini, 19:30")
    expect(formatRelativeTransactionTime("2026-08-17T08:15:00.000Z")).toBe("Kemarin, 15:15")
    vi.useRealTimers()
  })

  it("falls back to the full date for older transactions", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 18, 9, 0))
    expect(formatRelativeTransactionTime("2026-07-01T12:00:00.000Z")).toBe("1 Jul 2026")
    vi.useRealTimers()
  })
})

describe("amount input", () => {
  it("parses digits only, ignoring separators and currency symbols", () => {
    expect(parseAmountInput("12.345")).toBe(12345)
    expect(parseAmountInput("Rp 1.000")).toBe(1000)
    expect(parseAmountInput("12,5")).toBe(125)
  })

  it("rejects empty, zero, and non-numeric input", () => {
    expect(parseAmountInput("")).toBeNull()
    expect(parseAmountInput("abc")).toBeNull()
    expect(parseAmountInput("0")).toBeNull()
  })

  it("formats digits back to the id-ID grouping", () => {
    expect(formatAmountInput("12345")).toBe("12.345")
    expect(formatAmountInput("abc")).toBe("")
  })
})
