import { createContext, useContext } from "react"
import { useColorScheme } from "react-native"

export const lightColors = {
  canvas: "#F4F5F4",
  surface: "#FFFFFF",
  surfaceMuted: "#ECEEED",
  surfaceElevated: "#FFFFFF",
  textPrimary: "#1D2228",
  textSecondary: "#5B636B",
  textTertiary: "#6A7077",
  border: "#D8DCDA",
  borderStrong: "#C2C8C5",
  action: "#1D2228",
  actionPressed: "#101419",
  income: "#1E6F4E",
  incomeSurface: "#E3EEE8",
  expense: "#B3402E",
  expenseSurface: "#F5E7E4",
  accent: "#1E6F4E",
  accentSurface: "#E3EEE8",
  warning: "#B8761C",
  focus: "#2E5BD8",
  error: "#B02A20",
} as const

export const darkColors = {
  canvas: "#16181A",
  surface: "#1F2226",
  surfaceMuted: "#262A2F",
  surfaceElevated: "#23272C",
  textPrimary: "#F2F4F3",
  textSecondary: "#C3C9CD",
  textTertiary: "#8E969C",
  border: "#31363B",
  borderStrong: "#43494F",
  action: "#F2F4F3",
  actionPressed: "#FFFFFF",
  income: "#7FC19B",
  incomeSurface: "#1F3228",
  expense: "#E6917C",
  expenseSurface: "#392522",
  accent: "#7FC19B",
  accentSurface: "#1F3228",
  warning: "#D8A257",
  focus: "#8FA8FF",
  error: "#FF9C94",
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
  md: 10,
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
    boxShadow: "0 1px 2px rgba(29, 34, 40, 0.04), 0 4px 12px rgba(29, 34, 40, 0.06)",
    elevation: 2,
  },
  elevated: {
    boxShadow: "0 2px 4px rgba(29, 34, 40, 0.05), 0 10px 28px rgba(29, 34, 40, 0.10)",
    elevation: 4,
  },
} as const

export const motion = {
  micro: 150,
  standard: 250,
  emphasis: 400,
} as const

export type SemanticTone = "income" | "expense" | "neutral"
