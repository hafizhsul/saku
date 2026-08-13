import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../src/components/EmptyState"
import { ScreenShell } from "../src/components/ScreenShell"
import { SegmentedControl } from "../src/components/SegmentedControl"
import { useSettings } from "../src/features/settings/SettingsProvider"
import { radii, spacing, themePreferenceOptions, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../src/theme"

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
      <ScreenShell withTabBar={false}>
        <SettingsHeader colors={colors} styles={styles} />
        <EmptyState description="Menyiapkan pengaturan." title="Memuat pengaturan..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell withTabBar={false}>
        <SettingsHeader colors={colors} styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell withTabBar={false}>
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
      <Pressable
        accessibilityLabel="Tutup pengaturan"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textSecondary} name="close" size={22} />
      </Pressable>
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
    closeButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
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
    pressed: {
      opacity: 0.72,
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
