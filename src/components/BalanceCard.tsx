import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { formatCurrency } from "../utils/currency"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { HeroCard } from "./HeroCard"

type BalanceCardProps = {
  readonly balance: number
  readonly monthLabel: string
  readonly isEmpty?: boolean
  readonly contextLabel?: string
  readonly animateAmount?: boolean
}

export function BalanceCard({ balance, monthLabel, isEmpty = false, contextLabel = "Saldo saat ini", animateAmount = true }: BalanceCardProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const positive = balance >= 0
  const tone = positive ? colors.income : colors.expense
  const toneSurface = positive ? colors.incomeSurface : colors.expenseSurface
  const stateLabel = isEmpty ? "Belum ada catatan" : positive ? "Keuangan terpantau" : "Perlu diperhatikan"

  return (
    <HeroCard
      accessibilityLabel={`${contextLabel} ${formatCurrency(balance)}. ${stateLabel}. ${monthLabel}`}
      amount={formatCurrency(balance)}
      animateAmount={animateAmount}
      eyebrow={contextLabel.toUpperCase()}
      footer={
        <View style={styles.bottomRow}>
          <Text style={styles.caption}>{isEmpty ? "Mulai dari satu catatan kecil" : `Ringkasan hingga ${monthLabel}`}</Text>
          <MaterialCommunityIcons color={colors.textTertiary} name="wallet-outline" size={18} />
        </View>
      }
      trailing={
        <View style={[styles.statusPill, { backgroundColor: toneSurface }]}>
          <View style={[styles.statusDot, { backgroundColor: tone }]} />
          <Text style={[styles.statusText, { color: tone }]}>{stateLabel}</Text>
        </View>
      }
    />
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bottomRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    caption: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    statusDot: {
      borderRadius: 999,
      height: 6,
      width: 6,
    },
    statusPill: {
      alignItems: "center",
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.unit,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    statusText: {
      fontSize: typography.caption.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.caption.lineHeight,
    },
  })
}
