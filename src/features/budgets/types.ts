import { z } from "zod"

export const BudgetsSchema = z.record(z.string(), z.number().finite().positive()).readonly()

export type BudgetsMap = z.infer<typeof BudgetsSchema>

export function parseStoredBudgets(value: unknown): BudgetsMap {
  const parsed = BudgetsSchema.safeParse(value)

  if (!parsed.success) {
    return {}
  }

  return parsed.data
}
