import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useMemo } from "react"
import Animated, { FadeInDown, useReducedMotion, ZoomIn } from "react-native-reanimated"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

export type ToastData = {
  readonly title: string
  readonly subtitle: string
  readonly transactionId: string
}

type ToastBannerProps = {
  readonly toast: ToastData
  readonly onDismiss: () => void
  readonly onView: (transactionId: string) => void
}

// Banner konfirmasi sinkron ala Stitch: muncul di layar tujuan (Home),
// bukan di layar form. Animasi masuk satu-kali; mati bila reduced motion.
export function ToastBanner({ toast, onDismiss, onView }: ToastBannerProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const reduceMotion = useReducedMotion()

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.springify().damping(18).stiffness(220)}
      style={styles.toast}
    >
      <Animated.View entering={reduceMotion ? undefined : ZoomIn.springify().delay(80)} style={styles.toastIcon}>
        <MaterialCommunityIcons color={colors.accent} name="check" size={20} />
      </Animated.View>
      <View style={styles.toastText}>
        <View style={styles.toastTitleRow}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          <View style={styles.toastDot} />
        </View>
        <Text numberOfLines={1} style={styles.toastSubtitle}>{toast.subtitle}</Text>
      </View>
      <Pressable
        accessibilityLabel="Lihat transaksi"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onView(toast.transactionId)}
        style={({ pressed }) => [styles.toastAction, pressed && styles.pressed]}
      >
        <Text style={styles.toastActionText}>Lihat</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Tutup pemberitahuan"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onDismiss}
        style={({ pressed }) => [styles.toastClose, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textTertiary} name="close" size={16} />
      </Pressable>
    </Animated.View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: {
      opacity: 0.72,
    },
    toast: {
      alignItems: "center",
      backgroundColor: `${colors.surface}F2`,
      borderColor: `${colors.accent}4D`,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      left: spacing.lg,
      padding: spacing.md,
      position: "absolute",
      right: spacing.lg,
      top: 48,
      ...shadows.elevated,
    },
    toastAction: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.sm,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.group,
    },
    toastActionText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
    },
    toastClose: {
      alignItems: "center",
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    toastDot: {
      backgroundColor: colors.accent,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    toastIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    toastSubtitle: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    toastText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    toastTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 12,
      fontWeight: "700",
    },
    toastTitleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
  })
}
