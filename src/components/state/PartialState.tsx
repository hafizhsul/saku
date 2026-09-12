import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../../theme"

type PartialStateProps = {
  readonly message: string
  readonly onRetry?: () => void
}

export function PartialState({ message, onRetry }: PartialStateProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <MaterialCommunityIcons name="alert-outline" size={18} color={colors.expense} />
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityLabel="Coba lagi" accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Coba lagi</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.compact,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.compact,
    },
    message: {
      color: colors.textPrimary,
      flex: 1,
      flexShrink: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    retry: {
      minHeight: 44,
      justifyContent: "center",
    },
    retryText: {
      color: colors.expense,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  })
}
