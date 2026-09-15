import { StatusBar } from "expo-status-bar"
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native"

// Splash bermerek: dipakai RootLayout selama font + status onboarding dimuat.
// Latar disamakan dengan config expo-splash-screen di app.json agar transisi
// native → JS mulus (#036552 terang, #171918 gelap). Tanpa delay buatan:
// hilang segera setelah ready.
export function BrandSplash(): React.ReactElement {
  const scheme = useColorScheme()
  const dark = scheme === "dark"

  return (
    <View accessible={false} style={[styles.root, dark ? styles.rootDark : styles.rootLight]}>
      <StatusBar style="light" />
      <Image
        accessibilityIgnoresInvertColors
        source={require("../../assets/images/icon.png")}
        style={styles.icon}
      />
      <Text style={styles.title}>Saku</Text>
      <Text style={styles.tagline}>Catat keuangan tanpa ribet</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  icon: {
    borderRadius: 28,
    height: 112,
    width: 112,
  },
  root: {
    alignItems: "center",
    flex: 1,
    gap: 8,
    justifyContent: "center",
    paddingBottom: 48,
  },
  rootDark: {
    backgroundColor: "#171918",
  },
  rootLight: {
    backgroundColor: "#036552",
  },
  tagline: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 14,
    fontWeight: "500",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 12,
  },
})
