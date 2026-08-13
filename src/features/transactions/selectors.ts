import { formatShortMonthLabel, shiftMonth } from "../../utils/dates"
import type { Transaction, TransactionType } from "./types"

export type MonthlySummary = {
  readonly income: number
  readonly expense: number
  readonly net: number
  readonly count: number
}

export type CategoryBreakdownItem = {
  readonly category: string
  readonly amount: number
  readonly percentage: number
  readonly budget?: number
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected transaction value: ${String(value)}`)
}

function isInMonth(date: string, month: string): boolean {
  return date.slice(0, 7) === month
}

function selectTransactionsForMonth(
  transactions: readonly Transaction[],
  month: string,
): readonly Transaction[] {
  return transactions.filter((transaction) => isInMonth(transaction.date, month))
}

export function selectBalance(transactions: readonly Transaction[]): number {
  return transactions.reduce((balance, transaction) => {
    switch (transaction.type) {
      case "income":
        return balance + transaction.amount
      case "expense":
        return balance - transaction.amount
      default:
        return assertNever(transaction.type)
    }
  }, 0)
}

export function selectBalanceThrough(transactions: readonly Transaction[], month: string): number {
  const upToMonth = transactions.filter((transaction) => transaction.date.slice(0, 7) <= month)
  return selectBalance(upToMonth)
}

export function selectMonthlySummary(
  transactions: readonly Transaction[],
  month: string,
): MonthlySummary {
  const monthlyTransactions = selectTransactionsForMonth(transactions, month)

  const totals = monthlyTransactions.reduce(
    (summary, transaction) => {
      switch (transaction.type) {
        case "income":
          return { ...summary, income: summary.income + transaction.amount }
        case "expense":
          return { ...summary, expense: summary.expense + transaction.amount }
        default:
          return assertNever(transaction.type)
      }
    },
    { income: 0, expense: 0 },
  )

  return {
    ...totals,
    net: totals.income - totals.expense,
    count: monthlyTransactions.length,
  }
}

export function selectTransactionsByType(
  transactions: readonly Transaction[],
  type: TransactionType,
): readonly Transaction[] {
  return transactions.filter((transaction) => transaction.type === type)
}

export function selectTransactionsInMonth(
  transactions: readonly Transaction[],
  month: string,
): readonly Transaction[] {
  return transactions.filter((transaction) => transaction.date.slice(0, 7) === month)
}

export function selectTransactionsByQuery(
  transactions: readonly Transaction[],
  query: string,
): readonly Transaction[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery.length === 0) {
    return transactions
  }

  return transactions.filter((transaction) => {
    const haystack = `${transaction.category} ${transaction.note ?? ""}`.toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}

export function selectCategoryBreakdown(
  transactions: readonly Transaction[],
  month: string,
  budgets?: Readonly<Record<string, number>>,
): readonly CategoryBreakdownItem[] {
  const expenses = selectTransactionsForMonth(transactions, month).filter(
    (transaction) => transaction.type === "expense",
  )

  const totalsByCategory = new Map<string, number>()
  for (const transaction of expenses) {
    const currentTotal = totalsByCategory.get(transaction.category) ?? 0
    totalsByCategory.set(transaction.category, currentTotal + transaction.amount)
  }

  const totalExpenses = expenses.reduce((total, transaction) => total + transaction.amount, 0)
  if (totalExpenses === 0) {
    return []
  }

  return [...totalsByCategory.entries()]
    .map(([category, amount]) => {
      const budget = budgets?.[category]

      return {
        category,
        amount,
        percentage: Math.round((amount / totalExpenses) * 100),
        budget: budget !== undefined && budget > 0 ? budget : undefined,
      }
    })
    .sort((left, right) => right.amount - left.amount)
}

export function selectRecentTransactions(
  transactions: readonly Transaction[],
  limit: number,
): readonly Transaction[] {
  if (limit <= 0) {
    return []
  }

  return [...transactions].sort((left, right) => right.date.localeCompare(left.date)).slice(0, limit)
}

export type MonthlyNetPoint = {
  readonly month: string
  readonly label: string
  readonly net: number
}

export function selectMonthlyNetSeries(
  transactions: readonly Transaction[],
  endMonth: string,
  count: number,
): readonly MonthlyNetPoint[] {
  const points: MonthlyNetPoint[] = []
  let month = endMonth

  for (let index = 0; index < count; index += 1) {
    const summary = selectMonthlySummary(transactions, month)
    points.unshift({ month, label: formatShortMonthLabel(month), net: summary.net })
    month = shiftMonth(month, -1)
  }

  return points
}

export type CategoryTrend = {
  readonly category: string
  /** Total pengeluaran per bulan, tertua ke terbaru. */
  readonly values: readonly number[]
  readonly latest: number
}

export function selectCategoryTrends(
  transactions: readonly Transaction[],
  endMonth: string,
  count: number,
): readonly CategoryTrend[] {
  if (count <= 0) {
    return []
  }

  const months: string[] = []
  let month = endMonth
  for (let index = 0; index < count; index += 1) {
    months.unshift(month)
    month = shiftMonth(month, -1)
  }

  const totalsByCategory = new Map<string, number[]>()
  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue
    }
    const monthIndex = months.indexOf(transaction.date.slice(0, 7))
    if (monthIndex === -1) {
      continue
    }
    const values = totalsByCategory.get(transaction.category) ?? Array(months.length).fill(0) as number[]
    values[monthIndex] += transaction.amount
    totalsByCategory.set(transaction.category, values)
  }

  return [...totalsByCategory.entries()]
    .map(([category, values]) => ({
      category,
      values,
      latest: values[values.length - 1] ?? 0,
    }))
    .sort((left, right) => {
      const leftTotal = left.values.reduce((sum, value) => sum + value, 0)
      const rightTotal = right.values.reduce((sum, value) => sum + value, 0)
      return rightTotal - leftTotal
    })
    .slice(0, 5)
}
