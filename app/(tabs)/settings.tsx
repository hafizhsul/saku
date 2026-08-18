import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { SegmentedControl } from "../../src/components/SegmentedControl"
import { useAuth } from "../../src/features/auth/AuthProvider"
import { useSettings } from "../../src/features/settings/SettingsProvider"
import { fontFamilies, radii, shadows, spacing, themePreferenceOptions, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../../src/theme"

const themeDescriptions: Record<ThemePreference, string> = {
  system: "Mengikuti pengaturan perangkatmu.",
  light: "Selalu memakai palet terang.",
  dark: "Selalu memakai palet gelap.",
}

export default function SettingsScreen(): React.ReactElement {
  const { settings, isLoading, loadError, retryLoad, setTheme } = useSettings()
  const { user, logout } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (isLoading) {
    return (
      <ScreenShell>
        <SettingsHeader colors={colors} styles={styles} />
        <EmptyState description="Menyiapkan pengaturan." title="Memuat pengaturan..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell>
        <SettingsHeader colors={colors} styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <View style={styles.header}>
        <Text style={styles.overline}>AKUN</Text>
        <Text style={styles.title}>Profil</Text>
      </View>
      <View accessibilityLabel="Akun pengguna" style={styles.userCard}>
        <Text style={styles.userName}>{user?.name ?? "—"}</Text>
        <Text style={styles.userEmail}>{user?.email ?? "—"}</Text>
      </View>
      <PrimaryButton
        accessibilityLabel="Keluar dari aplikasi"
        label="Keluar"
        onPress={() => void logout()}
        variant="danger"
      />
      <SettingsHeader colors={colors} styles={styles} />
      <Text style={styles.hint}>Pilih tampilan aplikasi. Perubahan langsung terlihat.</Text>
      <SegmentedControl
        accessibilityLabel="Preferensi tema"
        onChange={(value) => {
          if (isThemePreference(value)) {
            void setTheme(value)
          }
        }}
        options={themePreferenceOptions}
        selectedValue={settings.theme}
      />
      <Text style={styles.description}>{themeDescriptions[settings.theme]}</Text>
    </ScreenShell>
  )
}

function isThemePreference(value: string): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

type SettingsStyles = ReturnType<typeof createStyles>

function SettingsHeader({ colors, styles }: { readonly colors: ThemeColors; readonly styles: SettingsStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.overline}>PENGATURAN</Text>
        <Text style={styles.title}>Tampilan</Text>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    description: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    header: {
      gap: spacing.unit,
    },
    hint: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    overline: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginTop: spacing.xs,
    },
    userCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      gap: spacing.unit,
      padding: spacing.group,
      ...shadows.card,
    },
    userEmail: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    userName: {
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
  })
}
