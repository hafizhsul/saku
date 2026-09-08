import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { darkColors, fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

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

// Warna toggle persis dari referensi Stitch "Tambah Transaksi"
// (mode terang): track #dbe8e2/50 + border saku-border/40, pill putih,
// label aktif saku-primary #006B50 + dot, nonaktif slate-500.
const TRACK_LIGHT = "rgba(219, 232, 226, 0.5)"
const TRACK_BORDER_LIGHT = "rgba(227, 232, 229, 0.4)"
const ACTIVE_LABEL_LIGHT = "#006B50"
const INACTIVE_LABEL_LIGHT = "#64748b"

export function SegmentedControl({
  options,
  selectedValue,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps): React.ReactElement {
  const colors = useThemeColors()
  const isDark = colors.canvas === darkColors.canvas
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark])

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
            <View style={styles.optionContent}>
              {selected ? <View style={styles.dot} /> : null}
              <Text style={[styles.label, selected && styles.selectedLabel]}>{option.label}</Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    container: {
      backgroundColor: isDark ? colors.surfaceMuted : TRACK_LIGHT,
      borderColor: isDark ? colors.border : TRACK_BORDER_LIGHT,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.unit,
      minHeight: 50,
      padding: 4,
    },
    dot: {
      backgroundColor: isDark ? colors.accent : ACTIVE_LABEL_LIGHT,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    label: {
      color: isDark ? colors.textSecondary : INACTIVE_LABEL_LIGHT,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      textAlign: "center",
    },
    option: {
      alignItems: "center",
      borderRadius: radii.md,
      flex: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.sm,
    },
    optionContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.unit,
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.7,
    },
    selected: {
      backgroundColor: isDark ? colors.surfaceElevated : "#FFFFFF",
      ...shadows.card,
    },
    selectedLabel: {
      color: isDark ? colors.textPrimary : ACTIVE_LABEL_LIGHT,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
  })
}
