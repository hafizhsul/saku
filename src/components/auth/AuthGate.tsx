import { useMemo, useState } from "react"
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
      <ScreenShell contentStyle={styles.content} withTabBar={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Saku terkunci</Text>
          {authError !== null ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {authError}
            </Text>
          ) : null}
          <Text style={styles.description}>Periksa koneksi atau buka dengan biometrik.</Text>
        </View>

        {hasBiometric ? (
          <PrimaryButton
            accessibilityLabel="Buka dengan biometrik"
            icon="fingerprint"
            label="Buka dengan biometrik"
            onPress={() => void biometricUnlock()}
          />
        ) : null}

        <PrimaryButton
          accessibilityLabel="Coba lagi"
          icon="refresh"
          label="Coba lagi"
          onPress={() => void retryLoad()}
          variant="secondary"
        />

        <Pressable
          accessibilityLabel="Keluar dari akun ini"
          accessibilityRole="link"
          onPress={() => void logout()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Text style={styles.logoutText}>Keluar dari akun ini</Text>
        </Pressable>
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
    content: {
      paddingTop: spacing["3xl"],
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textAlign: "center",
    },
    errorText: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.md,
      textAlign: "center",
    },
    header: {
      alignItems: "center",
      gap: spacing.group,
    },
    logoutButton: {
      alignItems: "center",
      paddingVertical: spacing.sm,
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
    title: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
      textAlign: "center",
    },
  })
}