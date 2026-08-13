const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
})

const shortMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
})

export function toMonthKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${date.getFullYear()}-${month}`
}

export function formatMonthLabel(month: string): string {
  const [yearValue, monthValue] = month.split("-").map(Number)
  if (!yearValue || !monthValue) {
    return month
  }

  return monthFormatter.format(new Date(yearValue, monthValue - 1, 1))
}

export function formatShortMonthLabel(month: string): string {
  const [yearValue, monthValue] = month.split("-").map(Number)
  if (!yearValue || !monthValue) {
    return month
  }

  return shortMonthFormatter.format(new Date(yearValue, monthValue - 1, 1))
}

export function shiftMonth(month: string, delta: number): string {
  const [yearValue, monthValue] = month.split("-").map(Number)
  if (!yearValue || !monthValue) {
    return month
  }

  return toMonthKey(new Date(yearValue, monthValue - 1 + delta, 1))
}

export function formatTransactionDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function toTransactionDate(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString()
}

export function parseAmountInput(value: string): number | null {
  const normalized = value.replace(/[^0-9]/g, "")
  if (normalized.length === 0) {
    return null
  }

  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 ? amount : null
}

export function formatAmountInput(value: string): string {
  const amount = parseAmountInput(value)
  return amount === null ? "" : new Intl.NumberFormat("id-ID").format(amount)
}
