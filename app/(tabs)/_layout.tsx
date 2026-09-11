import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, Tabs } from "expo-router"
import { useMemo, useState, type ComponentProps } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { fontFamilies, radii, shadows, spacing, useThemeColors, type ThemeColors } from "../../src/theme"
import { stateInteraction } from "../../src/components/state/pressable"

type TabBarProps = NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
type TabBarPropsArg = Parameters<TabBarProps>[0]

type TabIconName =
  | "home-variant"
  | "home-variant-outline"
  | "history"
  | "account"
  | "account-outline"
  | "chart-box"
  | "chart-box-outline"

type TabSlot = {
  readonly route: string
  readonly label: string
  readonly icon: TabIconName
}

const tabSlots: readonly TabSlot[] = [
  { route: "index", label: "Beranda", icon: "home-variant-outline" },
  { route: "transactions", label: "Riwayat", icon: "history" },
  { route: "analisis", label: "Analisis", icon: "chart-box-outline" },
  { route: "settings", label: "Profil", icon: "account-outline" },
]

function SakuTabBar({ state, navigation }: TabBarPropsArg): React.ReactElement {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const styles = useMemo(() => createStyles(colors), [colors])
  const interaction = useMemo(() => stateInteraction(colors), [colors])
  const [focusedKey, setFocusedKey] = useState<string | null>(null)

  const left = tabSlots.slice(0, 2)
  const right = tabSlots.slice(2)

  function renderSlot(slot: TabSlot): React.ReactElement {
    const route = state.routes.find((r) => r.name === slot.route)
    if (route === undefined) {
      return <View key={slot.route} style={styles.slot} />
    }
    const index = state.routes.indexOf(route)
    const focused = index === state.index
    const activeIcon = slot.icon.replace("-outline", "") as TabIconName

    return (
      <Pressable
        accessibilityLabel={slot.label}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        key={slot.route}
        onBlur={() => setFocusedKey(null)}
        onFocus={() => setFocusedKey(slot.route)}
        onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }}
        style={({ pressed }) => [styles.slot, pressed && styles.pressed, focusedKey === slot.route && interaction.focusRing]}
      >
        <View style={[styles.iconWell, focused && styles.iconWellActive]}>
          <MaterialCommunityIcons
            color={focused ? colors.accent : colors.textTertiary}
            name={focused ? activeIcon : slot.icon}
            size={22}
          />
        </View>
        <Text style={[styles.label, focused && styles.labelActive]}>{slot.label}</Text>
      </Pressable>
    )
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.row}>
        {left.map(renderSlot)}
        <Pressable
          accessibilityLabel="Tambah transaksi"
          accessibilityRole="button"
          onBlur={() => setFocusedKey(null)}
          onFocus={() => setFocusedKey("fab")}
          onPress={() => router.push("/add-transaction")}
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed, focusedKey === "fab" && { borderColor: colors.focus }]}
        >
          <MaterialCommunityIcons color={colors.surface} name="plus" size={34} />
        </Pressable>
        {right.map(renderSlot)}
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: colors.surfaceElevated,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      paddingTop: 2,
    },
    fab: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderColor: colors.surfaceElevated,
      borderRadius: radii.pill,
      borderWidth: 4,
      height: 64,
      justifyContent: "center",
      marginTop: -32,
      width: 64,
      ...shadows.elevated,
    },
    fabPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.96 }],
    },
    iconWell: {
      alignItems: "center" as const,
      borderRadius: radii.md,
      height: 28,
      justifyContent: "center" as const,
      width: 44,
    },
    iconWellActive: {
      backgroundColor: colors.accentSurface,
    },
    label: {
      color: colors.textTertiary,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600" as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelActive: {
      color: colors.accent,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: "flex-start",
      flexDirection: "row",
      height: 60,
      paddingHorizontal: 4,
      paddingTop: 2,
    },
    slot: {
      alignItems: "center",
      flex: 1,
      gap: 2,
      justifyContent: "center",
      paddingVertical: 2,
    },
  })
}

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <SakuTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="analisis" />
      <Tabs.Screen name="settings" />
    </Tabs>
  )
}
