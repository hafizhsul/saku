import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Tabs } from "expo-router"
import { useMemo } from "react"
import { View, type ColorValue } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fontFamilies, radii, shadows, spacing, useThemeColors } from "../../src/theme"

type TabIconProps = {
  readonly color: ColorValue
  readonly focused: boolean
  readonly activeName: "home-variant" | "receipt-text" | "cog"
}

function TabIcon({ color, focused, activeName }: TabIconProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createIconWellStyles(colors), [colors])

  return (
    <View style={[styles.iconWell, focused && styles.iconWellActive]}>
      <MaterialCommunityIcons color={color} name={focused ? activeName : `${activeName}-outline`} size={focused ? 24 : 22} />
    </View>
  )
}

function createIconWellStyles(colors: ReturnType<typeof useThemeColors>) {
  return {
    iconWell: {
      alignItems: "center" as const,
      borderRadius: radii.pill,
      height: 30,
      justifyContent: "center" as const,
      width: 52,
    },
    iconWellActive: {
      backgroundColor: colors.accentSurface,
    },
  }
}

export default function TabLayout(): React.ReactElement {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const screenOptions = useMemo(
    () => ({
      animation: "shift" as const,
      headerShown: false,
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.textTertiary,
      tabBarLabelStyle: {
        fontFamily: fontFamilies.semibold,
        fontSize: 12,
        fontWeight: "600" as const,
        letterSpacing: 0.1,
        // Line height lega: label punya overflow tersembunyi, descender
        // huruf seperti "g"/"p" terpotong jika garis terlalu rapat.
        lineHeight: 20,
      },
      tabBarItemStyle: {
        paddingVertical: spacing.xs,
      },
      tabBarStyle: {
        backgroundColor: colors.surfaceElevated,
        borderColor: colors.border,
        borderRadius: 30,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        borderWidth: 1,
        // Naikkan sebesar inset aman perangkat agar label tidak tertutup
        // bar navigasi sistem (Android) atau home indicator (iOS).
        bottom: 20 + insets.bottom,
        height: 68,
        left: 20,
        paddingBottom: 0,
        paddingTop: 0,
        position: "absolute" as const,
        right: 20,
        ...shadows.elevated,
      },
    }),
    [colors, insets.bottom],
  )

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, focused }) => <TabIcon activeName="home-variant" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transaksi",
          tabBarIcon: ({ color, focused }) => <TabIcon activeName="receipt-text" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Pengaturan",
          tabBarIcon: ({ color, focused }) => <TabIcon activeName="cog" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  )
}
