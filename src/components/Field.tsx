import { useEffect, useMemo } from "react"
import { StyleSheet, Text } from "react-native"
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from "react-native-reanimated"

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
  // Error shake (mobileui): goyangan 3 osilasi saat error muncul, lalu
  // diam. Dinonaktifkan bila pengguna memakai reduced motion.
  const reduceMotion = useReducedMotion()
  const shake = useSharedValue(0)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }))

  useEffect(() => {
    if (error && !reduceMotion) {
      // eslint-disable-next-line react-hooks/immutability -- shared value Reanimated memang ditulis imperatif di effect.
      shake.value = withSequence(
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
  }, [error, reduceMotion, shake])

  return (
    <Animated.View style={[styles.field, animatedStyle]}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Animated.View>
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
