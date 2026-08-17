import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { MonthNavigator } from "../../src/components/MonthNavigator"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { SegmentedControl, type SegmentOption } from "../../src/components/SegmentedControl"
import { TransactionRow } from "../../src/components/TransactionRow"
import {
  selectRecentTransactions,
  selectTransactionsByQuery,
  selectTransactionsByType,
  selectTransactionsInMonth,
} from "../../src/features/transactions/selectors"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import type { TransactionType } from "../../src/features/transactions/types"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { shiftMonth, toMonthKey } from "../../src/utils/dates"

type TransactionFilter = "all" | TransactionType

const filterOptions: readonly SegmentOption[] = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Masuk" },
  { value: "expense", label: "Keluar" },
]

export default function TransactionsScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const [monthFilter, setMonthFilter] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const hasActiveFilters = filter !== "all" || monthFilter !== null || query.trim().length > 0

  const filteredTransactions = useMemo(() => {
    let selected = transactions
    if (filter !== "all") {
      selected = selectTransactionsByType(selected, filter)
    }
    if (monthFilter !== null) {
      selected = selectTransactionsInMonth(selected, monthFilter)
    }
    selected = selectTransactionsByQuery(selected, query)
    return selectRecentTransactions(selected, selected.length)
  }, [filter, monthFilter, query, transactions])

  function stepMonth(delta: number): void {
    setMonthFilter((current) => shiftMonth(current ?? toMonthKey(new Date()), delta))
  }

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.overline}>RIWAYAT</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Semua transaksi</Text>
          <Pressable
            accessibilityLabel="Kelola data transaksi"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push("/data")}
            style={({ pressed, hovered }) => [styles.dataButton, hovered && styles.iconHovered, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textSecondary} name="database-export-outline" size={20} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Cari, saring, dan telusuri catatan pemasukan maupun pengeluaranmu.</Text>
      </View>
      <View style={styles.searchWell}>
        <MaterialCommunityIcons color={colors.textTertiary} name="magnify" size={20} />
        <TextInput
          accessibilityLabel="Cari transaksi"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Cari catatan atau kategori"
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          value={query}
        />
        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Hapus pencarian"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setQuery("")}
            style={({ pressed, hovered }) => [styles.clearButton, hovered && styles.iconHovered, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textSecondary} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>
      <SegmentedControl
        accessibilityLabel="Filter daftar transaksi"
        onChange={(value) => {
          if (isTransactionFilter(value)) {
            setFilter(value)
          }
        }}
        options={filterOptions}
        selectedValue={filter}
      />
      <MonthNavigator
        canGoNext={monthFilter === null || monthFilter !== toMonthKey(new Date())}
        month={monthFilter}
        onClear={() => setMonthFilter(null)}
        onNext={() => stepMonth(1)}
        onPrev={() => stepMonth(-1)}
      />
      {isLoading ? (
        <EmptyState description="Menyiapkan daftar transaksi." title="Memuat catatan..." />
      ) : loadError ? (
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          actionLabel={hasActiveFilters ? "Lihat semua" : undefined}
          description={
            hasActiveFilters
              ? "Tidak ada transaksi yang cocok dengan pencarian atau filter ini."
              : "Catatan yang kamu tambahkan akan muncul di sini."
          }
          icon={hasActiveFilters ? "magnify-close" : "receipt-text-outline"}
          onAction={
            hasActiveFilters
              ? () => {
                  setFilter("all")
                  setMonthFilter(null)
                  setQuery("")
                }
              : undefined
          }
          title={hasActiveFilters ? "Tidak ada hasil" : "Belum ada transaksi"}
        />
      ) : (
        <View style={styles.listCard}>
          {filteredTransactions.map((transaction, index) => (
            <TransactionRow
              key={transaction.id}
              last={index === filteredTransactions.length - 1}
              onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } })}
              transaction={transaction}
            />
          ))}
        </View>
      )}
      <PrimaryButton icon="plus" label="Tambah transaksi" onPress={() => router.push("/add-transaction")} />
    </ScreenShell>
  )
}

function isTransactionFilter(value: string): value is TransactionFilter {
  return value === "all" || value === "income" || value === "expense"
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    clearButton: {
      alignItems: "center",
      height: 36,
      justifyContent: "center",
      width: 32,
    },
    dataButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    iconHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    header: {
      gap: spacing.compact,
      paddingBottom: spacing.sm,
    },
    listCard: {
      gap: 0,
    },
    overline: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      lineHeight: typography.body.lineHeight,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
    },
    searchWell: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      paddingHorizontal: spacing.md,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
    },
    titleRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  })
}
