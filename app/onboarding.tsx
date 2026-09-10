import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { setOnboardingDone } from "../src/storage/onboarding"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

const BAR_HEIGHTS = [24, 36, 28, 44, 56, 40, 20]
const BAR_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

const slides = [
  {
    badge: "Keuangan Pintar & Mudah",
    title: "Atur Gaji & Pos Pengeluaran Tanpa Ribet",
    copy: "Pisahkan anggaran belanja, tabungan, dan kebutuhan harian ke dalam kantong digital otomatis yang disiplin.",
    cta: "Lanjutkan",
  },
  {
    badge: "Analisis Cerdas & Akurat",
    title: "Ketahui Kemana Setiap Rupiah Mengalir",
    copy: "Pantau tren pengeluaran harian dan dapatkan notifikasi cerdas sebelum kuota anggaran bulananmu terlampaui.",
    cta: "Mulai Sekarang",
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
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: Math.max(insets.bottom, spacing.md) + spacing["3xl"],
        },
      ]}
    >
      <View style={styles.topRow}>
        <Pressable
          accessibilityLabel="Lewati onboarding"
          accessibilityRole="button"
          disabled={busy}
          hitSlop={10}
          onPress={() => void finish()}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Lewati</Text>
          <MaterialCommunityIcons color={colors.textSecondary} name="chevron-right" size={16} />
        </Pressable>
      </View>

      <View style={styles.slide}>
        {index === 0 ? <WalletHero /> : <CashflowHero />}

        <View style={styles.badge}>
          <MaterialCommunityIcons color={colors.accent} name="creation" size={14} />
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        <View>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.copy}>{slide.copy}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View accessibilityLabel={`Slide ${index + 1} dari ${slides.length}`} style={styles.dots}>
          {slides.map((item, dotIndex) => (
            <View key={item.title} style={[styles.dot, dotIndex === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable
          accessibilityLabel={slide.cta}
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            if (isLast) {
              void finish()
            } else {
              setIndex((current) => current + 1)
            }
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, busy && styles.disabled]}
        >
          <Text style={styles.ctaText}>{slide.cta}</Text>
          <MaterialCommunityIcons color={colors.surface} name="arrow-right" size={20} />
        </Pressable>
        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>Sudah punya akun Saku? </Text>
          <Pressable
            accessibilityLabel="Masuk ke akun"
            accessibilityRole="button"
            disabled={busy}
            hitSlop={10}
            onPress={() => void finish()}
          >
            <Text style={styles.loginLink}>Masuk</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

// Hero slide 1 ala Stitch: kartu emerald miring + kartu putih Makan & Minum
// + pill hemat melayang + lencana perisai + pill Otomatis + ring geometri.
function WalletHero(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.stage}>
      <View style={styles.ringOuter} />
      <View style={styles.ringInner} />

      <View style={styles.smartCard}>
        <View style={styles.smartTopRow}>
          <View style={styles.smartBrandRow}>
            <View style={styles.smartIconBox}>
              <MaterialCommunityIcons color={colors.heroMuted} name="wallet-outline" size={20} />
            </View>
            <Text style={styles.smartBrand}>Saku Financial</Text>
          </View>
          <MaterialCommunityIcons color={colors.heroMuted} name="contactless-payment" size={22} />
        </View>
        <View style={styles.chipRow}>
          <View style={styles.chipBox}>
            <View style={styles.chipInner} />
          </View>
          <Text style={styles.chipNumber}>•••• 8829</Text>
        </View>
        <View style={styles.smartBalanceRow}>
          <View>
            <Text style={styles.smartCaption}>Saldo Utama</Text>
            <Text style={styles.smartAmount}>Rp 18.450.000</Text>
          </View>
          <View style={styles.cardDots}>
            <View style={styles.cardDotRed} />
            <View style={[styles.cardDotAmber, styles.cardDotOverlap]} />
          </View>
        </View>
      </View>

      <View style={styles.pocketCard}>
        <View style={styles.pocketTopRow}>
          <View style={styles.pocketBrandRow}>
            <View style={styles.pocketIcon}>
              <MaterialCommunityIcons color={colors.accent} name="food-fork-drink" size={20} />
            </View>
            <View>
              <Text style={styles.pocketTitle}>Makan & Minum</Text>
              <Text style={styles.pocketSub}>Saku Harian</Text>
            </View>
          </View>
          <View style={styles.safeChip}>
            <Text style={styles.safeChipText}>AMAN</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "62%" }]} />
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressUsed}>Terpakai 62%</Text>
          <Text style={styles.progressValue}>Rp 1.500.000</Text>
        </View>
      </View>

      <View style={styles.hematPill}>
        <View style={styles.hematIcon}>
          <MaterialCommunityIcons color={colors.surface} name="trending-up" size={16} />
        </View>
        <View>
          <Text style={styles.hematTitle}>38% Lebih Hemat</Text>
          <Text style={styles.hematSub}>Dibanding bulan lalu</Text>
        </View>
      </View>

      <View style={styles.shieldBadge}>
        <MaterialCommunityIcons color={colors.accent} name="shield-check" size={20} />
        <View>
          <Text style={styles.shieldTitle}>TERLINDUNGI</Text>
          <Text style={styles.shieldSub}>Enkripsi 256-Bit</Text>
        </View>
      </View>

      <View style={styles.autoPill}>
        <View style={styles.autoDot} />
        <Text style={styles.autoText}>Otomatis</Text>
      </View>
    </View>
  )
}

