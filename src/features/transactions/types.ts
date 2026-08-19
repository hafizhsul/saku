import { z } from "zod"

export const TRANSACTION_TYPES = {
  income: "income",
  expense: "expense",
} as const

export type TransactionType = (typeof TRANSACTION_TYPES)[keyof typeof TRANSACTION_TYPES]

export const INCOME_CATEGORY_OPTIONS = [
  { key: "Gaji", label: "Gaji", icon: "cash-multiple" },
  { key: "Bonus", label: "Bonus", icon: "gift-outline" },
  { key: "Freelance", label: "Freelance", icon: "laptop" },
  { key: "Bisnis", label: "Bisnis", icon: "store-outline" },
  { key: "Investasi", label: "Investasi", icon: "chart-line" },
  { key: "Lainnya", label: "Lainnya", icon: "dots-horizontal" },
] as const

// Label mengikuti referensi desain Stitch; key (identitas tersimpan di data)
// sengaja TIDAK ikut diganti agar transaksi/budget lama tetap terpetakan.
// ponytail: "Tempat Tinggal" berlabel "Tagihan" — konsep beda (sewa vs tagihan);
// tambahkan key baru + migrasi data kalau pemisahan kategori ini diperlukan.
export const EXPENSE_CATEGORY_OPTIONS = [
  { key: "Makan & Minum", label: "Makanan", icon: "silverware-fork-knife" },
  { key: "Transportasi", label: "Transport", icon: "bus" },
  { key: "Kebutuhan", label: "Belanja", icon: "shopping-outline" },
  { key: "Tempat Tinggal", label: "Tagihan", icon: "home-outline" },
  { key: "Hiburan", label: "Hiburan", icon: "movie-open-outline" },
  { key: "Kesehatan", label: "Kesehatan", icon: "heart-pulse" },
  { key: "Lainnya", label: "Lainnya", icon: "dots-horizontal" },
] as const

export type CategoryOption = (typeof INCOME_CATEGORY_OPTIONS)[number] | (typeof EXPENSE_CATEGORY_OPTIONS)[number]

export function categoryOptionsForType(type: TransactionType): readonly CategoryOption[] {
  return type === "income" ? INCOME_CATEGORY_OPTIONS : EXPENSE_CATEGORY_OPTIONS
}

export const TransactionIdSchema = z.string().min(1).brand("TransactionId")

const TransactionSchema = z
  .object({
    id: TransactionIdSchema,
    type: z.enum([TRANSACTION_TYPES.income, TRANSACTION_TYPES.expense]),
    amount: z.number().finite().positive(),
    category: z.string().trim().min(1),
    note: z.string().trim().max(120).optional(),
    date: z.string().datetime(),
  })
  .readonly()

export const TransactionsSchema = z.array(TransactionSchema).readonly()

export type Transaction = z.infer<typeof TransactionSchema>

export const TransactionDraftSchema = z
  .object({
    type: z.enum([TRANSACTION_TYPES.income, TRANSACTION_TYPES.expense]),
    amount: z.number().finite().positive(),
    category: z.string().trim().min(1),
    note: z.string().trim().max(120).optional(),
    date: z.string().datetime(),
  })
  .readonly()

export type TransactionDraft = z.infer<typeof TransactionDraftSchema>

export function createTransactionId(): z.infer<typeof TransactionIdSchema> {
  const entropy = Math.random().toString(36).slice(2, 8)
  return TransactionIdSchema.parse(`${Date.now().toString(36)}-${entropy}`)
}

export function createTransaction(draft: TransactionDraft): Transaction {
  const parsedDraft = TransactionDraftSchema.parse(draft)

  return TransactionSchema.parse({
    ...parsedDraft,
    id: createTransactionId(),
  })
}

export function updateTransaction(transaction: Transaction, draft: TransactionDraft): Transaction {
  const parsedDraft = TransactionDraftSchema.parse(draft)

  return TransactionSchema.parse({
    ...parsedDraft,
    id: transaction.id,
  })
}

export function createTransactionWithId(draft: TransactionDraft, id: string): Transaction {
  const parsedDraft = TransactionDraftSchema.parse(draft)
  const parsedId = TransactionIdSchema.parse(id)

  return TransactionSchema.parse({
    ...parsedDraft,
    id: parsedId,
  })
}

export function parseStoredTransactions(value: unknown): readonly Transaction[] {
  const parsed = TransactionsSchema.safeParse(value)

  if (!parsed.success) {
    return []
  }

  return parsed.data
}
