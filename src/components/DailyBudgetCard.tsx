import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { formatCurrency } from "../utils/currency"

type DailyBudgetCardProps = {
  readonly remaining: number
  readonly daily: number
  readonly daysLeft: number
  readonly onPress: () => void
}

export function DailyBudgetCard({ remaining, daily, daysLeft, onPress }: DailyBudgetCardProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      accessibilityLabel={`Sisa harian ${formatCurrency(daily)}, sisa bulan ini ${formatCurrency(remaining)}, ${daysLeft} hari tersisa`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconWell}>
        <MaterialCommunityIcons color={colors.accent} name="calendar-clock-outline" size={20} />
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>SISA HARIAN</Text>
        <Text style={styles.valueSmall}>{formatCurrency(daily)}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoRight}>
        <Text style={styles.label}>SISA BULAN INI</Text>
        <Text style={styles.valueSmall}>{formatCurrency(remaining)}</Text>
      </View>
      <MaterialCommunityIcons color={colors.textTertiary} name="chevron-right" size={20} />
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      padding: spacing.lg,
    },
    divider: {
      backgroundColor: colors.border,
      height: 32,
      width: 1,
    },
    iconWell: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    info: {
      flex: 1,
      gap: spacing.unit,
    },
    infoRight: {
      alignItems: "flex-end",
      flex: 1,
      gap: spacing.unit,
    },
    label: {
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
    valueSmall: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: fontFamilies.semibold,
      fontVariant: ["tabular-nums"],
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
  })
}
