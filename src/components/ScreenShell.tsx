import { StatusBar } from "expo-status-bar"
import { useMemo } from "react"
import { useColorScheme } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { spacing, useThemeColors, type ThemeColors } from "../theme"

type ScreenShellProps = ScrollViewProps & {
  readonly children: React.ReactNode
  readonly withTabBar?: boolean
  readonly contentStyle?: StyleProp<ViewStyle>
}

export function ScreenShell({ children, withTabBar = true, contentStyle, ...scrollViewProps }: ScreenShellProps): React.ReactElement {
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()
  const scheme = useColorScheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const bottomReserve = withTabBar ? 88 + insets.bottom : spacing.xl + insets.bottom

  return (
    <View style={styles.root}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ScrollView
        {...scrollViewProps}
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: bottomReserve }, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.canvas,
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      gap: spacing.section,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
  })
}
