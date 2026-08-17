import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { formatCurrency } from "../utils/currency"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

type StatCardProps = {
  readonly type: "income" | "expense"
  readonly amount: number
  readonly periodLabel?: string
}

export function StatCard({ type, amount, periodLabel = "Bulan ini" }: StatCardProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const config = statConfig(colors)[type]

  return (
    <View accessible accessibilityLabel={`${config.label} ${periodLabel} ${formatCurrency(amount)}`} style={styles.card}>
      <View style={[styles.iconWell, { backgroundColor: config.surface }]}>
        <MaterialCommunityIcons name={config.icon} size={18} color={config.color} />
      </View>
      <Text style={styles.label}>{config.label}</Text>
      <Text style={[styles.amount, { color: config.color }]}>{formatCurrency(amount)}</Text>
      <Text style={styles.caption}>{periodLabel}</Text>
    </View>
  )
}

function statConfig(colors: ThemeColors): Record<"income" | "expense", { readonly label: string; readonly icon: "arrow-down-left" | "arrow-up-right"; readonly color: string; readonly surface: string }> {
  return {
    income: { label: "Pemasukan", icon: "arrow-down-left", color: colors.income, surface: colors.incomeSurface },
    expense: { label: "Pengeluaran", icon: "arrow-up-right", color: colors.expense, surface: colors.expenseSurface },
  }
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    amount: {
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
      marginTop: spacing.xs,
    },
    card: {
      flex: 1,
      minWidth: 150,
    },
    caption: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      marginTop: spacing.xs,
    },
    iconWell: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      marginTop: spacing.md,
    },
  })
}
