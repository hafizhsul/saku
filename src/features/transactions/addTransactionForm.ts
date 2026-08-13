import type { SegmentOption } from "../../components/SegmentedControl"
import type { TransactionType } from "./types"

export type FormErrors = {
  readonly amount?: string
  readonly category?: string
  readonly date?: string
  readonly general?: string
}

export const transactionTypeOptions: readonly SegmentOption[] = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
]

export function isTransactionType(value: string): value is TransactionType {
  return value === "income" || value === "expense"
}
