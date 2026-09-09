import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import {
  selectRecentTransactions,
  selectTransactionsByQuery,
  selectTransactionsByType,
} from "../../src/features/transactions/selectors"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import type { Transaction, TransactionType } from "../../src/features/transactions/types"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCurrency } from "../../src/utils/currency"
import { formatDayGroupLabel, formatTimeOfDay, toMonthKey } from "../../src/utils/dates"

type TransactionFilter = "all" | TransactionType

const filterOptions: readonly { readonly value: TransactionFilter; readonly label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
]

function formatWeekday(day: string): string {
  const [yearValue, monthValue, dayValue] = day.split("-").map(Number)
  if (!yearValue || !monthValue || !dayValue) {
    return ""
  }
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(new Date(yearValue, monthValue - 1, dayValue))
}

export default function TransactionsScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const [query, setQuery] = useState("")
  const hasActiveFilters = filter !== "all" || query.trim().length > 0

  const filteredTransactions = useMemo(() => {
    let selected = transactions
    if (filter !== "all") {
      selected = selectTransactionsByType(selected, filter)
    }
    selected = selectTransactionsByQuery(selected, query)
    return selectRecentTransactions(selected, selected.length)
  }, [filter, query, transactions])

  const groups = useMemo(() => groupByDay(filteredTransactions), [filteredTransactions])

  // Ringkasan bulan berjalan dihitung nyata (bukan angka statis).
  const monthlySummary = useMemo(() => {
    const month = toMonthKey(new Date())
    let incomeTotal = 0
    let incomeCount = 0
    let expenseTotal = 0
    let expenseCount = 0
    for (const transaction of transactions) {
      if (toMonthKey(new Date(transaction.date)) !== month) {
        continue
      }
      if (transaction.type === "income") {
        incomeTotal += transaction.amount
        incomeCount += 1
      } else {
        expenseTotal += transaction.amount
        expenseCount += 1
      }
    }
    return { expenseCount, expenseTotal, incomeCount, incomeTotal }
  }, [transactions])

  return (
    <ScreenShell>
      <View style={styles.searchWell}>
        <MaterialCommunityIcons color={colors.textTertiary} name="magnify" size={20} />
        <TextInput
          accessibilityLabel="Cari transaksi"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Cari transaksi..."
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
            <MaterialCommunityIcons color={colors.textSecondary} name="close" size={18} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.chipsRow}>
        {filterOptions.map((option) => {
          const active = filter === option.value
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              key={option.value}
              onPress={() => setFilter(option.value)}
              style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{option.label}</Text>
            </Pressable>
          )
        })}
      </View>
      {/* Ringkasan bulan ini ala Stitch */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>Total Masuk</Text>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons color={colors.accent} name="arrow-down" size={14} />
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.income }]}>+{formatCurrency(monthlySummary.incomeTotal)}</Text>
          <Text style={styles.summarySub}>{monthlySummary.incomeCount} transaksi bulan ini</Text>
        </View>
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <Text style={styles.summaryLabel}>Total Keluar</Text>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons color={colors.error} name="arrow-up" size={14} />
            </View>
          </View>
          <Text style={[styles.summaryAmount, { color: colors.error }]}>-{formatCurrency(monthlySummary.expenseTotal)}</Text>
          <Text style={styles.summarySub}>{monthlySummary.expenseCount} transaksi bulan ini</Text>
        </View>
      </View>
      {isLoading ? (
        <EmptyState description="Menyiapkan daftar transaksi." title="Memuat catatan..." />
      ) : loadError ? (
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          actionLabel={hasActiveFilters ? "Lihat semua" : "Catat transaksi"}
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
                  setQuery("")
                }
              : () => router.push("/add-transaction")
          }
          title={hasActiveFilters ? "Tidak ada hasil" : "Belum ada transaksi"}
        />
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.day} style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{formatDayGroupLabel(group.day).toUpperCase()}</Text>
                <Text style={styles.groupWeekday}>{formatWeekday(group.day)}</Text>
              </View>
              <View style={styles.groupList}>
                {group.transactions.map((transaction) => (
                  <TransactionRow
                    colors={colors}
                    key={transaction.id}
                    onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } })}
                    styles={styles}
                    transaction={transaction}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScreenShell>
  )
}

type DayGroup = {
  readonly day: string
  readonly transactions: readonly Transaction[]
}

function groupByDay(transactions: readonly Transaction[]): readonly DayGroup[] {
  const groups = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    const day = transaction.date.slice(0, 10)
    const list = groups.get(day) ?? []
    list.push(transaction)
    groups.set(day, list)
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([day, list]) => ({ day, transactions: list }))
}

type TransactionScreenStyles = ReturnType<typeof createStyles>

type TransactionRowProps = {
  readonly colors: ThemeColors
  readonly onPress: () => void
  readonly styles: TransactionScreenStyles
  readonly transaction: Transaction
}

function TransactionRow({ colors, onPress, styles, transaction }: TransactionRowProps): React.ReactElement {
  const isIncome = transaction.type === "income"
  const amountColor = isIncome ? colors.income : colors.error
  const iconBackground = isIncome ? colors.incomeSurface : colors.expenseSurface
  const iconColor = isIncome ? colors.income : colors.error
  const sign = isIncome ? "+" : "-"

  return (
    <Pressable
      accessibilityLabel={`${transaction.note ?? transaction.category}, ${isIncome ? "Pemasukan" : "Pengeluaran"}, ${formatCurrency(transaction.amount)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.row, hovered && styles.rowHovered, pressed && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons color={iconColor} name={getCategoryIconName(transaction.category)} size={22} />
      </View>
      <View style={styles.rowInfo}>
        <Text numberOfLines={1} style={styles.rowTitle}>{transaction.note ?? transaction.category}</Text>
        <Text numberOfLines={1} style={styles.rowSubtitle}>
          {transaction.category} • {formatTimeOfDay(transaction.date)}
        </Text>
      </View>
      <Text style={[styles.rowAmount, { color: amountColor }]}>
        {sign}{formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    chipsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    chip: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.group,
      ...shadows.card,
    },
    chipActive: {
      backgroundColor: colors.accent,
    },
    chipLabel: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    chipLabelActive: {
      color: "#FFFFFF",
    },
    clearButton: {
      alignItems: "center",
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    group: {
      gap: spacing.sm,
    },
    groupHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
    },
    groupLabel: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    groupList: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      overflow: "hidden",
      ...shadows.card,
    },
    groupWeekday: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    groups: {
      gap: spacing.group,
    },
    iconHovered: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
    },
    rowAmount: {
      flexShrink: 0,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontVariant: ["tabular-nums"],
      fontWeight: "600",
      maxWidth: "40%",
      paddingLeft: spacing.md,
      textAlign: "right",
    },
    rowHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    rowIcon: {
      alignItems: "center",
      borderRadius: radii.pill,
      flexShrink: 0,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    rowInfo: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    rowSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      minHeight: 24,
      padding: 0,
    },
    searchWell: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.group,
      ...shadows.card,
    },
    summaryAmount: {
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyLarge.fontSize,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      flex: 1,
      gap: spacing.xs,
      padding: spacing.group,
      ...shadows.card,
    },
    summaryIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.bold,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    summaryRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    summarySub: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    summaryTop: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  })
}
