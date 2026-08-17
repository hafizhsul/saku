import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { formatMonthLabel, toMonthKey } from "../utils/dates"

type MonthNavigatorProps = {
  readonly month: string | null
  readonly onPrev: () => void
  readonly onNext: () => void
  readonly onClear?: () => void
  readonly canGoNext?: boolean
}

export function MonthNavigator({ month, onPrev, onNext, onClear, canGoNext = true }: MonthNavigatorProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isCurrentMonth = month !== null && month === toMonthKey(new Date())
  const nextEnabled = canGoNext && !isCurrentMonth
  const label = month === null ? "Semua bulan" : formatMonthLabel(month)

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel="Bulan sebelumnya"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onPrev}
        style={({ pressed, hovered }) => [styles.navButton, hovered && styles.navHovered, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textPrimary} name="chevron-left" size={24} />
      </Pressable>
      <View style={styles.labelWell}>
        <Text style={styles.label}>{label}</Text>
        {month !== null && onClear ? (
          <Pressable
            accessibilityLabel="Tampilkan semua bulan"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClear}
            style={({ pressed, hovered }) => [styles.clearButton, hovered && styles.navHovered, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textSecondary} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel="Bulan berikutnya"
        accessibilityRole="button"
        accessibilityState={{ disabled: !nextEnabled }}
        disabled={!nextEnabled}
        hitSlop={10}
        onPress={onNext}
        style={({ pressed, hovered }) => [styles.navButton, hovered && nextEnabled && styles.navHovered, !nextEnabled && styles.navDisabled, pressed && nextEnabled && styles.pressed]}
      >
        <MaterialCommunityIcons color={nextEnabled ? colors.textPrimary : colors.textTertiary} name="chevron-right" size={24} />
      </Pressable>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    clearButton: {
      alignItems: "center",
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    container: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      padding: 4,
    },
    label: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      textAlign: "center",
    },
    labelWell: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.unit,
      justifyContent: "center",
      paddingHorizontal: spacing.xs,
    },
    navButton: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    navDisabled: {
      opacity: 0.45,
    },
    navHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    pressed: {
      opacity: 0.72,
    },
  })
}
