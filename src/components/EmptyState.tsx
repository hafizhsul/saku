import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo, type ComponentProps } from "react"
import { StyleSheet, Text, View } from "react-native"

import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { PrimaryButton } from "./PrimaryButton"

type EmptyStateProps = {
  readonly title: string
  readonly description: string
  readonly actionLabel?: string
  readonly onAction?: () => void
  readonly error?: boolean
  readonly icon?: ComponentProps<typeof MaterialCommunityIcons>["name"]
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  error = false,
  icon = error ? "alert-circle-outline" : "notebook-outline",
}: EmptyStateProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View accessibilityLiveRegion={error ? "polite" : "none"} style={styles.container}>
      <View style={[styles.iconWell, error && styles.errorWell]}>
        <View style={styles.halo} />
        <MaterialCommunityIcons name={icon} size={32} color={error ? colors.error : colors.accent} />
        {!error ? (
          <View style={styles.badge}>
            <MaterialCommunityIcons color={colors.surfaceElevated} name="plus" size={14} />
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? <PrimaryButton label={actionLabel} onPress={onAction} /> : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderColor: colors.surfaceElevated,
      borderRadius: radii.pill,
      borderWidth: 2,
      bottom: -2,
      height: 24,
      justifyContent: "center",
      position: "absolute",
      right: -2,
      width: 24,
    },
    container: {
      alignItems: "center",
      gap: spacing.group,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing["3xl"],
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      maxWidth: 320,
      textAlign: "center",
    },
    errorWell: {
      backgroundColor: colors.expenseSurface,
    },
    halo: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.xl,
      height: 64,
      opacity: 0.7,
      position: "absolute",
      width: 64,
    },
    iconWell: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 28,
      borderWidth: 1,
      height: 88,
      justifyContent: "center",
      overflow: "visible",
      width: 88,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
      textAlign: "center",
    },
  })
}
