import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useAuth } from "../../features/auth/AuthProvider"
import { useThemeColors } from "../../theme"
import { createAuthStyles, isDarkTheme, type AuthStyles } from "./authStyles"

type RegisterFormProps = {
  readonly onSwitchToLogin: () => void
}

type FieldErrors = { readonly name?: string; readonly email?: string; readonly password?: string }

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps): React.ReactElement {
  const { authError, register } = useAuth()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const isDark = isDarkTheme(colors)
  const styles: AuthStyles = useMemo(() => createAuthStyles(colors, isDark), [colors, isDark])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<"name" | "email" | "password" | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Error dari server (email sudah terdaftar, dsb.) — border ikut merah.
  const hasServerError = authError !== null && Object.keys(errors).length === 0

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

    // Pesan kegagalan sudah disandingkan ke authError oleh AuthProvider.
    void result
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View pointerEvents="none" style={styles.watermark}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../../assets/images/wallet-watermark.jpg")}
          style={styles.watermarkImage}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Buat Akun</Text>
            <Text style={styles.subtitle}>Mulai kelola keuanganmu.</Text>
          </View>

          {/* Banner error server */}
          {hasServerError ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <MaterialCommunityIcons color={colors.error} name="alert-circle" size={20} />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          {/* Nama */}
          <View style={styles.field}>
            <Text style={styles.label}>Nama</Text>
            <View style={[styles.inputShell, focusedField === "name" && styles.inputShellFocused, (errors.name !== undefined || hasServerError) && styles.inputShellError]}>
              <MaterialCommunityIcons color={colors.textTertiary} name="account-outline" size={20} />
              <TextInput
                accessibilityLabel="Nama"
                autoCapitalize="words"
                editable={!isSubmitting}
                onBlur={() => setFocusedField(null)}
                onFocus={() => setFocusedField("name")}
                onChangeText={(value) => {
                  setName(value)
                  setErrors((current) => ({ ...current, name: undefined }))
                }}
                placeholder="Nama lengkap"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                value={name}
              />
            </View>
            {errors.name !== undefined ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errors.name}
              </Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputShell, focusedField === "email" && styles.inputShellFocused, (errors.email !== undefined || hasServerError) && styles.inputShellError]}>
              <MaterialCommunityIcons color={colors.textTertiary} name="at" size={20} />
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
                keyboardType="email-address"
                onBlur={() => setFocusedField(null)}
                onFocus={() => setFocusedField("email")}
                onChangeText={(value) => {
                  setEmail(value)
                  setErrors((current) => ({ ...current, email: undefined }))
                }}
                placeholder="nama@email.com"
                placeholderTextColor={colors.textTertiary}
                style={styles.input}
                value={email}
              />
            </View>
            {errors.email !== undefined ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errors.email}
              </Text>
            ) : null}
          </View>

          {/* Kata sandi */}
          <View style={styles.field}>
            <Text style={styles.label}>Kata Sandi</Text>
            <View style={[styles.inputShell, focusedField === "password" && styles.inputShellFocused, (errors.password !== undefined || hasServerError) && styles.inputShellError]}>
              <MaterialCommunityIcons color={colors.textTertiary} name="lock" size={20} />
              <TextInput
                accessibilityLabel="Kata sandi"
                editable={!isSubmitting}
                onBlur={() => setFocusedField(null)}
                onFocus={() => setFocusedField("password")}
                onChangeText={(value) => {
                  setPassword(value)
                  setErrors((current) => ({ ...current, password: undefined }))
                }}
                placeholder="Minimal 8 karakter"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
              />
              <Pressable
                accessibilityLabel={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setShowPassword((current) => !current)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <MaterialCommunityIcons color={colors.textSecondary} name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} />
              </Pressable>
            </View>
            {errors.password !== undefined ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Tombol utama */}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
            disabled={isSubmitting}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [styles.primaryButton, isSubmitting && styles.primaryButtonDisabled, pressed && !isSubmitting && styles.pressed]}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <Text style={styles.primaryButtonText}>{isSubmitting ? "Mendaftar..." : "Daftar Sekarang"}</Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Sudah punya akun?{" "}
              <Text accessibilityRole="link" onPress={onSwitchToLogin} style={styles.footerLink}>
                Masuk
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}