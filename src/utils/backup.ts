import { z } from "zod"

import { parseStoredBudgets, type BudgetsMap } from "../features/budgets/types"
import { RecurringDefinitionsSchema, type RecurringDefinition } from "../features/recurring/types"
import { TransactionsSchema, type Transaction } from "../features/transactions/types"
import type { Settings } from "../storage/settings"

export const BACKUP_SCHEMA_VERSION = 1

const BackupPayloadSchema = z
  .object({
    schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
    createdAt: z.string(),
    transactions: z.unknown(),
    budgets: z.unknown(),
    recurring: z.unknown(),
    settings: z.object({ theme: z.enum(["system", "light", "dark"]) }),
  })
  .readonly()

export type BackupPayload = {
  readonly schemaVersion: typeof BACKUP_SCHEMA_VERSION
  readonly createdAt: string
  readonly transactions: readonly Transaction[]
  readonly budgets: BudgetsMap
  readonly recurring: readonly RecurringDefinition[]
  readonly settings: Settings
}

export class BackupFormatError extends Error {
  readonly name = "BackupFormatError"
}

export function buildBackupPayload(input: {
  readonly transactions: readonly Transaction[]
  readonly budgets: BudgetsMap
  readonly recurring: readonly RecurringDefinition[]
  readonly settings: Settings
}): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    transactions: input.transactions,
    budgets: input.budgets,
    recurring: input.recurring,
    settings: input.settings,
  }
}

export function serializeBackup(payload: BackupPayload): string {
  return JSON.stringify(
    {
      ...payload,
      transactions: [...payload.transactions],
      recurring: [...payload.recurring],
    },
    null,
    2,
  )
}

export function parseBackup(json: string): BackupPayload {
  let raw: unknown

  try {
    raw = JSON.parse(json)
  } catch {
    throw new BackupFormatError("File bukan JSON valid.")
  }

  const parsed = BackupPayloadSchema.safeParse(raw)
  if (!parsed.success) {
    throw new BackupFormatError("File bukan cadangan Saku.")
  }

  return {
    schemaVersion: parsed.data.schemaVersion,
    createdAt: parsed.data.createdAt,
    transactions: parseTransactionsLenient(parsed.data.transactions),
    budgets: parseStoredBudgets(parsed.data.budgets),
    recurring: parseRecurringLenient(parsed.data.recurring),
    settings: parsed.data.settings,
  }
}

/**
 * Array zod schema gagal total jika satu elemen rusak; untuk cadangan,
 * elemen yang rusak dibuang satu per satu supaya sisanya tetap pulih.
 */
function parseTransactionsLenient(value: unknown): readonly Transaction[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsed = TransactionsSchema.safeParse([item])
    return parsed.success ? parsed.data : []
  })
}

function parseRecurringLenient(value: unknown): readonly RecurringDefinition[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    const parsed = RecurringDefinitionsSchema.safeParse([item])
    return parsed.success ? parsed.data : []
  })
}
