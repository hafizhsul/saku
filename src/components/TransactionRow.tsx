import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import type { Transaction } from "../features/transactions/types"
import { formatSignedCurrency } from "../utils/currency"
import { formatRelativeTransactionTime } from "../utils/dates"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { CategoryIcon } from "./CategoryIcon"

type TransactionRowProps = {
  readonly transaction: Transaction
  readonly compact?: boolean
  readonly last?: boolean
  readonly card?: boolean
  readonly onPress?: () => void
}

export function TransactionRow({ transaction, compact = false, last = false, card = false, onPress }: TransactionRowProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isIncome = transaction.type === "income"
  const typeLabel = isIncome ? "Pemasukan" : "Pengeluaran"
  const tone = isIncome ? "income" : "expense"

  return (
    <Pressable
      accessibilityLabel={`${transaction.note ?? transaction.category}, ${typeLabel}, ${transaction.category}, ${formatRelativeTransactionTime(transaction.date)}, ${formatSignedCurrency(transaction.amount, transaction.type)}`}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        compact && styles.compact,
        last && styles.last,
        card && styles.card,
        hovered && styles.hovered,
        pressed && styles.pressed,
      ]}
    >
      <CategoryIcon category={transaction.category} tone={tone} size={compact ? 18 : 20} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>{transaction.note ?? transaction.category}</Text>
        <Text numberOfLines={1} style={styles.meta}>{formatRelativeTransactionTime(transaction.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
        {formatSignedCurrency(transaction.amount, transaction.type)}
      </Text>
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    amount: {
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.bodyMedium.lineHeight,
      maxWidth: "40%",
      textAlign: "right",
    },
    card: {
      backgroundColor: colors.surfaceElevated,
      borderBottomWidth: 0,
      borderRadius: radii.lg,
      padding: spacing.group,
      ...{
        shadowColor: colors.accent,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
      },
    },
    compact: {
      paddingVertical: spacing.sm,
    },
    hovered: {
      backgroundColor: colors.surfaceMuted,
    },
    info: {
      flex: 1,
      gap: spacing.unit,
    },
    last: {
      borderBottomWidth: 0,
    },
    meta: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      minHeight: 68,
      paddingVertical: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
  })
}
