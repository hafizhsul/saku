import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react"

import { useRestoreEpoch } from "../backup/BackupProvider"

import type { CsvTransactionRow } from "../../utils/csv"
import {
  createTransaction,
  createTransactionWithId,
  updateTransaction as buildUpdatedTransaction,
  type Transaction,
  type TransactionDraft,
} from "./types"
import {
  loadTransactions,
  saveTransactions,
  TransactionStorageError,
} from "../../storage/transactions"

type SaveState = "idle" | "saving" | "saved" | "error"

type TransactionsState = {
  readonly transactions: readonly Transaction[]
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly saveState: SaveState
  readonly saveError: string | null
}

type TransactionsAction =
  | { readonly type: "loadStarted" }
  | { readonly type: "loadSucceeded"; readonly transactions: readonly Transaction[] }
  | { readonly type: "loadFailed"; readonly message: string }
  | { readonly type: "saveStarted" }
  | { readonly type: "saveSucceeded" }
  | { readonly type: "saveFailed"; readonly message: string }

export type AddTransactionResult =
  | { readonly ok: true; readonly transaction: Transaction }
  | { readonly ok: false; readonly message: string }

export type UpdateTransactionResult =
  | { readonly ok: true; readonly transaction: Transaction }
  | { readonly ok: false; readonly message: string }

export type DeleteTransactionResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

export type ImportTransactionsResult =
  | { readonly ok: true; readonly added: number; readonly skipped: number }
  | { readonly ok: false; readonly message: string }

export type AppendTransactionsResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

export type TransactionsContextValue = TransactionsState & {
  readonly addTransaction: (draft: TransactionDraft) => Promise<AddTransactionResult>
  readonly updateTransaction: (id: string, draft: TransactionDraft) => Promise<UpdateTransactionResult>
  readonly deleteTransaction: (id: string) => Promise<DeleteTransactionResult>
  readonly importTransactions: (rows: readonly CsvTransactionRow[]) => Promise<ImportTransactionsResult>
  readonly appendTransactions: (transactions: readonly Transaction[]) => Promise<AppendTransactionsResult>
  readonly retryLoad: () => Promise<void>
}

const initialState: TransactionsState = {
  transactions: [],
  isLoading: true,
  loadError: null,
  saveState: "idle",
  saveError: null,
}

function reducer(state: TransactionsState, action: TransactionsAction): TransactionsState {
  switch (action.type) {
    case "loadStarted":
      return { ...state, isLoading: true, loadError: null }
    case "loadSucceeded":
      return {
        ...state,
        isLoading: false,
        loadError: null,
        transactions: action.transactions,
      }
    case "loadFailed":
      return { ...state, isLoading: false, loadError: action.message }
    case "saveStarted":
      return { ...state, saveState: "saving", saveError: null }
    case "saveSucceeded":
      return { ...state, saveState: "saved", saveError: null }
    case "saveFailed":
      return { ...state, saveState: "error", saveError: action.message }
    default:
      return state
  }
}

function getStorageMessage(error: unknown, operation: "read" | "write"): string {
  if (error instanceof TransactionStorageError) {
    return operation === "read"
      ? "Data keuangan belum bisa dimuat. Coba lagi."
      : "Transaksi belum tersimpan. Coba lagi."
  }

  return operation === "read"
    ? "Data keuangan belum bisa dimuat. Coba lagi."
    : "Transaksi belum tersimpan. Coba lagi."
}

const TransactionsContext = createContext<TransactionsContextValue | null>(null)

