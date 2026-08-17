import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { selectCategoryTrends } from "../features/transactions/selectors"
import type { Transaction } from "../features/transactions/types"
import { formatShortMonthLabel, shiftMonth } from "../utils/dates"
import { formatCompactCurrency } from "../utils/currency"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { CategoryIcon } from "./CategoryIcon"

type CategoryTrendChartProps = {
  readonly transactions: readonly Transaction[]
  readonly month: string
  readonly count?: number
}

export function CategoryTrendChart({ transactions, month, count = 6 }: CategoryTrendChartProps): React.ReactElement | null {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const trends = useMemo(() => selectCategoryTrends(transactions, month, count), [count, month, transactions])
  const months = useMemo(() => {
    const result: string[] = []
    let current = month
    for (let index = 0; index < count; index += 1) {
      result.unshift(current)
      current = shiftMonth(current, -1)
    }
    return result
  }, [count, month])

  if (trends.length === 0) {
    return null
  }

  const maxValue = Math.max(...trends.flatMap((trend) => [...trend.values]), 1)

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Tren pengeluaran per kategori</Text>
        <Text style={styles.caption}>{count} bulan</Text>
      </View>
      <View style={styles.list}>
        {trends.map((trend) => (
          <View
            accessible
            accessibilityLabel={`${trend.category}, pengeluaran per bulan: ${months.map((value, index) => `${formatShortMonthLabel(value)} ${formatCompactCurrency(trend.values[index] ?? 0)}`).join(", ")}`}
            key={trend.category}
            style={styles.row}
          >
            <View style={styles.rowHeader}>
              <CategoryIcon category={trend.category} tone="expense" size={20} />
              <Text numberOfLines={1} style={styles.category}>{trend.category}</Text>
              <Text style={[styles.latest, trend.latest > 0 && styles.latestPositive]}>
                {formatCompactCurrency(trend.latest)}
              </Text>
            </View>
            <View style={styles.bars}>
              {trend.values.map((value, index) => {
                const height = value === 0 ? 2 : Math.max(Math.round((value / maxValue) * 32), 4)
                const isLatest = index === trend.values.length - 1

                return (
                  <View key={months[index]} style={styles.barSlot}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: isLatest ? colors.action : colors.expense },
                        ]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{formatShortMonthLabel(months[index] ?? "")}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      borderRadius: radii.pill,
      minWidth: 4,
    },
    barLabel: {
      color: colors.textTertiary,
      fontSize: 9,
      fontFamily: fontFamilies.medium,
      fontWeight: "500",
      lineHeight: 12,
      textAlign: "center",
    },
    barSlot: {
      flex: 1,
      gap: spacing.xs,
    },
    barTrack: {
      alignItems: "flex-end",
      height: 34,
      justifyContent: "flex-end",
    },
    bars: {
      flexDirection: "row",
      gap: spacing.compact,
      paddingLeft: spacing["2xl"] + spacing.compact,
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
    latest: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.caption.lineHeight,
    },
    latestPositive: {
      color: colors.expense,
    },
    list: {
      gap: spacing.lg,
    },
    row: {
      gap: spacing.sm,
    },
    rowHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
    },
    section: {
      gap: spacing.group,
    },
  })
}
