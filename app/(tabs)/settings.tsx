import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { SegmentedControl } from "../../src/components/SegmentedControl"
import { useSettings } from "../../src/features/settings/SettingsProvider"
import { radii, spacing, themePreferenceOptions, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../../src/theme"

const themeDescriptions: Record<ThemePreference, string> = {
  system: "Mengikuti pengaturan perangkatmu.",
  light: "Selalu memakai palet terang.",
  dark: "Selalu memakai palet gelap.",
}

export default function SettingsScreen(): React.ReactElement {
  const { settings, isLoading, loadError, retryLoad, setTheme } = useSettings()
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
      <SettingsHeader colors={colors} styles={styles} />
      <Text style={styles.hint}>Pilih tampilan aplikasi. Perubahan langsung terlihat.</Text>
      <View style={styles.card}>
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
      </View>
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
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.group,
      padding: spacing.lg,
    },
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
      color: colors.accent,
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
  })
}
