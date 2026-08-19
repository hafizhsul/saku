import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo } from "react"
import { Image, Pressable, StyleSheet } from "react-native"

import { useAuth } from "../features/auth/AuthProvider"
import { radii, spacing, useThemeColors, type ThemeColors } from "../theme"

// Tombol profil di header semua tab: menampilkan foto profil jika sudah diatur,
// fallback ikon akun. Menuju layar Edit Profil saat ditekan.
export function ProfileHeaderButton(): React.ReactElement {
  const { profilePhoto } = useAuth()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      accessibilityLabel="Profil"
      accessibilityRole="button"
      onPress={() => router.push("/edit-profile")}
      style={({ pressed, hovered }) => [styles.button, hovered && styles.hovered, pressed && styles.pressed]}
    >
      {profilePhoto !== null ? (
        <Image accessibilityLabel="Foto profil" source={{ uri: profilePhoto }} style={styles.photo} />
      ) : (
        <MaterialCommunityIcons color={colors.textSecondary} name="account-circle-outline" size={32} />
      )}
    </Pressable>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    hovered: {
      backgroundColor: colors.surfaceMuted,
    },
    photo: {
      borderRadius: 16,
      height: 32,
      width: 32,
    },
    pressed: {
      opacity: 0.72,
    },
  })
}