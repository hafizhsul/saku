import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import type { CategoryBreakdownItem } from "../features/transactions/selectors"
import { formatCurrency } from "../utils/currency"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { CategoryIcon } from "./CategoryIcon"
import { EmptyState } from "./EmptyState"

type CategoryBreakdownProps = {
  readonly items: readonly CategoryBreakdownItem[]
}

function budgetState(item: CategoryBreakdownItem): { readonly ratio: number; readonly label: string; readonly tone: "normal" | "warning" | "over" } {
  const budget = item.budget
  if (budget === undefined) {
    return { ratio: item.percentage / 100, label: `${item.percentage}%`, tone: "normal" }
  }

  const ratio = item.amount / budget
  if (ratio > 1) {
    return { ratio: 1, label: "Melebihi anggaran", tone: "over" }
  }

  const percent = Math.round(ratio * 100)
  return {
    ratio,
    label: percent >= 80 ? `Mendekati batas · ${percent}%` : `${percent}%`,
    tone: percent >= 80 ? "warning" : "normal",
  }
}

export function CategoryBreakdown({ items }: CategoryBreakdownProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Pengeluaran berdasarkan kategori</Text>
        <Text style={styles.caption}>{items.length ? `${items.length} kategori` : "Belum ada"}</Text>
      </View>
      {items.length === 0 ? (
        <EmptyState
          description="Kategori akan muncul setelah kamu mencatat pengeluaran."
          icon="chart-donut"
          title="Belum ada pengeluaran bulan ini"
        />
      ) : (
        <View style={styles.list}>
          {items.map((item, index) => (
            <BudgetRow colors={colors} item={item} key={item.category} last={index === items.length - 1} styles={styles} />
          ))}
        </View>
      )}
    </View>
  )
}

type BudgetRowProps = {
  readonly item: CategoryBreakdownItem
  readonly colors: ThemeColors
  readonly last: boolean
  readonly styles: ReturnType<typeof createStyles>
}

function BudgetRow({ item, colors, last, styles }: BudgetRowProps): React.ReactElement {
  const state = budgetState(item)
  const barColor = state.tone === "warning" ? colors.warning : colors.expense
  const budget = item.budget

  const accessibilityLabel = budget === undefined
    ? `${item.category}, ${formatCurrency(item.amount)}, ${item.percentage} persen`
    : `${item.category}, ${formatCurrency(item.amount)}, ${state.label.toLowerCase()} dari anggaran ${formatCurrency(budget)}`

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[styles.row, last && styles.rowLast]}>
      <CategoryIcon category={item.category} tone="expense" size={20} />
      <View style={styles.main}>
        <View style={styles.rowHeader}>
          <Text numberOfLines={1} style={styles.category}>{item.category}</Text>
          <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progress, { backgroundColor: barColor, width: `${Math.round(state.ratio * 100)}%` }]} />
        </View>
        {budget !== undefined ? (
          <Text style={[styles.budgetCaption, state.tone === "over" && styles.budgetCaptionOver]}>
            {state.tone === "over" ? `Melebihi ${formatCurrency(item.amount - budget)}` : `dari anggaran ${formatCurrency(budget)}`}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.percentage, state.tone === "warning" && styles.percentageWarning, state.tone === "over" && styles.percentageOver]}>
        {state.label}
      </Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    budgetCaption: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    budgetCaptionOver: {
      color: colors.expense,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    caption: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    category: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    heading: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
    },
    headingRow: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: spacing.compact,
    },
    list: {
      gap: 0,
    },
    main: {
      flex: 1,
      gap: spacing.unit,
    },
    percentage: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.caption.lineHeight,
      maxWidth: 96,
      textAlign: "right",
    },
    percentageOver: {
      color: colors.expense,
    },
    percentageWarning: {
      color: colors.warning,
    },
    progress: {
      borderRadius: radii.pill,
      height: "100%",
      minWidth: 4,
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      height: 6,
      overflow: "hidden",
      width: "100%",
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.compact,
      paddingVertical: spacing.md,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    section: {
      gap: spacing.group,
    },
    value: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontVariant: ["tabular-nums"],
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
  })
}
