import { StyleSheet } from "react-native"

import { darkColors, fontFamilies, radii, spacing, typography, type ThemeColors } from "../../theme"

// Gaya bersama layar autentikasi (login & register) mengikuti referensi
// desain Stitch; tema gelap memakai surface app untuk isian form.
// ponytail: pindah ke token tema kalau palet hijau ini diadopsi ke semua layar.
export const AUTH_BRAND = "#064E3B" // primary-container: tombol, link, ring fokus
export const AUTH_BRAND_TEXT = "#FFFFFF"
const AUTH_OUTLINE = "#BFC9C3" // border input (light mode)

export function isDarkTheme(colors: ThemeColors): boolean {
  return colors.canvas === darkColors.canvas
}

export type AuthStyles = ReturnType<typeof createAuthStyles>

export function createAuthStyles(colors: ThemeColors, isDark: boolean) {
  const inputBg = isDark ? colors.surface : "#FFFFFF" // surface-container-lowest terang
  const outline = isDark ? colors.border : AUTH_OUTLINE
  const textSecondaryColor = isDark ? colors.textSecondary : "#404944" // on-surface-variant

  return StyleSheet.create({
    biometricButton: {
      alignItems: "center",
      borderColor: outline,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      justifyContent: "center",
      minHeight: 56,
    },
    biometricText: {
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    content: {
      alignItems: "stretch",
      gap: spacing.group,
      paddingBottom: spacing["3xl"],
      paddingHorizontal: 24,
      paddingTop: spacing["5xl"],
    },
    divider: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    dividerLine: {
      backgroundColor: outline,
      flex: 1,
      height: StyleSheet.hairlineWidth,
    },
    dividerText: {
      color: textSecondaryColor,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    errorBanner: {
      alignItems: "center",
      backgroundColor: isDark ? colors.expenseSurface : "#FFEDEB",
      borderColor: isDark ? colors.expense : "#FFC7C1",
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.group,
    },
    errorBannerText: {
      color: colors.error,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    field: {
      gap: spacing.compact,
    },
    fieldError: {
      color: colors.error,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    flex: {
      flex: 1,
    },
    footer: {
      alignItems: "center",
      marginTop: spacing.sm,
    },
    footerLink: {
      color: AUTH_BRAND,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    footerText: {
      color: textSecondaryColor,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    forgotRow: {
      alignItems: "flex-end",
    },
    forgotText: {
      color: AUTH_BRAND,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    header: {
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.group,
    },
    input: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: typography.bodyLarge.fontFamily,
      minHeight: 54,
      paddingHorizontal: spacing.sm,
      paddingVertical: 0,
    },
    inputShell: {
      alignItems: "center",
      backgroundColor: inputBg,
      borderColor: outline,
      borderRadius: radii.xl,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.lg,
    },
    inputShellError: {
      borderColor: colors.error,
      borderWidth: 2,
    },
    inputShellFocused: {
      borderColor: AUTH_BRAND,
      borderWidth: 2,
    },
    label: {
      color: textSecondaryColor,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      paddingLeft: spacing.xs,
    },
    pressed: {
      opacity: 0.72,
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: AUTH_BRAND,
      borderRadius: radii.xl,
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 56,
      shadowColor: AUTH_BRAND,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
    primaryButtonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: AUTH_BRAND_TEXT,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    root: {
      backgroundColor: colors.canvas,
      flex: 1,
    },
    subtitle: {
      color: textSecondaryColor,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: typography.bodyLarge.fontFamily,
      fontWeight: typography.bodyLarge.fontWeight,
      lineHeight: typography.bodyLarge.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 22,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    watermark: {
      alignItems: "center",
      bottom: 0,
      justifyContent: "center",
      left: 0,
      opacity: 0.06,
      position: "absolute",
      right: 0,
      top: 0,
    },
    watermarkImage: {
      height: 360,
      transform: [{ rotate: "12deg" }],
      width: 360,
    },
  })
}