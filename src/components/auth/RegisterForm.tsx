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
import { AUTH_BRAND, createAuthStyles, isDarkTheme, type AuthStyles } from "./authStyles"

type RegisterFormProps = {
  readonly onSwitchToLogin: () => void
}

type FieldErrors = { readonly name?: string; readonly email?: string; readonly password?: string; readonly confirm?: string; readonly terms?: string }

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps): React.ReactElement {
  const { authError, register } = useAuth()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const isDark = isDarkTheme(colors)
  const styles: AuthStyles = useMemo(() => createAuthStyles(colors, isDark), [colors, isDark])
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focusedField, setFocusedField] = useState<"name" | "email" | "password" | "confirm" | null>(null)
  const [submitFocused, setSubmitFocused] = useState(false)
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
    const confirmError =
      confirmPassword.length === 0
        ? "Ulangi kata sandi Anda."
        : confirmPassword !== password
          ? "Konfirmasi kata sandi tidak sama."
          : undefined
    const termsError = acceptedTerms ? undefined : "Centang persetujuan untuk lanjut."
    const nextErrors: FieldErrors = { name: nameError, email: emailError, password: passwordError, confirm: confirmError, terms: termsError }
    if (Object.values(nextErrors).some((error) => error !== undefined)) {
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

  function handleHelpPress(): void {
    showNotice("Butuh bantuan? Hubungi dukungan lewat menu Profil setelah masuk.")
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
      {/* Ambient emerald/mint sesuai latar Stitch. */}
      <View pointerEvents="none" style={styles.ambientRight} />
      <View pointerEvents="none" style={styles.ambientLeft} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.registerContent} keyboardShouldPersistTaps="handled">
          {/* Bar atas */}
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Kembali ke halaman login"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onSwitchToLogin}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.textPrimary} name="chevron-left" size={24} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleHelpPress}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.helpText}>Bantuan</Text>
            </Pressable>
          </View>

          {/* Brand & sapaan */}
          <View style={styles.registerHeader}>
            <Image
              accessibilityIgnoresInvertColors
              source={require("../../../assets/saku-app.png")}
              style={styles.registerBrand}
            />
            <View style={styles.pill}>
              <Text style={styles.pillText}>SAKU FINANSIAL</Text>
            </View>
            <Text style={styles.registerTitle}>Registrasi Cepat</Text>
            <Text style={styles.registerSubtitle}>Kelola tabungan, alokasi anggaran, dan wujudkan impian finansialmu secara terencana.</Text>
          </View>

          {/* Banner error server */}
          {hasServerError ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <MaterialCommunityIcons color={colors.error} name="alert-circle" size={20} />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          ) : null}

          {/* Form registrasi */}
          <View style={styles.registerForm}>
            <View style={styles.field}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <View style={[styles.registerInputShell, focusedField === "name" && styles.inputShellFocused, (errors.name !== undefined || hasServerError) && styles.inputShellError]}>
                <MaterialCommunityIcons color={colors.textTertiary} name="account-outline" size={20} />
                <TextInput
                  accessibilityLabel="Nama lengkap"
                  autoCapitalize="words"
                  editable={!isSubmitting}
                  onBlur={() => setFocusedField(null)}
                  onFocus={() => setFocusedField("name")}
                  onChangeText={(value) => {
                    setName(value)
                    setErrors((current) => ({ ...current, name: undefined }))
                  }}
                  placeholder="cth. Hafizh Sulthan"
                  placeholderTextColor={colors.textTertiary}
                  style={styles.registerInput}
                  value={name}
                />
              </View>
              {errors.name !== undefined ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {errors.name}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.registerInputShell, focusedField === "email" && styles.inputShellFocused, (errors.email !== undefined || hasServerError) && styles.inputShellError]}>
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
                  style={styles.registerInput}
                  value={email}
                />
              </View>
              {errors.email !== undefined ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {errors.email}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Kata Sandi</Text>
              <View style={[styles.registerInputShell, focusedField === "password" && styles.inputShellFocused, (errors.password !== undefined || hasServerError) && styles.inputShellError]}>
                <MaterialCommunityIcons color={colors.textTertiary} name="lock-outline" size={20} />
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
                  style={styles.registerInput}
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
              ) : (
                <View style={styles.checkHint}>
                  <MaterialCommunityIcons color={AUTH_BRAND} name="check" size={14} />
                  <Text style={styles.checkHintText}>Minimal 8 karakter kombinasi huruf dan angka</Text>
                </View>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Ulangi Kata Sandi</Text>
              <View style={[styles.registerInputShell, focusedField === "confirm" && styles.inputShellFocused, (errors.confirm !== undefined || hasServerError) && styles.inputShellError]}>
                <MaterialCommunityIcons color={colors.textTertiary} name="shield-lock-outline" size={20} />
                <TextInput
                  accessibilityLabel="Ulangi kata sandi"
                  editable={!isSubmitting}
                  onBlur={() => setFocusedField(null)}
                  onFocus={() => setFocusedField("confirm")}
                  onChangeText={(value) => {
                    setConfirmPassword(value)
                    setErrors((current) => ({ ...current, confirm: undefined }))
                  }}
                  placeholder="Ulangi kata sandi"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showConfirm}
                  style={styles.registerInput}
                  value={confirmPassword}
                />
                <Pressable
                  accessibilityLabel={showConfirm ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => setShowConfirm((current) => !current)}
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  <MaterialCommunityIcons color={colors.textSecondary} name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} />
                </Pressable>
              </View>
              {errors.confirm !== undefined ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {errors.confirm}
                </Text>
              ) : null}
            </View>

            <View style={styles.termsRow}>
              <Pressable
                accessibilityLabel="Setujui Ketentuan Layanan dan Kebijakan Privasi"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
                hitSlop={8}
                onPress={() => {
                  setAcceptedTerms((current) => !current)
                  setErrors((current) => ({ ...current, terms: undefined }))
                }}
                style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
              >
                {acceptedTerms ? <MaterialCommunityIcons color="#FFFFFF" name="check" size={12} /> : null}
              </Pressable>
              <Text style={styles.termsText}>
                Saya menyetujui <Text style={styles.termsLink}>Ketentuan Layanan</Text> serta <Text style={styles.termsLink}>Kebijakan Privasi</Text> Saku.
              </Text>
            </View>
            {errors.terms !== undefined ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {errors.terms}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
              disabled={isSubmitting}
              onBlur={() => setSubmitFocused(false)}
              onFocus={() => setSubmitFocused(true)}
              onPress={() => void handleSubmit()}
              style={({ pressed }) => [styles.registerButton, isSubmitting && styles.primaryButtonDisabled, pressed && !isSubmitting && styles.pressed, submitFocused && !isSubmitting && styles.focusRing]}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <Text style={styles.primaryButtonText}>{isSubmitting ? "Mendaftar..." : "Daftar Sekarang"}</Text>
              {isSubmitting ? null : <MaterialCommunityIcons color="#FFFFFF" name="arrow-right" size={16} />}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.registerFooter}>
            <Text style={styles.footerText}>
              Sudah punya akun?{" "}
              <Text accessibilityRole="link" onPress={onSwitchToLogin} style={styles.footerLink}>
                Masuk ke Akun
              </Text>
            </Text>
            <View style={styles.securityBadge}>
              <MaterialCommunityIcons color={AUTH_BRAND} name="shield-check" size={14} />
              <Text style={styles.securityText}>Data tersimpan aman di perangkat ini</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
