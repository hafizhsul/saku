import { useEffect, useMemo, useState } from "react"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View } from "react-native"

import { useAuth } from "../../features/auth/AuthProvider"
import { fontFamilies, radii, spacing, stateTokens, typography, useThemeColors, type ThemeColors } from "../../theme"
import { EmptyState } from "../EmptyState"
import { ScreenShell } from "../ScreenShell"
import { stateInteraction } from "../state/pressable"
import { LoginForm } from "./LoginForm"
import { RegisterForm } from "./RegisterForm"

type AuthGateProps = {
  readonly onAuthenticated?: () => void
}

type AuthMode = "login" | "register"

/**
 * Gerbang autentikasi inline (bukan route): dirender oleh RootContent selama
 * sesi belum terverifikasi. Saat "authenticated" komponen mengembalikan null
 * dan anak AuthProvider (provider data + Stack) mengambil alih layar.
 */
export function AuthGate(_props: AuthGateProps): React.ReactElement | null {
  const { authError, biometricUnlock, hasBiometric, isLoading, logout, retryLoad, state } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const interaction = useMemo(() => stateInteraction(colors), [colors])
  const [focusedKey, setFocusedKey] = useState<string | null>(null)
  const [lockBusy, setLockBusy] = useState<"biometric" | "retry" | "logout" | null>(null)
  const [mode, setMode] = useState<AuthMode>("login")
  const [reduceMotion, setReduceMotion] = useState(false)
  const [pulse] = useState(() => new Animated.Value(0))

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // Denyut ring ikon gembok ala Stitch; hormati reduced motion.
  useEffect(() => {
    if (state !== "locked" || reduceMotion) {
      return
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 1400, toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 1400, toValue: 0, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => {
      loop.stop()
    }
  }, [pulse, reduceMotion, state])

  const ringStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.2] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.15] }) }],
  }

  if (isLoading) {
    return (
      <ScreenShell withTabBar={false}>
        <EmptyState description="Menyiapkan data Anda…" icon="loading" title="Memuat..." />
      </ScreenShell>
    )
  }

  if (state === "locked") {
    return (
      <ScreenShell contentStyle={styles.lockedContent} withTabBar={false}>
        <View style={styles.lockedHeader}>
          <View style={styles.lockIconWrap}>
            <Animated.View style={[styles.lockRing, ringStyle]} />
            <View style={styles.lockIcon}>
              <View style={styles.lockIconInner}>
                <MaterialCommunityIcons color={colors.accent} name="lock-outline" size={24} />
              </View>
              <View style={styles.lockBeacon}>
                <View style={styles.lockBeaconDot} />
              </View>
            </View>
          </View>
          <Text style={styles.lockedTitle}>Saku Terkunci</Text>
          {authError !== null ? (
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text accessibilityRole="alert" style={styles.statusText}>
                {authError}
              </Text>
            </View>
          ) : null}
          <Text style={styles.lockedDescription}>
            Sesi Anda diamankan secara otomatis. Periksa koneksi atau verifikasi identitas Anda untuk melanjutkan.
          </Text>
        </View>

        {hasBiometric ? (
          <View style={styles.biometricCard}>
            <Pressable
              accessibilityLabel="Buka dengan biometrik"
              accessibilityRole="button"
              accessibilityState={{ busy: lockBusy === "biometric", disabled: lockBusy !== null }}
              disabled={lockBusy !== null}
              onBlur={() => setFocusedKey(null)}
              onFocus={() => setFocusedKey("biometric")}
              onPress={() => {
                if (lockBusy !== null) {
                  return
                }
                setLockBusy("biometric")
                void biometricUnlock().finally(() => setLockBusy(null))
              }}
              style={({ pressed }) => [
                styles.biometricButton,
                pressed && lockBusy === null && styles.pressed,
                lockBusy !== null && styles.lockActionDisabled,
                focusedKey === "biometric" && lockBusy === null && interaction.focusRing,
              ]}
            >
              <View style={styles.biometricCircle}>
                <MaterialCommunityIcons color={colors.accent} name="face-recognition" size={32} />
              </View>
              <Text style={styles.biometricTitle}>Ketuk untuk Buka Biometrik</Text>
              <Text style={styles.biometricSub}>Face ID atau Sidik Jari</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.lockedActions}>
          <Pressable
            accessibilityLabel="Coba lagi"
            accessibilityRole="button"
            accessibilityState={{ busy: lockBusy === "retry", disabled: lockBusy !== null }}
            disabled={lockBusy !== null}
            onBlur={() => setFocusedKey(null)}
            onFocus={() => setFocusedKey("retry")}
            onPress={() => {
              if (lockBusy !== null) {
                return
              }
              setLockBusy("retry")
              void retryLoad().finally(() => setLockBusy(null))
            }}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && lockBusy === null && styles.retryPressed,
              lockBusy !== null && styles.lockActionDisabled,
              focusedKey === "retry" && lockBusy === null && interaction.focusRing,
            ]}
          >
            <MaterialCommunityIcons color={colors.surface} name="refresh" size={18} />
            <Text style={styles.retryText}>Coba lagi</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Keluar dari akun ini"
            accessibilityRole="link"
            accessibilityState={{ busy: lockBusy === "logout", disabled: lockBusy !== null }}
            disabled={lockBusy !== null}
            onBlur={() => setFocusedKey(null)}
            onFocus={() => setFocusedKey("logout")}
            onPress={() => {
              if (lockBusy !== null) {
                return
              }
              setLockBusy("logout")
              void logout().finally(() => setLockBusy(null))
            }}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && lockBusy === null && styles.pressed,
              lockBusy !== null && styles.lockActionDisabled,
              focusedKey === "logout" && lockBusy === null && interaction.focusRing,
            ]}
          >
            <MaterialCommunityIcons color={colors.textTertiary} name="logout" size={14} />
            <Text style={styles.logoutText}>Keluar dari akun ini</Text>
          </Pressable>

          <View style={styles.trustRow}>
            <MaterialCommunityIcons color={colors.accent} name="shield-check-outline" size={12} />
            <Text style={styles.trustText}>Data tersimpan aman di perangkat ini</Text>
          </View>
        </View>
      </ScreenShell>
    )
  }

  if (state === "authenticated") {
    return null
  }

  if (mode === "login") {
    return <LoginForm onSwitchToRegister={() => setMode("register")} />
  }

  return <RegisterForm onSwitchToLogin={() => setMode("login")} />
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    biometricButton: {
      alignItems: "center",
      gap: spacing.xs,
      minHeight: 88,
      justifyContent: "center",
      padding: spacing.md,
    },
    biometricCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      elevation: 3,
      padding: spacing.sm,
    },
    biometricCircle: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderColor: colors.accent,
      borderRadius: 32,
      borderWidth: 2,
      height: 64,
      justifyContent: "center",
      width: 64,
    },
    biometricSub: {
      color: colors.textTertiary,
      fontSize: 11,
    },
    biometricTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600",
    },
    lockedActions: {
      gap: spacing.md,
    },
    lockedContent: {
      gap: spacing.lg,
      paddingTop: spacing["3xl"],
    },
    lockActionDisabled: {
      opacity: stateTokens.disabledOpacity,
    },
    lockedDescription: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 290,
      textAlign: "center",
    },
    lockedHeader: {
      alignItems: "center",
      gap: spacing.md,
    },
    lockedTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 24,
      fontWeight: "700",
      textAlign: "center",
    },
    lockBeacon: {
      alignItems: "center",
      backgroundColor: colors.error,
      borderColor: colors.surface,
      borderRadius: 10,
      borderWidth: 2,
      bottom: -4,
      elevation: 2,
      height: 20,
      justifyContent: "center",
      position: "absolute",
      right: -4,
      width: 20,
    },
    lockBeaconDot: {
      backgroundColor: colors.surface,
      borderRadius: 3,
      height: 6,
      width: 6,
    },
    lockIcon: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 20,
      borderWidth: 1,
      elevation: 4,
      height: 80,
      justifyContent: "center",
      width: 80,
    },
    lockIconInner: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 12,
      height: 48,
      justifyContent: "center",
      width: 48,
    },
    lockIconWrap: {
      alignItems: "center",
      justifyContent: "center",
      marginVertical: spacing.group,
    },
    lockRing: {
      backgroundColor: colors.accentSurface,
      borderRadius: 24,
      height: 96,
      opacity: 0.8,
      position: "absolute",
      width: 96,
    },
    logoutButton: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 44,
      justifyContent: "center",
    },
    logoutText: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    pressed: {
      opacity: 0.72,
    },
    retryButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: spacing.xl,
    },
    retryPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    retryText: {
      color: colors.surface,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "600",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    statusDot: {
      backgroundColor: colors.error,
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    statusPill: {
      alignItems: "center",
      backgroundColor: colors.expenseSurface,
      borderColor: colors.border,
      borderRadius: radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.compact,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.compact,
    },
    statusText: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    trustRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
      justifyContent: "center",
    },
    trustText: {
      color: colors.textTertiary,
      fontSize: 10,
    },
  })
}