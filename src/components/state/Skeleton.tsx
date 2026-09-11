import { useEffect, useMemo, useState } from "react"
import { AccessibilityInfo, Animated, StyleSheet, View, type DimensionValue } from "react-native"
import { radii, useThemeColors, type ThemeColors } from "../../theme"

export function skeletonShimmer(reduceMotion: boolean) {
  return reduceMotion ? { from: 1, to: 1, duration: 0 } : { from: 0.45, to: 1, duration: 900 }
}

type SkeletonProps = { readonly width?: number | string; readonly height: number; readonly radius?: number; readonly testID?: string }

export function Skeleton({ width = "100%", height, radius = radii.md, testID }: SkeletonProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [reduceMotion, setReduceMotion] = useState(false)
  const [opacity] = useState(() => new Animated.Value(1))
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setReduceMotion(v) })
    return () => { mounted = false }
  }, [])
  useEffect(() => {
    if (reduceMotion) return
    const cfg = skeletonShimmer(false)
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { duration: cfg.duration, toValue: cfg.from, useNativeDriver: true }),
      Animated.timing(opacity, { duration: cfg.duration, toValue: cfg.to, useNativeDriver: true }),
    ]))
    loop.start()
    return () => { loop.stop() }
  }, [opacity, reduceMotion])
  return (
    <View accessibilityLabel="Memuat konten" accessibilityRole="progressbar" testID={testID}>
      <Animated.View style={[styles.block, { width: width as DimensionValue, height, borderRadius: radius, opacity }]} />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    block: {
      backgroundColor: colors.surfaceMuted,
    },
  })
}
