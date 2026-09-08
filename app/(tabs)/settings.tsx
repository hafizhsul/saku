import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import Constants from "expo-constants"
import { router } from "expo-router"
import { useMemo, useState, type ComponentProps, type ReactNode } from "react"
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { SegmentedControl } from "../../src/components/SegmentedControl"
import { useAuth } from "../../src/features/auth/AuthProvider"
import { useSettings } from "../../src/features/settings/SettingsProvider"
import { fontFamilies, radii, shadows, spacing, themePreferenceOptions, typography, useThemeColors, type ThemeColors, type ThemePreference } from "../../src/theme"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

// TODO: hubungkan baris "Segera hadir" ke fitur saat tersedia. Baris tanpa
// onPress sengaja non-interaktif (R-26): dead control dilarang, placeholder
// harus jujur dengan label yang terlihat.

function initialsOf(name: string | undefined, email: string | undefined): string {
  const source = (name ?? "").trim() || (email ?? "").trim()
  if (source.length === 0) {
    return "?"
  }
  const parts = source.split(/\s+/)
  if (parts.length === 1) {
    return (parts[0] ?? "?").slice(0, 2).toUpperCase()
  }
  return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase()
}

export default function SettingsScreen(): React.ReactElement {
  const { settings, isLoading, loadError, retryLoad, setBiometricLock, setTheme } = useSettings()
  const { hasBiometric, user, logout, profilePhoto } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [notificationsOn, setNotificationsOn] = useState(true)
  const [confirmLogout, setConfirmLogout] = useState(false)

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
      <Pressable
        accessibilityLabel="Profil pengguna"
        accessibilityRole="button"
        onPress={() => router.push("/edit-profile")}
        style={({ pressed }) => [styles.profileRow, pressed && styles.pressed]}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {profilePhoto !== null ? (
              <Image accessibilityLabel="Foto profil" source={{ uri: profilePhoto }} style={styles.avatarPhoto} />
            ) : (
              <View accessibilityLabel="Foto profil" style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initialsOf(user?.name, user?.email)}</Text>
              </View>
            )}
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
          <View accessibilityLabel="Akun terverifikasi" style={styles.verifiedBadge}>
            <MaterialCommunityIcons color={colors.accent} name="check-decagram" size={14} />
            <Text style={styles.verifiedBadgeText}>Akun Terverifikasi</Text>
          </View>
        </View>
      </Pressable>

      {/* Akun */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Akun</Text>
        <View style={styles.card}>
          <MenuRow icon="account-outline" iconTone="accent" label="Edit Profil" trailing={chevron} onPress={() => router.push("/edit-profile")} />
          <View style={styles.divider} />
          <MenuRow
            icon="shield-lock-outline"
            iconTone="accent"
            label="Keamanan & Kata Sandi"
            subtitle="Autentikasi 2 Langkah aktif"
            trailing={chevron}
            onPress={() => router.push("/change-password")}
          />
          <View style={styles.divider} />
          <MenuRow icon="bank-outline" iconTone="accent" label="Hubungkan Bank/E-wallet" subtitle="Segera hadir" trailing={chevron} />
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
          {hasBiometric ? (
            <>
              <View style={styles.divider} />
              <MenuRow
                accessibilityHint="Ketuk untuk mengaktifkan atau menonaktifkan kunci biometrik"
                icon="fingerprint"
                iconTone="muted"
                label="Kunci dengan biometrik"
                trailing={
                  <ToggleSwitch checked={settings.biometricLock} label="Kunci dengan biometrik" onChange={(next) => void setBiometricLock(next)} />
                }
              />
            </>
          ) : null}
          <View style={styles.divider} />
          <View style={styles.themeBlock}>
            <View style={styles.themeBlockHeader}>
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
                <MaterialCommunityIcons color={colors.textPrimary} name="theme-light-dark" size={20} />
              </View>
              <Text style={styles.rowLabel}>Tema</Text>
            </View>
            <SegmentedControl
              accessibilityLabel="Pilih tema"
              onChange={(value) => void setTheme(value as ThemePreference)}
              options={themePreferenceOptions}
              selectedValue={settings.theme}
            />
            {settings.theme === "system" ? <Text style={styles.rowSubtitle}>Mengikuti pengaturan perangkatmu.</Text> : null}
          </View>
          <View style={styles.divider} />
          <MenuRow icon="translate" iconTone="muted" label="Bahasa" subtitle="Segera hadir" trailing={valueTrailing("Indonesia")} />
        </View>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <View style={styles.card}>
          <MenuRow
            icon="database-cog-outline"
            iconTone="accent"
            label="Data & Cadangan"
            subtitle="Backup, pulihkan, impor CSV"
            trailing={chevron}
            onPress={() => router.push("/data")}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="repeat"
            iconTone="accent"
            label="Transaksi berulang"
            trailing={chevron}
            onPress={() => router.push("/recurring")}
          />
        </View>
      </View>

      {/* Lainnya */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lainnya</Text>
        <View style={styles.card}>
          <MenuRow icon="help-circle-outline" iconTone="muted" label="Pusat Bantuan" subtitle="Segera hadir" trailing={chevron} />
          <View style={styles.divider} />
          <MenuRow icon="shield-account-outline" iconTone="muted" label="Kebijakan Privasi" subtitle="Segera hadir" trailing={chevron} />
          <View style={styles.divider} />
          <MenuRow icon="logout" iconTone="danger" danger label="Keluar" onPress={() => setConfirmLogout(true)} />
        </View>
      </View>

      <Text style={styles.version}>Saku App Versi {Constants.expoConfig?.version ?? "1.0.0"}</Text>
    </>
  )

  return (
    <View style={styles.page}>
      <ScreenShell>
        {content}
      </ScreenShell>

      {/* Konfirmasi keluar: mengikuti desain referensi (keluar?, tombol vertikal pill) */}
      <Modal
        animationType="fade"
        onRequestClose={() => setConfirmLogout(false)}
        transparent
        visible={confirmLogout}
      >
        <View accessibilityViewIsModal style={styles.modalOverlay}>
          <View accessibilityLabel="Konfirmasi keluar" accessibilityRole="alert" style={styles.modalCard}>
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>Keluar?</Text>
              <Text style={styles.modalMessage}>Apakah Anda yakin ingin keluar dari aplikasi Saku?</Text>
            </View>
            <View style={styles.modalActions}>
              <Pressable
                accessibilityLabel="Konfirmasi keluar"
                accessibilityRole="button"
                onPress={() => {
                  setConfirmLogout(false)
                  void logout()
                }}
                style={({ pressed }) => [styles.modalActionPrimary, pressed && styles.pressed]}
              >
                <Text style={styles.modalActionPrimaryText}>Keluar</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Batal keluar"
                accessibilityRole="button"
                onPress={() => setConfirmLogout(false)}
                style={({ pressed }) => [styles.modalActionSecondary, pressed && styles.pressed]}
              >
                <Text style={styles.modalActionSecondaryText}>Batal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
      accessibilityRole={onPress === undefined ? undefined : "button"}
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
      borderRadius: 40,
      height: 80,
      width: 80,
      ...shadows.card,
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
      ...shadows.card,
    },
    avatarFallback: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 40,
      height: "100%",
      justifyContent: "center",
      width: "100%",
    },
    avatarInitials: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 28,
      fontWeight: "700",
    },
    avatarPhoto: {
      borderRadius: 40,
      borderColor: colors.surfaceMuted,
      borderWidth: 4,
      height: "100%",
      width: "100%",
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
    modalActionPrimary: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      justifyContent: "center",
      paddingVertical: spacing.md,
      width: "100%",
    },
    modalActionPrimaryText: {
      color: colors.surface,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.body.fontSize,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    modalActionSecondary: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      justifyContent: "center",
      paddingVertical: spacing.md,
      width: "100%",
    },
    modalActionSecondaryText: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.body.fontSize,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    modalActions: {
      flexDirection: "column",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    modalBody: {
      gap: spacing.xs,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      maxWidth: 384,
      padding: spacing["2xl"],
      width: "100%",
      ...shadows.elevated,
    },
    modalMessage: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.regular,
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
    },
    modalOverlay: {
      alignItems: "center",
      backgroundColor: "rgba(16, 20, 25, 0.4)",
      flex: 1,
      justifyContent: "center",
      padding: spacing.xl,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
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
      fontFamily: fontFamilies.semibold,
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
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
    verifiedBadge: {
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs + 1,
    },
    verifiedBadgeText: {
      color: colors.accent,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.overline.fontSize,
      fontWeight: "600",
      lineHeight: typography.overline.lineHeight,
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
    themeBlock: {
      gap: spacing.sm,
      padding: spacing.group,
    },
    themeBlockHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.group,
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
    brandIcon: {
      borderRadius: radii.sm,
      height: 36,
      width: 36,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: spacing.compact,
    },
    headerLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
    },
    profileButton: {
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    profileButtonHovered: {
      backgroundColor: colors.surfaceMuted,
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
