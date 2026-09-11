import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../../theme"
import { PrimaryButton } from "../PrimaryButton"

type ErrorStateProps = {
  readonly title: string
  readonly description: string
  readonly onRetry: () => void
  readonly retryLabel?: string
}

export function ErrorState({ title, description, onRetry, retryLabel = "Coba lagi" }: ErrorStateProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.container}>
      <View style={[styles.iconWell, styles.errorWell]}>
        <View style={styles.halo} />
        <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <PrimaryButton label={retryLabel} onPress={onRetry} />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
