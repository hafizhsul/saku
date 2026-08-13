import { useMemo } from "react"

import { useTransactions } from "../transactions/TransactionsProvider"
import { toMonthKey } from "../../utils/dates"
import { useBudgets } from "./BudgetsProvider"

type DailyBudget = {
  /** Total sisa anggaran seluruh kategori bulan berjalan (per kategori max(budget − terpakai, 0)). */
  readonly remaining: number
  /** Sisa anggaran dibagi hari tersisa bulan berjalan. */
  readonly daily: number
  readonly daysLeft: number
}

export function useDailyBudget(): DailyBudget {
  const { budgets } = useBudgets()
  const { transactions } = useTransactions()
  const currentMonth = toMonthKey(new Date())

  const remaining = useMemo(() => {
    let sum = 0
    for (const [category, budget] of Object.entries(budgets)) {
      let spent = 0
      for (const transaction of transactions) {
        if (transaction.type === "expense" && transaction.category === category && toMonthKey(new Date(transaction.date)) === currentMonth) {
          spent += transaction.amount
        }
      }
      sum += Math.max(budget - spent, 0)
    }
    return sum
  }, [budgets, currentMonth, transactions])

  const today = new Date()
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysLeft = lastDayOfMonth - today.getDate() + 1
  const daily = daysLeft > 0 ? remaining / daysLeft : 0

  return { remaining, daily, daysLeft }
}
