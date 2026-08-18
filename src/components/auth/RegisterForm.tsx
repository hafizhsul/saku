import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { Field } from "../Field"
import { PrimaryButton } from "../PrimaryButton"
import { ScreenShell } from "../ScreenShell"
import { useAuth } from "../../features/auth/AuthProvider"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../theme"

type RegisterFormProps = {
  readonly onSwitchToLogin: () => void
}

type FieldErrors = { readonly name?: string; readonly email?: string; readonly password?: string }

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps): React.ReactElement {
  const { authError, register } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (isSubmitting) {
      return
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const nameError = trimmedName.length === 0 ? "Nama wajib diisi." : undefined
    const emailError =
      trimmedEmail.length === 0
        ? "Email wajib diisi."
        : trimmedEmail.includes("@")
          ? undefined
          : "Masukkan alamat email yang valid."
    const passwordError = password.length < 8 ? "Kata sandi minimal 8 karakter." : undefined
    const nextErrors: FieldErrors = { name: nameError, email: emailError, password: passwordError }
    if (nextErrors.name !== undefined || nextErrors.email !== undefined || nextErrors.password !== undefined) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    const result = await register({ name: trimmedName, email: trimmedEmail, password })
    setIsSubmitting(false)

    if (!result.ok) {
      // Pesan kegagalan sudah disandingkan ke authError oleh AuthProvider.
      return
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScreenShell contentStyle={styles.content} withTabBar={false}>
        <View style={styles.header}>
          <Text style={styles.overline}>AKUN BARU</Text>
          <Text style={styles.title}>Daftar Saku</Text>
        </View>

        <Field error={errors.name} label="Nama">
          <TextInput
            accessibilityLabel="Nama"
            autoCapitalize="words"
            editable={!isSubmitting}
            onChangeText={(value) => {
              setName(value)
              setErrors((current) => ({ ...current, name: undefined }))
            }}
            placeholder="Nama lengkap"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, errors.name !== undefined && styles.inputError]}
            value={name}
          />
        </Field>

        <Field error={errors.email} label="Email">
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            keyboardType="email-address"
            onChangeText={(value) => {
              setEmail(value)
              setErrors((current) => ({ ...current, email: undefined }))
            }}
            placeholder="nama@contoh.com"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, errors.email !== undefined && styles.inputError]}
            value={email}
          />
        </Field>

        <Field error={errors.password} hint="Minimal 8 karakter" label="Kata sandi">
          <TextInput
            accessibilityLabel="Kata sandi"
            editable={!isSubmitting}
            onChangeText={(value) => {
              setPassword(value)
              setErrors((current) => ({ ...current, password: undefined }))
            }}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            style={[styles.input, errors.password !== undefined && styles.inputError]}
            value={password}
          />
        </Field>

        {authError !== null ? (
          <Text accessibilityRole="alert" style={styles.generalError}>
            {authError}
          </Text>
        ) : null}

        <PrimaryButton
          accessibilityLabel="Daftar"
          disabled={isSubmitting}
          icon="account-plus-outline"
          label={isSubmitting ? "Mendaftar..." : "Daftar"}
          onPress={() => void handleSubmit()}
        />

        <Pressable
          accessibilityLabel="Sudah punya akun? Masuk"
          accessibilityRole="link"
          onPress={onSwitchToLogin}
          style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
        >
          <Text style={styles.switchText}>
            Sudah punya akun? <Text style={styles.switchTextAccent}>Masuk</Text>
          </Text>
        </Pressable>
      </ScreenShell>
    </KeyboardAvoidingView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: spacing["3xl"],
    },
    generalError: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.md,
    },
    header: {
      alignItems: "flex-start",
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: typography.bodyLarge.fontFamily,
      minHeight: 52,
      paddingHorizontal: spacing.md,
    },
    inputError: {
      borderColor: colors.error,
    },
    keyboard: {
      flex: 1,
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
    switchButton: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    switchText: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textAlign: "center",
    },
    switchTextAccent: {
      color: colors.action,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
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