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

export function formatTimeOfDay(value: string): string {
  return formatTime(new Date(value))
}

export function formatDayGroupLabel(value: string): string {
  const [yearValue, monthValue, dayValue] = value.split("-").map(Number)
  if (!yearValue || !monthValue || !dayValue) {
    return value
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDay = new Date(yearValue, monthValue - 1, dayValue).getTime()
  const diffDays = Math.round((startOfToday - startOfDay) / 86_400_000)

  if (diffDays === 0) {
    return "Hari ini"
  }
  if (diffDays === 1) {
    return "Kemarin"
  }
  return dateFormatter.format(new Date(yearValue, monthValue - 1, dayValue))
}

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

function formatTime(value: Date): string {
  const parts = timeFormatter.formatToParts(value)
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00"
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00"
  return `${hour}:${minute}`
}

export function formatRelativeTransactionTime(value: string): string {
  const date = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const diffDays = Math.round((startOfToday - startOfDay) / 86_400_000)
  const time = formatTime(date)

  if (diffDays === 0) {
    return `Hari ini, ${time}`
  }
  if (diffDays === 1) {
    return `Kemarin, ${time}`
  }
  return formatTransactionDate(value)
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

export function formatNativeDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseNativeDate(value: string): Date | null {
  const parts = value.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null
  }

  const [year, month, day] = parts
  if (year === undefined || month === undefined || day === undefined || year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

export function chunkRows<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}
