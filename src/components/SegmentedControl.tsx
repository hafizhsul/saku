import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

export type SegmentOption = {
  readonly value: string
  readonly label: string
}

type SegmentedControlProps = {
  readonly options: readonly SegmentOption[]
  readonly selectedValue: string
  readonly onChange: (value: string) => void
  readonly accessibilityLabel: string
}

export function SegmentedControl({
  options,
  selectedValue,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View accessibilityLabel={accessibilityLabel} accessibilityRole="tablist" style={styles.container}>
      {options.map((option) => {
        const selected = option.value === selectedValue

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.option, selected && styles.selected, pressed && styles.pressed]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.unit,
      minHeight: 50,
      padding: 4,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      textAlign: "center",
    },
    option: {
      alignItems: "center",
      borderRadius: radii.pill,
      flex: 1,
      justifyContent: "center",
      minHeight: 42,
      paddingHorizontal: spacing.sm,
    },
    pressed: {
      opacity: 0.7,
    },
    selected: {
      backgroundColor: colors.surfaceElevated,
      ...shadows.card,
    },
    selectedLabel: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
  })
}
