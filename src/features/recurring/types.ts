import { z } from "zod"

import { TRANSACTION_TYPES, type TransactionType } from "../transactions/types"

export const RecurringIdSchema = z.string().min(1).brand("RecurringId")

const RecurringDefinitionSchema = z
  .object({
    id: RecurringIdSchema,
    type: z.enum([TRANSACTION_TYPES.income, TRANSACTION_TYPES.expense]),
    amount: z.number().finite().positive(),
    category: z.string().trim().min(1),
    note: z.string().trim().max(120).optional(),
    dayOfMonth: z.number().int().min(1).max(28),
    lastApplied: z.string().regex(/^\d{4}-\d{2}$/),
  })
  .readonly()

export const RecurringDefinitionsSchema = z.array(RecurringDefinitionSchema).readonly()

export type RecurringDefinition = z.infer<typeof RecurringDefinitionSchema>

const RecurringDraftSchema = z
  .object({
    type: z.enum([TRANSACTION_TYPES.income, TRANSACTION_TYPES.expense]),
    amount: z.number().finite().positive(),
    category: z.string().trim().min(1),
    note: z.string().trim().max(120).optional(),
    dayOfMonth: z.number().int().min(1).max(28),
  })
  .readonly()

export type RecurringDraft = z.infer<typeof RecurringDraftSchema>

export function createRecurringId(): z.infer<typeof RecurringIdSchema> {
  const entropy = Math.random().toString(36).slice(2, 8)
  return RecurringIdSchema.parse(`${Date.now().toString(36)}-${entropy}`)
}

export function createRecurringDefinition(draft: RecurringDraft, currentMonth: string): RecurringDefinition {
  const parsedDraft = RecurringDraftSchema.parse(draft)

  return RecurringDefinitionSchema.parse({
    ...parsedDraft,
    id: createRecurringId(),
    lastApplied: currentMonth,
  })
}

export function updateRecurringDefinition(definition: RecurringDefinition, draft: RecurringDraft): RecurringDefinition {
  const parsedDraft = RecurringDraftSchema.parse(draft)

  return RecurringDefinitionSchema.parse({
    ...parsedDraft,
    id: definition.id,
    lastApplied: definition.lastApplied,
  })
}

export function parseStoredRecurringDefinitions(value: unknown): readonly RecurringDefinition[] {
  const parsed = RecurringDefinitionsSchema.safeParse(value)

  if (!parsed.success) {
    return []
  }

  return parsed.data
}

export type RecurringType = TransactionType
