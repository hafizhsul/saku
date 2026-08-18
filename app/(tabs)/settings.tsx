import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import Constants from "expo-constants"
import { useMemo, type ComponentProps } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { SegmentedControl } from "../../src/components/SegmentedControl"
import { useAuth } from "../../src/features/auth/AuthProvider"
import { useSettings } from "../../src/features/settings/SettingsProvider"
import { fontFamilies, radii, shadows, spacing, themePreferenceOptions, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../../src/theme"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

const themeDescriptions: Record<ThemePreference, string> = {
  system: "Mengikuti pengaturan perangkatmu.",
  light: "Selalu memakai palet terang.",
  dark: "Selalu memakai palet gelap.",
}

const themeLabels: Record<ThemePreference, string> = {
  system: "Sistem",
  light: "Terang",
  dark: "Gelap",
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  const first = parts[0]?.[0] ?? ""
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : ""
  return `${first}${second}`.toUpperCase()
}

export default function SettingsScreen(): React.ReactElement {
  const { settings, isLoading, loadError, retryLoad, setTheme } = useSettings()
  const { user, logout } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (isLoading) {
    return (
      <ScreenShell>
        <Header styles={styles} />
        <EmptyState description="Menyiapkan pengaturan." title="Memuat pengaturan..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell>
        <Header styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <Header styles={styles} />

      {/* Ringkasan profil */}
      <View accessibilityLabel="Profil pengguna" style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(user?.name ?? "")}</Text>
        </View>
        <View style={styles.profileText}>
          <Text numberOfLines={1} style={styles.profileName}>
            {user?.name ?? "—"}
          </Text>
          <Text numberOfLines={1} style={styles.profileEmail}>
            {user?.email ?? "—"}
          </Text>
        </View>
      </View>

      {/* Aplikasi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, styles.iconCircleMuted]}>
              <MaterialCommunityIcons color={colors.textPrimary} name="theme-light-dark" size={20} />
            </View>
            <Text style={styles.rowLabel}>Tema</Text>
            <View style={styles.rowTrailing}>
              <Text style={styles.rowValue}>{themeLabels[settings.theme]}</Text>
              <MaterialCommunityIcons color={colors.textTertiary} name="chevron-right" size={20} />
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.themeControl}>
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
            <Text style={styles.themeDescription}>{themeDescriptions[settings.theme]}</Text>
          </View>
        </View>
      </View>

      {/* Lainnya */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        <View style={styles.card}>
          <Pressable
            accessibilityLabel="Keluar dari aplikasi"
            accessibilityRole="button"
            onPress={() => void logout()}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={[styles.iconCircle, styles.iconCircleDanger]}>
              <MaterialCommunityIcons color={colors.error} name="logout" size={20} />
            </View>
            <Text style={styles.rowLabelDanger}>Keluar</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.version}>Saku App Versi {Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </ScreenShell>
  )
}

function isThemePreference(value: string): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark"
}

type SettingsStyles = ReturnType<typeof createStyles>

function Header({ styles }: { readonly styles: SettingsStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.overline}>AKUN</Text>
      <Text style={styles.title}>Profil</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    avatar: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 40,
      height: 80,
      justifyContent: "center",
      width: 80,
    },
    avatarText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      overflow: "hidden",
      ...shadows.card,
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
      marginLeft: 64,
      marginRight: spacing.lg,
    },
    header: {
      gap: spacing.unit,
    },
    iconCircle: {
      alignItems: "center",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    iconCircleDanger: {
      backgroundColor: colors.expenseSurface,
    },
    iconCircleMuted: {
      backgroundColor: colors.surfaceMuted,
    },
    overline: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    profileEmail: {
      color: colors.textSecondary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    profileName: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 22,
      fontWeight: "700",
      lineHeight: 28,
    },
    profileRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.group,
    },
    profileText: {
      flex: 1,
      gap: spacing.unit,
      minWidth: 0,
    },
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.group,
      minHeight: 64,
      paddingHorizontal: spacing.group,
      paddingVertical: spacing.md,
    },
    rowLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    rowLabelDanger: {
      color: colors.error,
      flex: 1,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.body.fontSize,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    rowTrailing: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.unit,
    },
    rowValue: {
      color: colors.textSecondary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    section: {
      gap: spacing.compact,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
      marginLeft: spacing.sm,
      textTransform: "uppercase",
    },
    themeControl: {
      gap: spacing.compact,
      padding: spacing.group,
    },
    themeDescription: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginTop: spacing.xs,
    },
    version: {
      color: colors.textTertiary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      paddingVertical: spacing.sm,
      textAlign: "center",
    },
  })
}
