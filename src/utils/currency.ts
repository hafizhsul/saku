import type { TransactionType } from "@/features/transactions/types"

const rupiahNumberFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
})

const transactionSign = {
  income: "+",
  expense: "-",
} satisfies Record<TransactionType, string>

export function formatCurrency(amount: number): string {
  return `Rp ${rupiahNumberFormatter.format(Math.round(amount))}`
}

export function formatSignedCurrency(amount: number, type: TransactionType): string {
  return `${transactionSign[type]} ${formatCurrency(amount)}`
}

export function formatCompactCurrency(amount: number): string {
  const absolute = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""

  if (absolute >= 1_000_000) {
    return `${sign}Rp ${(absolute / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`
  }
  if (absolute >= 1_000) {
    return `${sign}Rp ${Math.round(absolute / 1_000).toLocaleString("id-ID")} rb`
  }

  return `${sign}Rp ${absolute}`
}
