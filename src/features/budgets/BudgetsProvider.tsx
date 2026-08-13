import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type PropsWithChildren,
} from "react"

import { useRestoreEpoch } from "../backup/BackupProvider"

import {
  loadBudgets,
  saveBudgets as persistBudgets,
  BudgetsStorageError,
} from "../../storage/budgets"
import type { BudgetsMap } from "./types"

type SaveState = "idle" | "saving" | "saved" | "error"

type BudgetsState = {
  readonly budgets: BudgetsMap
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly saveState: SaveState
}

type BudgetsAction =
  | { readonly type: "loadStarted" }
  | { readonly type: "loadSucceeded"; readonly budgets: BudgetsMap }
  | { readonly type: "loadFailed"; readonly message: string }
  | { readonly type: "saveStarted" }
  | { readonly type: "saveSucceeded" }
  | { readonly type: "saveFailed"; readonly message: string }

const initialState: BudgetsState = {
  budgets: {},
  isLoading: true,
  loadError: null,
  saveState: "idle",
}

function reducer(state: BudgetsState, action: BudgetsAction): BudgetsState {
  switch (action.type) {
    case "loadStarted":
      return { ...state, isLoading: true, loadError: null }
    case "loadSucceeded":
      return { ...state, isLoading: false, loadError: null, budgets: action.budgets }
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
  if (error instanceof BudgetsStorageError) {
    return operation === "read"
      ? "Anggaran belum bisa dimuat. Coba lagi."
      : "Anggaran belum tersimpan. Coba lagi."
  }

  return operation === "read"
    ? "Anggaran belum bisa dimuat. Coba lagi."
    : "Anggaran belum tersimpan. Coba lagi."
}

export type SaveBudgetsResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string }

type BudgetsContextValue = BudgetsState & {
  readonly saveBudgets: (budgets: BudgetsMap) => Promise<SaveBudgetsResult>
  readonly retryLoad: () => Promise<void>
}

const BudgetsContext = createContext<BudgetsContextValue | null>(null)

export function BudgetsProvider({ children }: PropsWithChildren): React.ReactElement {
  const [state, dispatch] = useReducer(reducer, initialState)
  const restoreEpoch = useRestoreEpoch()

  const retryLoad = useCallback(async (): Promise<void> => {
    dispatch({ type: "loadStarted" })

    try {
      const budgets = await loadBudgets()
      dispatch({ type: "loadSucceeded", budgets })
    } catch (error) {
      dispatch({ type: "loadFailed", message: getStorageMessage(error, "read") })
    }
  }, [])

  useEffect(() => {
    void retryLoad()
  }, [retryLoad, restoreEpoch])

  const saveBudgets = useCallback(async (budgets: BudgetsMap): Promise<SaveBudgetsResult> => {
    dispatch({ type: "saveStarted" })

    try {
      await persistBudgets(budgets)
      dispatch({ type: "loadSucceeded", budgets })
      dispatch({ type: "saveSucceeded" })
      return { ok: true }
    } catch (error) {
      dispatch({ type: "saveFailed", message: getStorageMessage(error, "write") })
      return { ok: false, message: getStorageMessage(error, "write") }
    }
  }, [])

  const value = useMemo<BudgetsContextValue>(
    () => ({ ...state, saveBudgets, retryLoad }),
    [retryLoad, saveBudgets, state],
  )

  return <BudgetsContext.Provider value={value}>{children}</BudgetsContext.Provider>
}

export function useBudgets(): BudgetsContextValue {
  const context = useContext(BudgetsContext)
  if (context === null) {
    throw new Error("useBudgets must be used within BudgetsProvider")
  }

  return context
}
