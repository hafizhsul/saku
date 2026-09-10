import { useMemo, useState } from "react"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { useAuth } from "../../features/auth/AuthProvider"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../theme"
import { EmptyState } from "../EmptyState"
import { PrimaryButton } from "../PrimaryButton"
import { ScreenShell } from "../ScreenShell"
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
  const [mode, setMode] = useState<AuthMode>("login")

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
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons color={colors.textPrimary} name="lock-outline" size={28} />
          </View>
          <Text style={styles.lockedTitle}>Saku Terkunci</Text>
          {authError !== null ? (
            <View style={styles.statusPill}>
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
          <Pressable
            accessibilityLabel="Buka dengan biometrik"
            accessibilityRole="button"
            onPress={() => void biometricUnlock()}
            style={({ pressed }) => [styles.biometricCard, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.accent} name="face-recognition" size={28} />
            <Text style={styles.biometricTitle}>Ketuk untuk Buka Biometrik</Text>
            <Text style={styles.biometricSub}>Face ID atau Sidik Jari</Text>
          </Pressable>
        ) : null}

        <PrimaryButton
          accessibilityLabel="Coba lagi"
          icon="refresh"
          label="Coba lagi"
          onPress={() => void retryLoad()}
        />

        <Pressable
          accessibilityLabel="Keluar dari akun ini"
          accessibilityRole="link"
          onPress={() => void logout()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Keluar dari akun ini</Text>
        </Pressable>

        <View style={styles.trustRow}>
          <MaterialCommunityIcons color={colors.textTertiary} name="shield-check-outline" size={14} />
          <Text style={styles.trustText}>Berizin & Diawasi OJK • LPS Terdaftar</Text>
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
    biometricCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      elevation: 3,
      gap: spacing.xs,
      minHeight: 88,
      justifyContent: "center",
      padding: spacing.group,
    },
    biometricSub: {
      color: colors.textTertiary,
      fontSize: 12,
    },
    biometricTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      fontWeight: "600",
    },
    lockedContent: {
      gap: spacing.lg,
      paddingTop: spacing["3xl"],
    },
    lockedDescription: {
      color: colors.textSecondary,
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textAlign: "center",
    },
    lockedHeader: {
      alignItems: "center",
      gap: spacing.md,
    },
    lockedTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 22,
      fontWeight: "700",
      textAlign: "center",
    },
    lockIcon: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 20,
      elevation: 2,
      height: 64,
      justifyContent: "center",
      width: 64,
    },
    logoutButton: {
      alignItems: "center",
      minHeight: 44,
      justifyContent: "center",
    },
    logoutText: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textDecorationLine: "underline",
    },
    pressed: {
      opacity: 0.72,
    },
    statusPill: {
      borderColor: colors.textTertiary,
      borderRadius: radii.pill,
      borderWidth: 1,
      paddingHorizontal: spacing.group,
      paddingVertical: spacing.compact,
    },
    statusText: {
      color: colors.textSecondary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
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
      fontSize: 12,
    },
  })
}