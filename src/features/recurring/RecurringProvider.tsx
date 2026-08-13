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

import {
  loadRecurringDefinitions,
  saveRecurringDefinitions as persistRecurring,
  RecurringStorageError,
} from "../../storage/recurring"
import { toMonthKey } from "../../utils/dates"
import { useTransactions } from "../transactions/TransactionsProvider"
import { computeDueRecurring } from "./apply"
import {
  createRecurringDefinition,
  updateRecurringDefinition as buildUpdatedDefinition,
  type RecurringDefinition,
  type RecurringDraft,
} from "./types"

type SaveState = "idle" | "saving" | "saved" | "error"

type RecurringState = {
  readonly definitions: readonly RecurringDefinition[]
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly saveState: SaveState
}

type RecurringAction =
  | { readonly type: "loadStarted" }
  | { readonly type: "loadSucceeded"; readonly definitions: readonly RecurringDefinition[] }
  | { readonly type: "loadFailed"; readonly message: string }
  | { readonly type: "saveStarted" }
  | { readonly type: "saveSucceeded" }
  | { readonly type: "saveFailed"; readonly message: string }

const initialState: RecurringState = {
  definitions: [],
  isLoading: true,
  loadError: null,
  saveState: "idle",
}

function reducer(state: RecurringState, action: RecurringAction): RecurringState {
  switch (action.type) {
    case "loadStarted":
      return { ...state, isLoading: true, loadError: null }
    case "loadSucceeded":
      return { ...state, isLoading: false, loadError: null, definitions: action.definitions }
    case "loadFailed":
      return { ...state, isLoading: false, loadError: action.message }
    case "saveStarted":
      return { ...state, saveState: "saving" }
    case "saveSucceeded":
      return { ...state, saveState: "saved" }
    case "saveFailed":
      return { ...state, saveState: "error" }
    default:
      return state
  }
}

function getStorageMessage(error: unknown, operation: "read" | "write"): string {
  if (error instanceof RecurringStorageError) {
    return operation === "read"
      ? "Transaksi berulang belum bisa dimuat. Coba lagi."
      : "Transaksi berulang belum tersimpan. Coba lagi."
  }

  return operation === "read"
    ? "Transaksi berulang belum bisa dimuat. Coba lagi."
    : "Transaksi berulang belum tersimpan. Coba lagi."
}

export type RecurringMutationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

type RecurringContextValue = RecurringState & {
  readonly addDefinition: (draft: RecurringDraft) => Promise<RecurringMutationResult>
  readonly updateDefinition: (id: string, draft: RecurringDraft) => Promise<RecurringMutationResult>
  readonly deleteDefinition: (id: string) => Promise<RecurringMutationResult>
  readonly retryLoad: () => Promise<void>
}

const RecurringContext = createContext<RecurringContextValue | null>(null)

export function RecurringProvider({ children }: PropsWithChildren): React.ReactElement {
  const { isLoading: transactionsLoading, appendTransactions } = useTransactions()
  const [state, dispatch] = useReducer(reducer, initialState)
  const definitionsRef = useRef<readonly RecurringDefinition[]>([])
  const attemptedMonthsRef = useRef<Set<string>>(new Set())
  const restoreEpoch = useRestoreEpoch()

  const retryLoad = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStarted" })

    try {
      const definitions = await loadRecurringDefinitions()
      definitionsRef.current = definitions
      dispatch({ type: "loadSucceeded", definitions })
    } catch (error) {
      dispatch({ type: "loadFailed", message: getStorageMessage(error, "read") })
    }
  }, [])

  useEffect(() => {
    void retryLoad()
  }, [retryLoad, restoreEpoch])

  useEffect(() => {
    const currentMonth = toMonthKey(new Date())
    if (attemptedMonthsRef.current.has(currentMonth)) {
      return
    }
    if (state.isLoading || transactionsLoading || state.loadError !== null) {
      return
    }

    attemptedMonthsRef.current.add(currentMonth)

    const { added, updated } = computeDueRecurring(definitionsRef.current, currentMonth, new Date())

    void (async () => {
      if (updated.length > 0) {
        try {
          await persistRecurring(updated)
          definitionsRef.current = updated
          dispatch({ type: "loadSucceeded", definitions: updated })
        } catch {
          // Leave lastApplied untouched; the next session retries.
        }
      }

      if (added.length > 0) {
        await appendTransactions(added)
      }
    })()
  }, [appendTransactions, state.isLoading, state.loadError, transactionsLoading])

  const addDefinition = useCallback(async (draft: RecurringDraft): Promise<RecurringMutationResult> => {
    const definition = createRecurringDefinition(draft, toMonthKey(new Date()))
    const nextDefinitions = [...definitionsRef.current, definition]
    dispatch({ type: "saveStarted" })

    try {
      await persistRecurring(nextDefinitions)
      definitionsRef.current = nextDefinitions
      dispatch({ type: "loadSucceeded", definitions: nextDefinitions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const updateDefinition = useCallback(async (id: string, draft: RecurringDraft): Promise<RecurringMutationResult> => {
    const current = definitionsRef.current
    const existing = current.find((definition) => definition.id === id)
    if (existing === undefined) {
      return { ok: false, message: "Transaksi berulang tidak ditemukan." }
    }

    const updatedDefinition = buildUpdatedDefinition(existing, draft)
    const nextDefinitions = current.map((definition) => (definition.id === id ? updatedDefinition : definition))
    dispatch({ type: "saveStarted" })

    try {
      await persistRecurring(nextDefinitions)
      definitionsRef.current = nextDefinitions
      dispatch({ type: "loadSucceeded", definitions: nextDefinitions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const deleteDefinition = useCallback(async (id: string): Promise<RecurringMutationResult> => {
    const current = definitionsRef.current
    if (!current.some((definition) => definition.id === id)) {
      return { ok: false, message: "Transaksi berulang tidak ditemukan." }
    }

    const nextDefinitions = current.filter((definition) => definition.id !== id)
    dispatch({ type: "saveStarted" })

    try {
      await persistRecurring(nextDefinitions)
      definitionsRef.current = nextDefinitions
      dispatch({ type: "loadSucceeded", definitions: nextDefinitions })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const value = useMemo<RecurringContextValue>(
    () => ({ ...state, addDefinition, updateDefinition, deleteDefinition, retryLoad }),
    [addDefinition, deleteDefinition, retryLoad, state, updateDefinition],
  )

  return <RecurringContext.Provider value={value}>{children}</RecurringContext.Provider>
}

export function useRecurring(): RecurringContextValue {
  const context = useContext(RecurringContext)
  if (context === null) {
    throw new Error("useRecurring must be used within RecurringProvider")
  }

  return context
}
