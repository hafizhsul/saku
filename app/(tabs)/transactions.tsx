import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ProfileHeaderButton } from "../../src/components/ProfileHeaderButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import {
  selectRecentTransactions,
  selectTransactionsByQuery,
  selectTransactionsByType,
} from "../../src/features/transactions/selectors"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import type { Transaction, TransactionType } from "../../src/features/transactions/types"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCurrency } from "../../src/utils/currency"
import { formatDayGroupLabel, formatTimeOfDay } from "../../src/utils/dates"

type TransactionFilter = "all" | TransactionType

const filterOptions: readonly { readonly value: TransactionFilter; readonly label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
]

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

  return (
    <ScreenShell>
      <Header colors={colors} styles={styles} />
      <View style={styles.searchWell}>
        <MaterialCommunityIcons color={colors.textTertiary} name="magnify" size={22} />
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
            <MaterialCommunityIcons color={colors.textSecondary} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={styles.chipsRow} horizontal showsHorizontalScrollIndicator={false}>
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
      </ScrollView>
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
                  setQuery("")
                }
              : undefined
          }
          title={hasActiveFilters ? "Tidak ada hasil" : "Belum ada transaksi"}
        />
      ) : (
        <View style={styles.groups}>
          {groups.map((group) => (
            <View key={group.day} style={styles.group}>
              <Text style={styles.groupLabel}>{formatDayGroupLabel(group.day).toUpperCase()}</Text>
              <View style={styles.groupList}>
                {group.transactions.map((transaction) => (
                  <TransactionCard
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

function Header({ colors, styles }: { readonly colors: ThemeColors; readonly styles: TransactionScreenStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../assets/images/screen.png")}
          style={styles.brandIcon}
        />
        <Text style={styles.headerTitle}>Riwayat</Text>
      </View>
      <ProfileHeaderButton />
    </View>
  )
}

type TransactionCardProps = {
  readonly colors: ThemeColors
  readonly onPress: () => void
  readonly styles: TransactionScreenStyles
  readonly transaction: Transaction
}

function TransactionCard({ colors, onPress, styles, transaction }: TransactionCardProps): React.ReactElement {
  const isIncome = transaction.type === "income"
  const amountColor = isIncome ? colors.income : colors.expense
  const iconBackground = isIncome ? colors.incomeSurface : colors.expenseSurface
  const iconColor = isIncome ? colors.income : colors.expense
  const sign = isIncome ? "+" : "-"

  return (
    <Pressable
      accessibilityLabel={`${transaction.note ?? transaction.category}, ${isIncome ? "Pemasukan" : "Pengeluaran"}, ${formatCurrency(transaction.amount)}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [styles.card, hovered && styles.cardHovered, pressed && styles.cardPressed]}
    >
      <View style={[styles.cardIcon, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons color={iconColor} name={getCategoryIconName(transaction.category)} size={20} />
      </View>
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.cardTitle}>{transaction.note ?? transaction.category}</Text>
        <Text style={styles.cardTime}>{formatTimeOfDay(transaction.date)}</Text>
      </View>
      <Text style={[styles.cardAmount, { color: amountColor }]}>
        {sign}{formatCurrency(transaction.amount)}
      </Text>
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    brandIcon: {
      borderRadius: radii.sm,
      height: 36,
      width: 36,
    },
    card: {
      alignItems: "center",
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.row,
      padding: spacing.group,
      ...{
        shadowColor: colors.accent,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
    },
    cardAmount: {
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontVariant: ["tabular-nums"],
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
      maxWidth: "40%",
      textAlign: "right",
    },
    cardHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    cardIcon: {
      alignItems: "center",
      borderRadius: radii.pill,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    cardInfo: {
      flex: 1,
      gap: 2,
    },
    cardPressed: {
      opacity: 0.72,
    },
    cardTime: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    chip: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      height: 40,
      justifyContent: "center",
      paddingHorizontal: spacing.group,
    },
    chipActive: {
      backgroundColor: colors.accent,
      ...{
        shadowColor: colors.accent,
        shadowOffset: { height: 10, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 30,
      },
    },
    chipLabel: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    chipLabelActive: {
      color: colors.surface,
    },
    chipsRow: {
      gap: spacing.sm,
      paddingRight: spacing.xl,
    },
    clearButton: {
      alignItems: "center",
      height: 36,
      justifyContent: "center",
      width: 32,
    },
    group: {
      gap: spacing.sm,
    },
    groupLabel: {
      color: colors.textTertiary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
    },
    groupList: {
      gap: spacing.xs,
    },
    groups: {
      gap: spacing.lg,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: spacing.compact,
    },
    headerLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
    },
    iconHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    pressed: {
      opacity: 0.72,
    },
    profileButton: {
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    profileButtonHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    searchInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      lineHeight: typography.body.lineHeight,
      minHeight: 52,
      paddingHorizontal: spacing.sm,
    },
    searchWell: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.lg,
      flexDirection: "row",
      minHeight: 52,
      paddingHorizontal: spacing.group,
      ...{
        shadowColor: colors.accent,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
    },
  })
}
