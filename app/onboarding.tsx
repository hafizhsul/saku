import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { PrimaryButton } from "../src/components/PrimaryButton"
import { setOnboardingDone } from "../src/storage/onboarding"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

const slides = [
  {
    icon: "piggy-bank-outline",
    title: "Catat tanpa ribet",
    copy: "Pemasukan dan pengeluaran tercatat dalam hitungan detik, kapan saja.",
  },
  {
    icon: "tune-variant",
    title: "Kendalikan anggaran",
    copy: "Beri batas bulanan per kategori dan pantau sisa harianmu.",
  },
  {
    icon: "repeat",
    title: "Otomatiskan tagihan",
    copy: "Gaji dan tagihan bulanan tercatat sendiri saat bulan berganti.",
  },
] as const

type OnboardingScreenProps = {
  /** Dipakai saat onboarding dirender inline oleh root layout (bukan sebagai route). */
  readonly onDone?: () => void
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const insets = useSafeAreaInsets()
  const [index, setIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const isLast = index === slides.length - 1
  const slide = slides[index]

  async function finish(): Promise<void> {
    setBusy(true)
    await setOnboardingDone()
    if (onDone !== undefined) {
      onDone()
      return
    }
    router.replace("/(tabs)")
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topRow}>
        <Text style={styles.brand}>Saku</Text>
        <Pressable
          accessibilityLabel="Lewati onboarding"
          accessibilityRole="button"
          disabled={busy}
          hitSlop={10}
          onPress={() => void finish()}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Lewati</Text>
        </Pressable>
      </View>

      <View style={styles.slide}>
        <View style={styles.iconWell}>
          <View style={styles.halo} />
          <MaterialCommunityIcons color={colors.accent} name={slide.icon} size={40} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.copy}>{slide.copy}</Text>
      </View>

      <View style={styles.footer}>
        <View accessibilityLabel={`Slide ${index + 1} dari ${slides.length}`} style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View
              key={item.title}
              style={[styles.dot, dotIndex === index && styles.dotActive, dotIndex < index && styles.dotDone]}
            />
          ))}
        </View>
        <PrimaryButton
          icon={isLast ? "check" : "arrow-right"}
          label={isLast ? "Mulai mencatat" : "Lanjut"}
          loading={busy}
          onPress={() => {
            if (isLast) {
              void finish()
            } else {
              setIndex((current) => current + 1)
            }
          }}
        />
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    brand: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
    },
    copy: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      maxWidth: 320,
      textAlign: "center",
    },
    dot: {
      backgroundColor: colors.borderStrong,
      borderRadius: radii.pill,
      height: 8,
      width: 8,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 24,
    },
    dotDone: {
      backgroundColor: colors.accentSurface,
    },
    dots: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 24,
    },
    footer: {
      gap: spacing.lg,
    },
    halo: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.xl,
      height: 88,
      opacity: 0.7,
      position: "absolute",
      width: 88,
    },
    iconWell: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 32,
      borderWidth: 1,
      height: 112,
      justifyContent: "center",
      overflow: "visible",
      width: 112,
    },
    pressed: {
      opacity: 0.72,
    },
    root: {
      backgroundColor: colors.canvas,
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
    },
    skipButton: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.sm,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    slide: {
      alignItems: "center",
      flex: 1,
      gap: spacing.lg,
      justifyContent: "center",
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      textAlign: "center",
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  })
}