// Hero slide 2 ala Stitch: kartu emerald miring (panel grafik + garis batas
// putus-putus) + pill status menumpuk kanan-atas + kartu kuota menumpuk bawah.
function CashflowHero(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.stageTall}>
      <View style={styles.cashCard}>
        <View style={styles.smartTopRow}>
          <View style={styles.smartBrandRow}>
            <View style={styles.cashIconBox}>
              <MaterialCommunityIcons color={colors.heroMuted} name="chart-bar" size={16} />
            </View>
            <View>
              <Text style={styles.smartCaption}>Arus Kas Pekanan</Text>
              <Text style={styles.smartBrand}>Analisis Pengeluaran</Text>
            </View>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Real-time</Text>
          </View>
        </View>
        <View style={styles.chartPanel}>
          <View style={styles.limitRow}>
            <Text style={styles.cashLimit}>Batas: Rp 75k/hr</Text>
          </View>
          <View style={styles.bars}>
            {BAR_HEIGHTS.map((height, barIndex) => (
              <View key={BAR_LABELS[barIndex]} style={styles.barCol}>
                <View
                  style={[
                    styles.chartBar,
                    { height, opacity: barIndex === 4 ? 1 : 0.45 },
                    barIndex === 4 && styles.chartBarPeak,
                  ]}
                />
                <Text style={[styles.barLabel, barIndex === 4 && styles.barLabelPeak]}>{BAR_LABELS[barIndex]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.statusPill}>
        <View style={styles.statusIcon}>
          <MaterialCommunityIcons color={colors.accent} name="shield-check" size={14} />
        </View>
        <View>
          <Text style={styles.statusCaption}>Status Kuota</Text>
          <Text style={styles.statusTitle}>Aman Terkendali</Text>
        </View>
      </View>

      <View style={styles.quotaCard}>
        <View style={styles.quotaTopRow}>
          <View style={styles.quotaBrandRow}>
            <View style={styles.quotaIcon}>
              <MaterialCommunityIcons color={colors.accent} name="currency-usd" size={16} />
            </View>
            <View style={styles.quotaText}>
              <Text style={styles.quotaTitle}>Sisa Kuota Aman</Text>
              <Text style={styles.quotaSub}>Batas Anggaran Bulanan</Text>
            </View>
          </View>
          <Text style={styles.quotaChip}>68% Sisa</Text>
        </View>
        <View style={styles.quotaDivider} />
        <View style={styles.quotaBottomRow}>
          <View style={styles.quotaHematRow}>
            <View style={styles.quotaHematIcon}>
              <MaterialCommunityIcons color={colors.surface} name="arrow-top-right" size={12} />
            </View>
            <Text style={styles.quotaHematText}>Hemat 38% vs Pekan Lalu</Text>
          </View>
          <Text style={styles.quotaValue}>Rp 1.450.000</Text>
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    autoDot: {
      backgroundColor: "#F59E0B",
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    autoPill: {
      alignItems: "center",
      backgroundColor: "#FEF3C7",
      borderRadius: radii.pill,
      elevation: 2,
      flexDirection: "row",
      gap: spacing.xs,
      left: 96,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      position: "absolute",
      top: 0,
    },
    autoText: {
      color: "#92400E",
      fontFamily: fontFamilies.semibold,
      fontSize: 10,
      fontWeight: "600",
    },
    badge: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    badgeText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    barCol: {
      alignItems: "center",
      gap: 2,
      justifyContent: "flex-end",
    },
    barLabel: {
      color: colors.heroMuted,
      fontSize: 8,
    },
    barLabelPeak: {
      color: colors.surface,
      fontWeight: "700",
    },
    bars: {
      alignItems: "flex-end",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "space-between",
      minHeight: 64,
    },
    cardDotAmber: {
      backgroundColor: "#FCD34D",
      borderRadius: 10,
      height: 20,
      opacity: 0.85,
      width: 20,
    },
    cardDotOverlap: {
      marginLeft: -6,
    },
    cardDotRed: {
      backgroundColor: "#F87171",
      borderRadius: 10,
      height: 20,
      opacity: 0.85,
      width: 20,
    },
    cardDots: {
      flexDirection: "row",
    },
    cashCard: {
      backgroundColor: colors.heroBackground,
      borderRadius: radii.md,
      gap: spacing.md,
      padding: spacing.group,
      transform: [{ rotate: "-2deg" }],
    },
    cashIconBox: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 8,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    cashLimit: {
      color: colors.heroMuted,
      fontSize: 9,
    },
    chartBar: {
      backgroundColor: colors.heroMuted,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      width: 14,
    },
    chartBarPeak: {
      backgroundColor: "#A7F3D0",
      elevation: 2,
    },
    chartPanel: {
      backgroundColor: "rgba(0, 0, 0, 0.25)",
      borderRadius: radii.md,
      gap: spacing.compact,
      padding: spacing.md,
      paddingTop: spacing.sm,
    },
    chipBox: {
      alignItems: "center",
      backgroundColor: "#FCD34D",
      borderRadius: 4,
      height: 20,
      justifyContent: "center",
      opacity: 0.9,
      width: 28,
    },
    chipInner: {
      backgroundColor: "#F59E0B",
      borderRadius: 4,
      height: 12,
      opacity: 0.4,
      width: 16,
    },
    chipNumber: {
      color: colors.heroMuted,
      fontSize: 11,
      letterSpacing: 2,
    },
    chipRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    copy: {
      color: colors.textSecondary,
      fontFamily: typography.body.fontFamily,
      fontSize: 15,
      fontWeight: typography.body.fontWeight,
      lineHeight: 22,
      marginTop: spacing.compact,
      maxWidth: 320,
      textAlign: "center",
    },
    cta: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 52,
      paddingHorizontal: spacing.xl,
    },
    ctaPressed: {
      opacity: 0.9,
      transform: [{ scale: 0.98 }],
    },
    ctaText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    disabled: {
      opacity: 0.55,
    },
    dot: {
      backgroundColor: colors.borderStrong,
      borderRadius: radii.pill,
      height: 8,
      width: 8,
    },
    dotActive: {
      backgroundColor: colors.accent,
      width: 32,
    },
    dots: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      marginVertical: spacing.xl,
      minHeight: 24,
    },
    footer: {},
    hematIcon: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 14,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    hematPill: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.pill,
      bottom: 0,
      elevation: 3,
      flexDirection: "row",
      gap: spacing.compact,
      left: 0,
      padding: spacing.compact,
      paddingRight: spacing.md,
      position: "absolute",
    },
    hematSub: {
      color: colors.textSecondary,
      fontSize: 10,
    },
    hematTitle: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 16,
      fontWeight: "700",
    },
    limitRow: {
      alignItems: "center",
      borderBottomColor: "rgba(255, 255, 255, 0.4)",
      borderBottomWidth: 1,
      borderStyle: "dashed",
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingBottom: spacing.xs,
    },
    liveBadge: {
      alignItems: "center",
      backgroundColor: "rgba(251, 191, 36, 0.2)",
      borderColor: "rgba(251, 191, 36, 0.4)",
      borderRadius: radii.pill,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    liveDot: {
      backgroundColor: "#FBBF24",
      borderRadius: 3,
      height: 6,
      width: 6,
    },
    liveText: {
      color: "#FDE68A",
      fontFamily: fontFamilies.semibold,
      fontSize: 10,
      fontWeight: "600",
    },
    loginHint: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
    },
    loginLink: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "700",
    },
    loginRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      marginTop: spacing.md,
      minHeight: 44,
    },
    pocketBrandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    pocketCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      bottom: 28,
      elevation: 4,
      gap: spacing.compact,
      padding: spacing.group,
      position: "absolute",
      right: 0,
      transform: [{ rotate: "3deg" }],
      width: 256,
    },
    pocketIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 18,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    pocketSub: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    pocketTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 15,
      fontWeight: "600",
    },
    pocketTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    pressed: {
      opacity: 0.72,
    },
    progressFill: {
      backgroundColor: colors.accent,
      borderRadius: 4,
      height: "100%",
    },
    progressRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 4,
      height: 8,
      overflow: "hidden",
    },
    progressUsed: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    progressValue: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    quotaBottomRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    quotaBrandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    quotaCard: {
      alignItems: "stretch",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      elevation: 3,
      gap: spacing.sm,
      marginHorizontal: spacing.group,
      marginTop: -28,
      padding: spacing.md,
      zIndex: 1,
    },
    quotaDivider: {
      backgroundColor: colors.border,
      height: 1,
    },
    quotaHematIcon: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: 10,
      height: 20,
      justifyContent: "center",
      width: 20,
    },
    quotaHematRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    quotaHematText: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: 11,
      fontWeight: "600",
    },
    quotaIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    quotaTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    quotaChip: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 10,
      fontWeight: "700",
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    quotaSub: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    quotaText: {
      flex: 1,
    },
    quotaTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 13,
      fontWeight: "600",
    },
    quotaValue: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 13,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    ringInner: {
      borderColor: colors.accentSurface,
      borderRadius: 85,
      borderStyle: "dashed",
      borderWidth: 1,
      height: 170,
      opacity: 0.6,
      position: "absolute",
      width: 170,
    },
    ringOuter: {
      borderColor: colors.accentSurface,
      borderRadius: 120,
      borderStyle: "dashed",
      borderWidth: 1.5,
      height: 240,
      position: "absolute",
      width: 240,
    },
    root: {
      backgroundColor: colors.canvas,
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: spacing.xl,
    },
    safeChip: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    safeChipText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 10,
      fontWeight: "700",
    },
    shieldBadge: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      elevation: 2,
      flexDirection: "row",
      gap: spacing.compact,
      padding: spacing.compact,
      position: "absolute",
      right: 0,
      top: 4,
    },
    shieldSub: {
      color: colors.textSecondary,
      fontSize: 8,
    },
    shieldTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 9,
      fontWeight: "700",
    },
    skipButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      elevation: 1,
      flexDirection: "row",
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.group,
      paddingVertical: spacing.compact,
    },
    skipText: {
      color: colors.textSecondary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    slide: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
    },
    smartAmount: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 18,
      fontWeight: "700",
    },
    smartBalanceRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    smartBrand: {
      color: colors.heroMuted,
      fontFamily: fontFamilies.semibold,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    smartBrandRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
    },
    smartCaption: {
      color: colors.heroMuted,
      fontFamily: fontFamilies.semibold,
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    smartCard: {
      backgroundColor: colors.heroBackground,
      borderRadius: radii.md,
      gap: spacing.md,
      left: 4,
      padding: spacing.group,
      position: "absolute",
      top: 10,
      transform: [{ rotate: "-6deg" }],
      width: 256,
    },
    smartIconBox: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 8,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    smartTopRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    stage: {
      alignItems: "center",
      alignSelf: "center",
      height: 320,
      justifyContent: "center",
      marginBottom: spacing.xl,
      maxWidth: 340,
      overflow: "hidden",
      width: "100%",
    },
    stageTall: {
      alignSelf: "center",
      marginBottom: spacing.xl,
      maxWidth: 340,
      width: "100%",
    },
    statusCaption: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    statusIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    statusPill: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: radii.md,
      elevation: 2,
      flexDirection: "row",
      gap: spacing.compact,
      padding: spacing.compact,
      paddingRight: spacing.md,
      position: "absolute",
      right: 4,
      top: -14,
      zIndex: 1,
    },
    statusTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 13,
      fontWeight: "600",
    },
    title: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 26,
      fontWeight: "700",
      lineHeight: 32,
      textAlign: "center",
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
  })
}
