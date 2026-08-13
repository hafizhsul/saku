import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { spacing, typography, useThemeColors, type ThemeColors } from "../theme"

type FieldProps = {
  readonly label: string
  readonly hint?: string
  readonly error?: string
  readonly children: React.ReactNode
}

export function Field({ label, hint, error, children }: FieldProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    error: {
      color: colors.error,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      marginTop: spacing.xs,
    },
    field: {
      gap: spacing.compact,
    },
    hint: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    label: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
  })
}
