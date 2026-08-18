import { useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { Field } from "../Field"
import { PrimaryButton } from "../PrimaryButton"
import { ScreenShell } from "../ScreenShell"
import { useAuth } from "../../features/auth/AuthProvider"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../theme"

type LoginFormProps = {
  readonly onSwitchToRegister: () => void
}

type FieldErrors = { readonly email?: string; readonly password?: string }

export function LoginForm({ onSwitchToRegister }: LoginFormProps): React.ReactElement {
  const { authError, login } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(): Promise<void> {
    if (isSubmitting) {
      return
    }

    const trimmedEmail = email.trim()
    const emailError =
      trimmedEmail.length === 0
        ? "Email wajib diisi."
        : trimmedEmail.includes("@")
          ? undefined
          : "Masukkan alamat email yang valid."
    const passwordError = password.length < 8 ? "Kata sandi minimal 8 karakter." : undefined
    const nextErrors: FieldErrors = { email: emailError, password: passwordError }
    if (nextErrors.email !== undefined || nextErrors.password !== undefined) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    const result = await login({ email: trimmedEmail, password })
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
          <Text style={styles.overline}>SELAMAT DATANG</Text>
          <Text style={styles.title}>Masuk ke Saku</Text>
        </View>

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

        <Field error={errors.password} label="Kata sandi">
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
          accessibilityLabel="Masuk"
          disabled={isSubmitting}
          icon="login"
          label={isSubmitting ? "Mengecek..." : "Masuk"}
          onPress={() => void handleSubmit()}
        />

        <Pressable
          accessibilityLabel="Belum punya akun? Daftar"
          accessibilityRole="link"
          onPress={onSwitchToRegister}
          style={({ pressed }) => [styles.switchButton, pressed && styles.pressed]}
        >
          <Text style={styles.switchText}>
            Belum punya akun? <Text style={styles.switchTextAccent}>Daftar</Text>
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