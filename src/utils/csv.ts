import { TransactionDraftSchema, type Transaction, type TransactionDraft } from "../features/transactions/types"

export type CsvTransactionRow = {
  readonly id?: string
  readonly draft: TransactionDraft
}

const CSV_HEADER = ["id", "type", "amount", "category", "note", "date"]

function escapeField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`
  }

  return value
}

export function serializeTransactionsToCsv(transactions: readonly Transaction[]): string {
  const lines = [CSV_HEADER.join(",")]

  for (const transaction of transactions) {
    lines.push([
      escapeField(transaction.id),
      escapeField(transaction.type),
      String(transaction.amount),
      escapeField(transaction.category),
      escapeField(transaction.note ?? ""),
      escapeField(transaction.date),
    ].join(","))
  }

  return `${lines.join("\n")}\n`
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (inQuotes) {
      if (char === "\"") {
        if (line[index + 1] === "\"") {
          current += "\""
          index += 1
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === "\"") {
      inQuotes = true
    } else if (char === ",") {
      fields.push(current)
      current = ""
    } else {
      current += char
    }
  }

  fields.push(current)
  return fields
}

export function parseTransactionsCsv(text: string): { readonly rows: readonly CsvTransactionRow[]; readonly skipped: number } {
  const rows: CsvTransactionRow[] = []
  let skipped = 0
  const lines = text.split(/\r?\n/)

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line === undefined || line.trim() === "") {
      continue
    }

    const fields = parseCsvLine(line)
    if (fields.length < 6) {
      skipped += 1
      continue
    }

    const [idValue, type, amountValue, category, note, date] = fields
    const amount = Number(amountValue)
    const parsedDraft = TransactionDraftSchema.safeParse({
      type,
      amount,
      category,
      note: note === undefined || note.trim() === "" ? undefined : note,
      date,
    })

    if (!parsedDraft.success) {
      skipped += 1
      continue
    }

    if (idValue !== undefined && idValue.trim() !== "") {
      rows.push({ id: idValue.trim(), draft: parsedDraft.data })
    } else {
      rows.push({ draft: parsedDraft.data })
    }
  }

  return { rows, skipped }
}
