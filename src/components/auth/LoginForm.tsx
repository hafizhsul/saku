import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { StatusBar } from "expo-status-bar"
import { useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
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

type LoginFormProps = {
  readonly onSwitchToRegister: () => void
}

type FieldErrors = { readonly email?: string; readonly password?: string }

export function LoginForm({ onSwitchToRegister }: LoginFormProps): React.ReactElement {
  const { authError, biometricUnlock, login } = useAuth()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const isDark = isDarkTheme(colors)
  const styles: AuthStyles = useMemo(() => createAuthStyles(colors, isDark), [colors, isDark])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Error dari server (kredensial salah) ditandai lewat authError; border input
  // ikut merah seperti referensi, bukan hanya banner.
  const hasServerError = authError !== null && Object.keys(errors).length === 0

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

    // Pesan kegagalan sudah disandingkan ke authError oleh AuthProvider.
    void result
  }

  function handleForgotPassword(): void {
    showNotice("Pemulihan kata sandi belum tersedia. Hubungi dukungan atau gunakan biometrik untuk masuk.")
  }

  async function handleBiometricPress(): Promise<void> {
    const result = await biometricUnlock()
    if (!result.ok) {
      showNotice(result.message)
    }
  }

  function showNotice(message: string): void {
    if (Platform.OS === "web") {
      window.alert(message)
    } else {
      Alert.alert("Perhatian", message)
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Watermark logo di belakang form, selayang ilustrasi 3D pada referensi. */}
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
            <Text style={styles.title}>Selamat Datang</Text>
            <Text style={styles.subtitle}>Masuk untuk lanjut.</Text>
          </View>

          {/* Banner error server (bukan validasi lokal) */}
          {hasServerError ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <MaterialCommunityIcons color={colors.error} name="alert-circle" size={20} />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

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
                placeholder="••••••••"
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

          {/* Lupa sandi */}
          <View style={styles.forgotRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleForgotPassword}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.forgotText}>Lupa sandi?</Text>
            </Pressable>
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
            <Text style={styles.primaryButtonText}>{isSubmitting ? "Memproses..." : "Masuk ke Akun"}</Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Biometrik — selalu tampil seperti referensi; pesan kesalahan muncul
              saat perangkat tak mendukung atau autentikasi gagal. */}
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleBiometricPress()}
            style={({ pressed }) => [styles.biometricButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textPrimary} name="fingerprint" size={20} />
            <Text style={styles.biometricText}>Masuk dengan Biometrik</Text>
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Belum punya akun?{" "}
              <Text accessibilityRole="link" onPress={onSwitchToRegister} style={styles.footerLink}>
                Daftar Sekarang
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}