import { router, Stack } from "expo-router"
import { useMemo } from "react"
import { StyleSheet, Text, View } from "react-native"

import { PrimaryButton } from "../src/components/PrimaryButton"
import { spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

export default function NotFoundScreen(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.title}>Halaman tidak ditemukan</Text>
        <Text style={styles.subtitle}>Alamat ini tidak ada atau sudah dipindahkan.</Text>
        <View style={styles.action}>
          <PrimaryButton label="Kembali ke Beranda" onPress={() => router.replace("/")} />
        </View>
      </View>
    </>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    action: {
      marginTop: spacing.md,
      width: "100%",
    },
    container: {
      alignItems: "center",
      backgroundColor: colors.canvas,
      flex: 1,
      gap: spacing.row,
      justifyContent: "center",
      padding: spacing.xl,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textAlign: "center",
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
      textAlign: "center",
    },
  })
}
