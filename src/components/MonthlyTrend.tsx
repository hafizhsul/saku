import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import type { MonthlyNetPoint } from "../features/transactions/selectors"
import { formatCompactCurrency } from "../utils/currency"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

type MonthlyTrendProps = {
  readonly points: readonly MonthlyNetPoint[]
}

export function MonthlyTrend({ points }: MonthlyTrendProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const maxAbsolute = Math.max(...points.map((point) => Math.abs(point.net)), 1)

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Tren 6 bulan</Text>
        <Text style={styles.caption}>Netto per bulan</Text>
      </View>
      <View style={styles.list}>
        {points.map((point) => {
          const positive = point.net >= 0
          const ratio = Math.abs(point.net) / maxAbsolute
          const width = `${Math.max(Math.round(ratio * 100), point.net === 0 ? 0 : 4)}%` as const

          return (
            <View
              accessible
              accessibilityLabel={`${formatMonthName(point.month)}, netto ${formatCompactCurrency(point.net)}`}
              key={point.month}
              style={styles.row}
            >
              <Text style={styles.month}>{point.label}</Text>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: positive ? colors.income : colors.expense, width },
                  ]}
                />
              </View>
              <Text style={[styles.value, { color: positive ? colors.income : colors.expense }]}>
                {formatCompactCurrency(point.net)}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

function formatMonthName(month: string): string {
  const [yearValue, monthValue] = month.split("-").map(Number)
  if (!yearValue || !monthValue) {
    return month
  }

  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(yearValue, monthValue - 1, 1))
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    caption: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    fill: {
      borderRadius: radii.pill,
      height: "100%",
      minWidth: 4,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.group,
      padding: spacing.lg,
      ...shadows.card,
    },
    month: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      width: 44,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    section: {
      gap: spacing.group,
    },
    track: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      flex: 1,
      height: 8,
      overflow: "hidden",
    },
    value: {
      fontSize: typography.caption.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.caption.lineHeight,
      minWidth: 72,
      textAlign: "right",
    },
  })
}
