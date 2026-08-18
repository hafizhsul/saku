import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import Constants from "expo-constants"
import { useMemo, useState, type ComponentProps, type ReactNode } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { useAuth } from "../../src/features/auth/AuthProvider"
import { useSettings } from "../../src/features/settings/SettingsProvider"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../../src/theme"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

const themeLabels: Record<ThemePreference, string> = {
  system: "Sistem",
  light: "Terang",
  dark: "Gelap",
}

const THEME_CYCLE: readonly ThemePreference[] = ["system", "light", "dark"]

function nextTheme(current: ThemePreference): ThemePreference {
  return THEME_CYCLE[(THEME_CYCLE.indexOf(current) + 1) % THEME_CYCLE.length]
}

// Tombol referensi desain yang belum punya fitur: tetap dirender agar mirip,
// tapi onPress-nya no-op. ponytail: ganti dengan navigasi/aksi saat fiturnya ada.
function noop(): void {}

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
  const [notificationsOn, setNotificationsOn] = useState(true)

  const chevron = <MaterialCommunityIcons color={colors.textTertiary} name="chevron-right" size={20} />
  const valueTrailing = (value: string): ReactNode => (
    <View style={styles.rowTrailing}>
      <Text style={styles.rowValue}>{value}</Text>
      {chevron}
    </View>
  )

  const content = isLoading ? (
    <EmptyState description="Menyiapkan pengaturan." title="Memuat pengaturan..." />
  ) : loadError ? (
    <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
  ) : (
    <>
      {/* Ringkasan profil */}
      <View accessibilityLabel="Profil pengguna" style={styles.profileRow}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(user?.name ?? "")}</Text>
          </View>
          <View accessibilityLabel="Ubah foto profil" style={styles.avatarEdit}>
            <MaterialCommunityIcons color={colors.surface} name="pencil" size={14} />
          </View>
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

      {/* Akun */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <View style={styles.card}>
          <MenuRow icon="account-outline" iconTone="accent" label="Edit Profil" onPress={noop} />
          <View style={styles.divider} />
          <MenuRow
            icon="shield-lock-outline"
            iconTone="accent"
            label="Keamanan & Kata Sandi"
            subtitle="Autentikasi 2 Langkah aktif"
            trailing={chevron}
            onPress={noop}
          />
          <View style={styles.divider} />
          <MenuRow icon="bank-outline" iconTone="accent" label="Hubungkan Bank/E-wallet" trailing={chevron} onPress={noop} />
        </View>
      </View>

      {/* Aplikasi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <View style={styles.card}>
          <MenuRow
            icon="bell-outline"
            iconTone="muted"
            label="Notifikasi"
            trailing={<ToggleSwitch checked={notificationsOn} label="Notifikasi" onChange={setNotificationsOn} />}
          />
          <View style={styles.divider} />
          <MenuRow
            accessibilityHint="Ketuk untuk mengganti tema"
            icon="theme-light-dark"
            iconTone="muted"
            label="Tema"
            trailing={valueTrailing(themeLabels[settings.theme])}
            onPress={() => void setTheme(nextTheme(settings.theme))}
          />
          <View style={styles.divider} />
          <MenuRow icon="translate" iconTone="muted" label="Bahasa" trailing={valueTrailing("Indonesia")} onPress={noop} />
        </View>
      </View>

      {/* Lainnya */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        <View style={styles.card}>
          <MenuRow icon="help-circle-outline" iconTone="muted" label="Pusat Bantuan" trailing={chevron} onPress={noop} />
          <View style={styles.divider} />
          <MenuRow icon="shield-account-outline" iconTone="muted" label="Kebijakan Privasi" trailing={chevron} onPress={noop} />
          <View style={styles.divider} />
          <MenuRow icon="logout" iconTone="danger" danger label="Keluar" onPress={() => void logout()} />
        </View>
      </View>

      <Text style={styles.version}>Saku App Versi {Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </>
  )

  return (
    <View style={styles.page}>
      <TopBar />
      <ScreenShell>{content}</ScreenShell>
    </View>
  )
}

type SettingsStyles = ReturnType<typeof createStyles>

function TopBar(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  return (
    <View style={[styles.topBar, { paddingTop: insets.top }]}>
      <View style={styles.topBarInner}>
        <View style={styles.topBarBrand}>
          <Image source={require("../../assets/images/icon.png")} style={styles.topBarLogo} />
          <Text style={styles.topBarName}>Saku</Text>
        </View>
        <View accessibilityLabel="Avatar pengguna" style={styles.topBarAvatar}>
          <Text style={styles.topBarAvatarText}>{initialsOf(user?.name ?? "")}</Text>
        </View>
      </View>
    </View>
  )
}

type MenuRowProps = {
  readonly accessibilityHint?: string
  readonly icon: IconName
  readonly iconTone: "accent" | "muted" | "danger"
  readonly label: string
  readonly subtitle?: string
  readonly danger?: boolean
  readonly trailing?: ReactNode
  readonly onPress?: () => void
}

function MenuRow({ accessibilityHint, icon, iconTone, label, subtitle, danger, trailing, onPress }: MenuRowProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const circleBackground =
    iconTone === "accent" ? colors.accentSurface : iconTone === "danger" ? colors.expenseSurface : colors.surfaceMuted
  const iconColor = danger ? colors.error : colors.textPrimary

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconCircle, { backgroundColor: circleBackground }]}>
        <MaterialCommunityIcons color={iconColor} name={icon} size={20} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {subtitle !== undefined ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </Pressable>
  )
}

type ToggleSwitchProps = {
  readonly checked: boolean
  readonly label: string
  readonly onChange: (next: boolean) => void
}

function ToggleSwitch({ checked, label, onChange }: ToggleSwitchProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={[styles.toggleTrack, checked && { backgroundColor: colors.accent }]}>
        <View style={[styles.toggleKnob, checked && styles.toggleKnobOn]} />
      </View>
    </Pressable>
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
    avatarEdit: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderColor: colors.surface,
      borderRadius: 16,
      borderWidth: 2,
      bottom: 0,
      height: 32,
      justifyContent: "center",
      position: "absolute",
      right: 0,
      width: 32,
    },
    avatarText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    avatarWrap: {
      position: "relative",
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
    iconCircle: {
      alignItems: "center",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    page: {
      backgroundColor: colors.canvas,
      flex: 1,
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
      fontFamily: typography.body.fontFamily,
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    rowLabelDanger: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
    },
    rowSubtitle: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      fontWeight: typography.caption.fontWeight,
      lineHeight: 16,
    },
    rowText: {
      flex: 1,
      gap: spacing.unit,
      minWidth: 0,
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
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginTop: spacing.xs,
    },
    toggleKnob: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      height: 20,
      width: 20,
    },
    toggleKnobOn: {
      transform: [{ translateX: 20 }],
    },
    toggleTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      paddingHorizontal: 2,
      width: 44,
    },
    topBar: {
      backgroundColor: colors.surface,
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      zIndex: 10,
    },
    topBarAvatar: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    topBarAvatarText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 13,
      fontWeight: "700",
    },
    topBarBrand: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    topBarInner: {
      alignItems: "center",
      flexDirection: "row",
      height: 64,
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
    },
    topBarLogo: {
      height: 32,
      resizeMode: "contain",
      width: 32,
    },
    topBarName: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 20,
      fontWeight: "700",
      lineHeight: 26,
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