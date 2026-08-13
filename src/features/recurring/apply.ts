import { toTransactionDate } from "../../utils/dates"
import { createTransaction, type Transaction } from "../transactions/types"
import type { RecurringDefinition } from "./types"

export type RecurringApplyResult = {
  readonly added: readonly Transaction[]
  readonly updated: readonly RecurringDefinition[]
}

export function computeDueRecurring(
  definitions: readonly RecurringDefinition[],
  currentMonth: string,
  today: Date,
): RecurringApplyResult {
  const added: Transaction[] = []
  const updated: RecurringDefinition[] = []
  const [yearValue, monthValue] = currentMonth.split("-").map(Number)

  if (!yearValue || !monthValue) {
    return { added, updated }
  }

  for (const definition of definitions) {
    if (definition.lastApplied >= currentMonth) {
      continue
    }

    // Not yet due this month; leave lastApplied untouched so it retries later.
    if (definition.dayOfMonth > today.getDate()) {
      continue
    }

    added.push(
      createTransaction({
        type: definition.type,
        amount: definition.amount,
        category: definition.category,
        note: definition.note,
        date: toTransactionDate(new Date(yearValue, monthValue - 1, definition.dayOfMonth)),
      }),
    )
    updated.push({ ...definition, lastApplied: currentMonth })
  }

  return { added, updated }
}
