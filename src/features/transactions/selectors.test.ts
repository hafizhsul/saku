import { describe, expect, it } from "vitest"

import {
  selectBalance,
  selectBalanceThrough,
  selectCategoryBreakdown,
  selectCategoryTrends,
  selectMonthlyNetSeries,
  selectMonthlySummary,
  selectRecentTransactions,
  selectTransactionsByQuery,
  selectTransactionsByType,
  selectTransactionsInMonth,
} from "./selectors"
import { TransactionIdSchema, type Transaction, type TransactionType } from "./types"

type TransactionInput = {
  readonly id: string
  readonly type: TransactionType
  readonly amount: number
  readonly category: string
  readonly date: string
}

function makeTransaction(input: TransactionInput): Transaction {
  return {
    id: TransactionIdSchema.parse(input.id),
    type: input.type,
    amount: input.amount,
    category: input.category,
    date: input.date,
  }
}

const transactions: readonly Transaction[] = [
  makeTransaction({
    id: "income-august",
    type: "income",
    amount: 5_000_000,
    category: "Gaji",
    date: "2026-08-01T09:00:00.000Z",
  }),
  makeTransaction({
    id: "expense-food",
    type: "expense",
    amount: 250_000,
    category: "Makan & Minum",
    date: "2026-08-03T12:00:00.000Z",
  }),
  makeTransaction({
    id: "expense-transport",
    type: "expense",
    amount: 150_000,
    category: "Transportasi",
    date: "2026-08-05T12:00:00.000Z",
  }),
  makeTransaction({
    id: "expense-food-two",
    type: "expense",
    amount: 100_000,
    category: "Makan & Minum",
    date: "2026-08-07T12:00:00.000Z",
  }),
  makeTransaction({
    id: "old-income",
    type: "income",
    amount: 1_000_000,
    category: "Gaji",
    date: "2026-07-31T09:00:00.000Z",
  }),
]

describe("transaction selectors", () => {
  it("returns the total balance when income and expenses are present", () => {
    const balance = selectBalance(transactions)

    expect(balance).toBe(5_500_000)
  })

  it("computes the running balance through the end of a month", () => {
    expect(selectBalanceThrough(transactions, "2026-07")).toBe(1_000_000)
    expect(selectBalanceThrough(transactions, "2026-08")).toBe(5_500_000)
  })

  it("summarizes only transactions inside the requested month", () => {
    const summary = selectMonthlySummary(transactions, "2026-08")

    expect(summary).toEqual({ income: 5_000_000, expense: 500_000, net: 4_500_000, count: 4 })
  })

  it("filters transactions by their discriminated type", () => {
    const expenses = selectTransactionsByType(transactions, "expense")

    expect(expenses).toHaveLength(3)
    expect(expenses.every((transaction) => transaction.type === "expense")).toBe(true)
  })

  it("groups spending categories by amount and percentage", () => {
    const breakdown = selectCategoryBreakdown(transactions, "2026-08")

    expect(breakdown).toEqual([
      { category: "Makan & Minum", amount: 350_000, percentage: 70 },
      { category: "Transportasi", amount: 150_000, percentage: 30 },
    ])
  })

  it("returns the newest transactions first and respects the limit", () => {
    const recent = selectRecentTransactions(transactions, 2)

    expect(recent.map((transaction) => transaction.id)).toEqual([
      TransactionIdSchema.parse("expense-food-two"),
      TransactionIdSchema.parse("expense-transport"),
    ])
  })

  it("attaches a budget to categories that have one", () => {
    const breakdown = selectCategoryBreakdown(transactions, "2026-08", { "Makan & Minum": 300_000 })

    expect(breakdown).toEqual([
      { category: "Makan & Minum", amount: 350_000, percentage: 70, budget: 300_000 },
      { category: "Transportasi", amount: 150_000, percentage: 30, budget: undefined },
    ])
  })

  it("returns no category breakdown when the month has no expenses", () => {
    expect(selectCategoryBreakdown(transactions, "2026-09")).toEqual([])
  })

  it("filters transactions to a single month", () => {
    const july = selectTransactionsInMonth(transactions, "2026-07")

    expect(july.map((transaction) => transaction.id)).toEqual([TransactionIdSchema.parse("old-income")])
  })

  it("matches queries against note and category, case-insensitively", () => {
    expect(selectTransactionsByQuery(transactions, "makan").map((transaction) => transaction.id)).toEqual([
      TransactionIdSchema.parse("expense-food"),
      TransactionIdSchema.parse("expense-food-two"),
    ])
    expect(selectTransactionsByQuery(transactions, "TRANSPORT").map((transaction) => transaction.id)).toEqual([
      TransactionIdSchema.parse("expense-transport"),
    ])
    expect(selectTransactionsByQuery(transactions, "  ")).toEqual(transactions)
  })

  it("builds a monthly net series ending at the given month", () => {
    const series = selectMonthlyNetSeries(transactions, "2026-08", 3)

    expect(series.map((point) => point.month)).toEqual(["2026-06", "2026-07", "2026-08"])
    expect(series.map((point) => point.net)).toEqual([0, 1_000_000, 4_500_000])
    expect(series[2]?.label).toBe("Agu")
  })

  it("returns no recent transactions for a non-positive limit", () => {
    expect(selectRecentTransactions(transactions, 0)).toEqual([])
  })

  it("builds per-category monthly expense trends ending at the given month", () => {
    const trends = selectCategoryTrends(transactions, "2026-08", 3)

    expect(trends.map((trend) => trend.category)).toEqual(["Makan & Minum", "Transportasi"])
    expect(trends[0]?.values).toEqual([0, 0, 350_000])
    expect(trends[0]?.latest).toBe(350_000)
    expect(trends[1]?.values).toEqual([0, 0, 150_000])
  })

  it("aligns older months when the window spans several months", () => {
    const trends = selectCategoryTrends(transactions, "2026-08", 6)

    expect(trends[0]?.values).toEqual([0, 0, 0, 0, 0, 350_000])
  })

  it("returns no trend when the window has no expenses", () => {
    expect(selectCategoryTrends(transactions, "2026-03", 3)).toEqual([])
  })
})
