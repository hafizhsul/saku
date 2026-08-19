import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import * as DocumentPicker from "expo-document-picker"
import { File } from "expo-file-system"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useAuth } from "../src/features/auth/AuthProvider"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

type PickedAsset = { readonly uri: string; readonly mimeType?: string | null }

// Data URI dari gambar terpilih agar bisa disimpan di AsyncStorage (web: blob
// URL dibaca via fetch; native: File.base64()). ponytail: kompres di sisi
// klien bila ukuran foto membengkak.
async function assetToDataUri(asset: PickedAsset): Promise<string> {
  const mime = asset.mimeType ?? "image/jpeg"
  if (Platform.OS === "web") {
    const blob = await fetch(asset.uri).then((response) => response.blob())
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (const byte of bytes) {
      binary += String.fromCharCode(byte)
    }
    return `data:${mime};base64,${btoa(binary)}`
  }

  const file = new File(asset.uri)
  const base64 = await file.base64()
  return `data:${mime};base64,${base64}`
}

export default function EditProfileScreen(): React.ReactElement {
  const { profilePhoto, updatePhoto, updateProfile, user } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [name, setName] = useState(user?.name ?? "")
  const [nameError, setNameError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPicking, setIsPicking] = useState(false)

  async function handlePickPhoto(): Promise<void> {
    if (isPicking) {
      return
    }

    setIsPicking(true)
    setNotice(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: "image/*" })
      if (result.canceled || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      const dataUri = await assetToDataUri(asset)
      await updatePhoto(dataUri)
    } catch {
      setNotice("Foto gagal diproses. Pilih gambar lain.")
    } finally {
      setIsPicking(false)
    }
  }

  async function handleSave(): Promise<void> {
    const trimmed = name.trim()
    if (trimmed.length === 0) {
      setNameError("Nama wajib diisi.")
      return
    }
    if (trimmed.length > 60) {
      setNameError("Nama maksimal 60 karakter.")
      return
    }

    setNameError(null)
    setNotice(null)
    setIsSaving(true)
    const result = await updateProfile(trimmed)
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
          <Text style={styles.headerTitle}>Edit Profil</Text>
        </View>

        {/* Foto profil */}
        <View style={styles.photoSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {profilePhoto !== null ? (
                <Image accessibilityLabel="Foto profil" source={{ uri: profilePhoto }} style={styles.avatarPhoto} />
              ) : (
                <Image accessibilityLabel="Foto profil" source={require("../assets/images/avatar-budi.jpg")} style={styles.avatarPhoto} />
              )}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isPicking}
            onPress={() => void handlePickPhoto()}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textPrimary} name="camera-outline" size={18} />
            <Text style={styles.photoButtonText}>{isPicking ? "Memilih foto..." : "Ganti Foto"}</Text>
          </Pressable>
        </View>

        {/* Nama */}
        <View style={styles.field}>
          <Text style={styles.label}>Nama</Text>
          <View style={[styles.inputShell, nameError !== null && styles.inputShellError]}>
            <TextInput
              accessibilityLabel="Nama"
              autoCapitalize="words"
              editable={!isSaving}
              onChangeText={(value) => {
                setName(value)
                setNameError(null)
              }}
              placeholder="Nama lengkap"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              value={name}
            />
          </View>
          {nameError !== null ? (
            <Text accessibilityRole="alert" style={styles.fieldError}>
              {nameError}
            </Text>
          ) : null}
        </View>

        {notice !== null ? (
          <View accessibilityRole="alert" style={styles.notice}>
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        <PrimaryButton
          accessibilityLabel="Simpan perubahan"
          disabled={isSaving}
          loading={isSaving}
          label="Simpan Perubahan"
          onPress={() => void handleSave()}
        />
      </ScreenShell>
    </KeyboardAvoidingView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    avatar: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: 64,
      height: 128,
      justifyContent: "center",
      overflow: "hidden",
      width: 128,
    },
    avatarPhoto: {
      height: "100%",
      width: "100%",
    },
    avatarWrap: {
      ...shadows.card,
    },
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
    photoButton: {
      alignItems: "center",
      borderColor: colors.borderStrong,
      borderRadius: radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.lg,
    },
    photoButtonText: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    photoSection: {
      alignItems: "center",
      gap: spacing.md,
    },
    pressed: {
      opacity: 0.72,
    },
  })
}