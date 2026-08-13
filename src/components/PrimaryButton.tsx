import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

type ButtonVariant = "primary" | "secondary" | "danger"

type PrimaryButtonProps = {
  readonly label: string
  readonly onPress: () => void
  readonly icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"]
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly success?: boolean
  readonly variant?: ButtonVariant
  readonly accessibilityLabel?: string
}

type VariantPalette = { readonly background: string; readonly pressedBackground: string; readonly foreground: string; readonly borderColor?: string }

function variantStyles(colors: ThemeColors): Record<ButtonVariant, VariantPalette> {
  return {
    primary: { background: colors.action, pressedBackground: colors.actionPressed, foreground: colors.surfaceElevated },
    secondary: { background: colors.surface, pressedBackground: colors.surfaceMuted, foreground: colors.textPrimary, borderColor: colors.borderStrong },
    danger: { background: colors.expense, pressedBackground: colors.expense, foreground: colors.surfaceElevated },
  }
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
  success = false,
  variant = "primary",
  accessibilityLabel,
}: PrimaryButtonProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(), [])
  const isDisabled = disabled || loading || success
  const displayedLabel = success ? "Tersimpan" : loading ? "Menyimpan..." : label
  const palette = variantStyles(colors)[variant]

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? displayedLabel}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        { backgroundColor: palette.background, borderColor: palette.borderColor },
        pressed && { backgroundColor: palette.pressedBackground },
        hovered && !pressed && !isDisabled && styles.hovered,
        variant === "primary" && styles.primaryShadow,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {success ? <MaterialCommunityIcons name="check" size={20} color={palette.foreground} /> : null}
        {!success && icon ? <MaterialCommunityIcons name={icon} size={20} color={palette.foreground} /> : null}
        <Text style={[styles.label, { color: palette.foreground }]}>{displayedLabel}</Text>
      </View>
    </Pressable>
  )
}

function createStyles() {
  return StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: radii.pill,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 54,
      paddingHorizontal: spacing.xl,
    },
    content: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
    },
    disabled: {
      opacity: 0.55,
    },
    hovered: {
      opacity: 0.92,
    },
    label: {
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    pressed: {
      opacity: 0.94,
      transform: [{ scale: 0.985 }],
    },
    primaryShadow: {
      ...shadows.card,
    },
  })
}