export function TransactionsProvider({ children }: PropsWithChildren): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, initialState)
  const transactionsRef = useRef<readonly Transaction[]>([])
  const restoreEpoch = useRestoreEpoch()

  const retryLoad = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStarted" })

    try {
      const transactions = await loadTransactions()
      transactionsRef.current = transactions
      dispatch({ type: "loadSucceeded", transactions })
    } catch (error) {
      dispatch({ type: "loadFailed", message: getStorageMessage(error, "read") })
    }
  }, [])

  useEffect(() => {
    void retryLoad()
  }, [retryLoad, restoreEpoch])

  const addTransaction = useCallback(async (draft: TransactionDraft): Promise<AddTransactionResult> => {
    const transaction = createTransaction(draft)
    const nextTransactions = [transaction, ...transactionsRef.current]
    dispatch({ type: "saveStarted" })

    try {
      await saveTransactions(nextTransactions)
      transactionsRef.current = nextTransactions
      dispatch({ type: "loadSucceeded", transactions: nextTransactions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true, transaction }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const updateTransaction = useCallback(async (id: string, draft: TransactionDraft): Promise<UpdateTransactionResult> => {
    const current = transactionsRef.current
    const existing = current.find((transaction) => transaction.id === id)
    if (existing === undefined) {
      return { ok: false, message: "Transaksi tidak ditemukan." }
    }

    const transaction = buildUpdatedTransaction(existing, draft)
    const nextTransactions = current.map((item) => (item.id === id ? transaction : item))
    dispatch({ type: "saveStarted" })

    try {
      await saveTransactions(nextTransactions)
      transactionsRef.current = nextTransactions
      dispatch({ type: "loadSucceeded", transactions: nextTransactions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true, transaction }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const deleteTransaction = useCallback(async (id: string): Promise<DeleteTransactionResult> => {
    const current = transactionsRef.current
    if (!current.some((transaction) => transaction.id === id)) {
      return { ok: false, message: "Transaksi tidak ditemukan." }
    }

    const nextTransactions = current.filter((transaction) => transaction.id !== id)
    dispatch({ type: "saveStarted" })

    try {
      await saveTransactions(nextTransactions)
      transactionsRef.current = nextTransactions
      dispatch({ type: "loadSucceeded", transactions: nextTransactions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const importTransactions = useCallback(async (rows: readonly CsvTransactionRow[]): Promise<ImportTransactionsResult> => {
    const current = transactionsRef.current
    const knownIds = new Set<string>(current.map((transaction) => transaction.id))
    const addedTransactions: Transaction[] = []
    let skipped = 0

    for (const row of rows) {
      if (row.id !== undefined) {
        if (knownIds.has(row.id)) {
          skipped += 1
          continue
        }

        try {
          const transaction = createTransactionWithId(row.draft, row.id)
          knownIds.add(transaction.id)
          addedTransactions.push(transaction)
          continue
        } catch {
          // fall through to fresh-id import below
        }
      }

      const duplicate = current.some(
        (transaction) =>
          transaction.type === row.draft.type &&
          transaction.amount === row.draft.amount &&
          transaction.category === row.draft.category &&
          transaction.date === row.draft.date &&
          (transaction.note ?? "") === (row.draft.note ?? ""),
      )
      if (duplicate) {
        skipped += 1
        continue
      }

      const transaction = createTransaction(row.draft)
      knownIds.add(transaction.id)
      addedTransactions.push(transaction)
    }

    if (addedTransactions.length === 0) {
      return { ok: true, added: 0, skipped: rows.length }
    }

    const nextTransactions = [...addedTransactions, ...current]
    dispatch({ type: "saveStarted" })

    try {
      await saveTransactions(nextTransactions)
      transactionsRef.current = nextTransactions
      dispatch({ type: "loadSucceeded", transactions: nextTransactions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true, added: addedTransactions.length, skipped }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const appendTransactions = useCallback(async (newTransactions: readonly Transaction[]): Promise<AppendTransactionsResult> => {
    if (newTransactions.length === 0) {
      return { ok: true }
    }

    const nextTransactions = [...newTransactions, ...transactionsRef.current]
    dispatch({ type: "saveStarted" })

    try {
      await saveTransactions(nextTransactions)
      transactionsRef.current = nextTransactions
      dispatch({ type: "loadSucceeded", transactions: nextTransactions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const value = useMemo<TransactionsContextValue>(
    () => ({ ...state, addTransaction, updateTransaction, deleteTransaction, importTransactions, appendTransactions, retryLoad }),
    [addTransaction, appendTransactions, deleteTransaction, importTransactions, retryLoad, state, updateTransaction],
  )

  return <TransactionsContext.Provider value={value}>{children}</TransactionsContext.Provider>
}

export function useTransactions(): TransactionsContextValue {
  const context = useContext(TransactionsContext)
  if (context === null) {
    throw new Error("useTransactions must be used within TransactionsProvider")
  }

  return context
}
