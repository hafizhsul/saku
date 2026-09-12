import type { ReactNode } from "react"
import { View } from "react-native"

import { ErrorState } from "./ErrorState"
import { PartialState } from "./PartialState"

export type DataStateStatus = "loading" | "error" | "empty" | "success"

export function resolveDataState(args: {
  readonly loading: boolean
  readonly error: string | null
  readonly isEmpty: boolean
}): DataStateStatus {
  if (args.loading) return "loading"
  if (args.error) return "error"
  if (args.isEmpty) return "empty"
  return "success"
}

type DataStateProps = {
  readonly loading: boolean
  readonly error: string | null
  readonly isEmpty: boolean
  readonly onRetry: () => void
  readonly loadingFallback: ReactNode
  readonly emptyFallback: ReactNode
  readonly partial: { readonly message: string; readonly onRetry?: () => void } | null
  readonly children: ReactNode
}

export function DataState({
  loading,
  error,
  isEmpty,
  onRetry,
  loadingFallback,
  emptyFallback,
  partial,
  children,
}: DataStateProps): React.ReactElement {
  const status = resolveDataState({ loading, error, isEmpty })
  if (status === "loading") {
    return <View accessibilityState={{ busy: true }}>{loadingFallback}</View>
  }
  if (status === "error") {
    return <ErrorState description={error ?? ""} onRetry={onRetry} title="Data belum siap" />
  }
  if (status === "empty") {
    return <>{emptyFallback}</>
  }
  return (
    <>
      {partial !== null ? <PartialState message={partial.message} onRetry={partial.onRetry} /> : null}
      {children}
    </>
  )
}
