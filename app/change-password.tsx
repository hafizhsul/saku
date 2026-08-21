import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useAuth } from "../src/features/auth/AuthProvider"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

export default function ChangePasswordScreen(): React.ReactElement {
  const { changePassword } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ readonly current?: string; readonly next?: string }>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave(): Promise<void> {
    const currentError = currentPassword.length === 0 ? "Kata sandi saat ini wajib diisi." : undefined
    const nextError =
      newPassword.length < 8
        ? "Kata sandi baru minimal 8 karakter."
        : newPassword === currentPassword
          ? "Kata sandi baru harus berbeda dari yang lama."
          : newPassword !== confirmPassword
            ? "Konfirmasi kata sandi tidak cocok."
            : undefined

    if (currentError !== undefined || nextError !== undefined) {
      setFieldErrors({ current: currentError, next: nextError })
      return
    }

    setFieldErrors({})
    setNotice(null)
    setIsSaving(true)
    const result = await changePassword(currentPassword, newPassword)
    setIsSaving(false)

    if (!result.ok) {
      setNotice(result.message)
      return
    }

    router.back()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScreenShell contentStyle={styles.content} withTabBar={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Kembali"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textPrimary} name="arrow-left" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>Keamanan &amp; Kata Sandi</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kata sandi saat ini</Text>
          <View style={[styles.inputShell, fieldErrors.current !== undefined && styles.inputShellError]}>
            <TextInput
              accessibilityLabel="Kata sandi saat ini"
              editable={!isSaving}
              onChangeText={(value) => {
                setCurrentPassword(value)
                setFieldErrors((current) => ({ ...current, current: undefined }))
              }}
              placeholder="••••••••"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              style={styles.input}
              value={currentPassword}
            />
          </View>
          {fieldErrors.current !== undefined ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              {fieldErrors.current}
            </Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Kata sandi baru</Text>
          <View style={[styles.inputShell, fieldErrors.next !== undefined && styles.inputShellError]}>
            <TextInput
              accessibilityLabel="Kata sandi baru"
              editable={!isSaving}
              onChangeText={(value) => {
                setNewPassword(value)
                setFieldErrors((current) => ({ ...current, next: undefined }))
              }}
              placeholder="Minimal 8 karakter"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              style={styles.input}
              value={newPassword}
            />
          </View>

          <Text style={styles.label}>Konfirmasi kata sandi baru</Text>
          <View style={[styles.inputShell, fieldErrors.next !== undefined && styles.inputShellError]}>
            <TextInput
              accessibilityLabel="Konfirmasi kata sandi baru"
              editable={!isSaving}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi kata sandi baru"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              style={styles.input}
              value={confirmPassword}
            />
          </View>
          {fieldErrors.next !== undefined ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              {fieldErrors.next}
            </Text>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowPasswords((current) => !current)}
          style={({ pressed }) => [styles.showRow, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.textSecondary} name={showPasswords ? "eye-off-outline" : "eye-outline"} size={18} />
          <Text style={styles.showText}>{showPasswords ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}</Text>
        </Pressable>

        {notice !== null ? (
          <View accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <PrimaryButton
          accessibilityLabel="Simpan kata sandi baru"
          disabled={isSaving}
          loading={isSaving}
          label="Simpan Kata Sandi"
          onPress={() => void handleSave()}
        />
      </ScreenShell>
    </KeyboardAvoidingView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backButton: {
      alignItems: "center",
      borderRadius: radii.sm,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    content: {
      gap: spacing.section,
    },
    field: {
      gap: spacing.compact,
    },
    fieldError: {
      color: colors.error,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    input: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: typography.bodyLarge.fontFamily,
      minHeight: 54,
      padding: 0,
    },
    inputShell: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 56,
      paddingHorizontal: spacing.lg,
    },
    inputShellError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    keyboard: {
      flex: 1,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    notice: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      padding: spacing.md,
    },
    noticeText: {
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    showRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    showText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
  })
}