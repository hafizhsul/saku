import { useEffect, useMemo, useRef, useState } from "react"
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from "react-native"

import { radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../theme"

export type HeroTone = "income" | "expense" | "neutral"

type HeroCardProps = {
  readonly eyebrow: string
  readonly amount: string
  readonly tone?: HeroTone
  readonly trailing?: React.ReactNode
  readonly footer?: React.ReactNode
  readonly accessibilityLabel?: string
  readonly animateAmount?: boolean
}

/**
 * Kartu hero berisi nominal besar: dipakai BalanceCard (netral), kartu ringkasan
 * /budgets (netral), dan kartu nominal detail transaksi (tint income/expense).
 */
export function HeroCard({
  eyebrow,
  amount,
  tone = "neutral",
  trailing,
  footer,
  accessibilityLabel,
  animateAmount = false,
}: HeroCardProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const toneColor = tone === "income" ? colors.income : tone === "expense" ? colors.expense : colors.textPrimary
  const eyebrowColor = tone === "neutral" ? colors.textSecondary : toneColor
  const background = tone === "neutral" ? colors.surfaceElevated : tone === "income" ? colors.incomeSurface : colors.expenseSurface
  const [reduceMotion, setReduceMotion] = useState(false)
  const [amountOpacity] = useState(() => new Animated.Value(1))
  const [amountTranslateY] = useState(() => new Animated.Value(0))
  const previousAmount = useRef(amount)

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!animateAmount || reduceMotion || previousAmount.current === amount) {
      return
    }
    previousAmount.current = amount
    amountOpacity.setValue(0.2)
    amountTranslateY.setValue(5)
    Animated.parallel([
      Animated.timing(amountOpacity, { duration: 260, toValue: 1, useNativeDriver: true }),
      Animated.spring(amountTranslateY, { bounciness: 4, speed: 18, toValue: 0, useNativeDriver: true }),
    ]).start()
  }, [amount, amountOpacity, amountTranslateY, animateAmount, reduceMotion])

  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={[styles.card, { backgroundColor: background }]}>
      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow}</Text>
        {trailing}
      </View>
      <Animated.Text
        style={[
          styles.amount,
          { color: toneColor },
          animateAmount && !reduceMotion ? { opacity: amountOpacity, transform: [{ translateY: amountTranslateY }] } : null,
        ]}
      >
        {amount}
      </Animated.Text>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    amount: {
      color: colors.textPrimary,
      fontSize: typography.display.fontSize,
      fontFamily: typography.display.fontFamily,
      fontVariant: ["tabular-nums"],
      fontWeight: typography.display.fontWeight,
      letterSpacing: -0.5,
      lineHeight: typography.display.lineHeight,
      marginTop: spacing.md,
    },
    card: {
      borderColor: colors.border,
      borderRadius: radii.xl,
      borderWidth: 1,
      padding: spacing["2xl"],
      ...shadows.elevated,
    },
    eyebrow: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    footer: {
      marginTop: spacing.sm,
    },
    topRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "space-between",
    },
  })
}
