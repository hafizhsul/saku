import { createContext, useContext } from "react"
import { useColorScheme } from "react-native"

export const lightColors = {
  canvas: "#F7F6F3",
  surface: "#FFFFFF",
  surfaceMuted: "#F0EFE9",
  surfaceElevated: "#FFFFFF",
  textPrimary: "#23272B",
  textSecondary: "#5C6267",
  textTertiary: "#6C6C6C",
  border: "#E8E4DB",
  borderStrong: "#D9D4C9",
  action: "#23272B",
  actionPressed: "#101316",
  income: "#2F7A4D",
  incomeSurface: "#E7F1EA",
  expense: "#B03B33",
  expenseSurface: "#F9E8E6",
  accent: "#9A6B00",
  accentSurface: "#F8F0D7",
  focus: "#2547D0",
  error: "#A12723",
} as const

export const darkColors = {
  canvas: "#171918",
  surface: "#232724",
  surfaceMuted: "#2C322D",
  surfaceElevated: "#2A2E2B",
  textPrimary: "#F7F6F3",
  textSecondary: "#C9CEC9",
  textTertiary: "#9CA49E",
  border: "#3B423D",
  borderStrong: "#4E574F",
  action: "#F7F6F3",
  actionPressed: "#FFFFFF",
  income: "#92CD99",
  incomeSurface: "#24382A",
  expense: "#F1A5A0",
  expenseSurface: "#462C2A",
  accent: "#F3C468",
  accentSurface: "#473F26",
  focus: "#9FB3FF",
  error: "#FFB4AE",
} as const

export type ThemeColors = { readonly [Key in keyof typeof lightColors]: string }

export type ThemePreference = "system" | "light" | "dark"

export const themePreferenceOptions: readonly { readonly value: ThemePreference; readonly label: string }[] = [
  { value: "system", label: "Sistem" },
  { value: "light", label: "Terang" },
  { value: "dark", label: "Gelap" },
]

const ThemePreferenceContext = createContext<ThemePreference>("system")

export function ThemePreferenceProvider({ preference, children }: { readonly preference: ThemePreference; readonly children: React.ReactNode }): React.ReactElement {
  return <ThemePreferenceContext.Provider value={preference}>{children}</ThemePreferenceContext.Provider>
}

export function useThemePreference(): ThemePreference {
  return useContext(ThemePreferenceContext)
}

export function useThemeColors(): ThemeColors {
  const preference = useThemePreference()
  const scheme = useColorScheme()

  if (preference === "light") {
    return lightColors
  }
  if (preference === "dark") {
    return darkColors
  }

  return scheme === "dark" ? darkColors : lightColors
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  /** Alias semantik untuk ritme jarak: pakai ini untuk `gap`, nilai numerik untuk padding/margin. */
  unit: 4, // ikon-ke-teks, penyelarasan rapat
  compact: 8, // chip, jarak label-ke-input, ikon-ke-label
  row: 12, // baris daftar, pasangan kartu, aksi form
  group: 16, // grup kartu, jarak antar elemen dalam kartu
  section: 20, // pemisah antar blok utama layar dan gutter halaman
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const

export const fontFamilies = {
  regular: "PlusJakartaSans_400Regular",
  medium: "PlusJakartaSans_500Medium",
  semibold: "PlusJakartaSans_600SemiBold",
  bold: "PlusJakartaSans_700Bold",
  extrabold: "PlusJakartaSans_800ExtraBold",
} as const

export const typography = {
  display: { fontSize: 40, fontWeight: "800", lineHeight: 46, fontFamily: fontFamilies.extrabold },
  title: { fontSize: 30, fontWeight: "700", lineHeight: 36, fontFamily: fontFamilies.bold },
  heading: { fontSize: 20, fontWeight: "700", lineHeight: 26, fontFamily: fontFamilies.bold },
  bodyLarge: { fontSize: 18, fontWeight: "400", lineHeight: 26, fontFamily: fontFamilies.regular },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24, fontFamily: fontFamilies.regular },
  bodyMedium: { fontSize: 14, fontWeight: "600", lineHeight: 20, fontFamily: fontFamilies.semibold },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16, fontFamily: fontFamilies.medium },
  overline: { fontSize: 11, fontWeight: "700", lineHeight: 14, fontFamily: fontFamilies.bold },
} as const

export const shadows = {
  card: {
    boxShadow: "0 1px 2px rgba(35, 39, 43, 0.04), 0 4px 12px rgba(35, 39, 43, 0.06)",
    elevation: 2,
  },
  elevated: {
    boxShadow: "0 2px 4px rgba(35, 39, 43, 0.05), 0 10px 28px rgba(35, 39, 43, 0.10)",
    elevation: 4,
  },
} as const

export const motion = {
  micro: 150,
  standard: 250,
  emphasis: 400,
} as const

export type SemanticTone = "income" | "expense" | "neutral"
