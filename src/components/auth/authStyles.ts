import { StyleSheet } from "react-native"

import { darkColors, fontFamilies, radii, spacing, stateTokens, typography, type ThemeColors } from "../../theme"
import { stateInteraction } from "../state/pressable"

// Token disalin dari layar Stitch "Masuk ke Akun - Saku" (brand 700 #006B50,
// surface #F8FAF9, border #E4EBE7, muted #64748B, dark #121826). Register
// memakai token yang sama persis agar parity terjaga.
export const AUTH_BRAND = "#006B50"
export const AUTH_BRAND_DARK = "#00543E"
export const AUTH_BRAND_TEXT = "#FFFFFF"
const AUTH_SURFACE = "#F8FAF9"
const AUTH_CARD = "#FFFFFF"
const AUTH_OUTLINE = "#E4EBE7"
const AUTH_MUTED = "#64748B"
const AUTH_DARK = "#121826"
const AUTH_BRAND_SOFT = "#ECFDF5"

export function isDarkTheme(colors: ThemeColors): boolean {
  return colors.canvas === darkColors.canvas
}

export type AuthStyles = ReturnType<typeof createAuthStyles>

export function createAuthStyles(colors: ThemeColors, isDark: boolean) {
  const inputBg = isDark ? colors.surface : AUTH_CARD
  const outline = isDark ? colors.border : AUTH_OUTLINE
  const textSecondaryColor = isDark ? colors.textSecondary : AUTH_MUTED
  const titleColor = isDark ? colors.textPrimary : AUTH_DARK

  return StyleSheet.create({
    focusRing: stateInteraction(colors).focusRing,
    ambientLeft: {
      backgroundColor: "#10B981",
      borderRadius: 160,
      bottom: -120,
      height: 320,
      left: -120,
      opacity: 0.06,
      position: "absolute",
      width: 320,
    },
    ambientRight: {
      backgroundColor: AUTH_BRAND,
      borderRadius: 160,
      height: 320,
      opacity: 0.08,
      position: "absolute",
      right: -120,
      top: -120,
      width: 320,
    },
    backButton: {
      alignItems: "center",
      backgroundColor: AUTH_CARD,
      borderColor: AUTH_OUTLINE,
      borderRadius: 999,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    biometricButton: {
      alignItems: "center",
      backgroundColor: AUTH_CARD,
      borderColor: outline,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      justifyContent: "center",
      minHeight: 56,
      paddingHorizontal: spacing.lg,
    },
    biometricText: {
      color: titleColor,
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    brandBadge: {
      borderRadius: 14,
      height: 56,
      marginBottom: spacing.row,
      width: 56,
    },
    brandBadgeLarge: {
      borderRadius: 16,
      height: 64,
      marginBottom: spacing.xs,
      width: 64,
    },
    checkHint: {
      alignItems: "center",
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: spacing.xs,
      paddingTop: 2,
    },
    checkHintText: {
      color: textSecondaryColor,
      fontFamily: fontFamilies.medium,
      fontSize: 11,
      fontWeight: "500",
      lineHeight: 16,
    },
    checkbox: {
      alignItems: "center",
      borderColor: AUTH_OUTLINE,
      borderRadius: 6,
      borderWidth: 1,
      height: 18,
      justifyContent: "center",
      width: 18,
    },
    checkboxChecked: {
      backgroundColor: AUTH_BRAND,
      borderColor: AUTH_BRAND,
    },
    content: {
      alignItems: "stretch",
      gap: spacing.group,
      paddingBottom: spacing["2xl"],
      paddingHorizontal: 28,
      paddingTop: spacing.group,
    },
    divider: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    dividerLine: {
      backgroundColor: "#E5E7EB",
      flex: 1,
      height: StyleSheet.hairlineWidth,
    },
    dividerText: {
      color: "#9CA3AF",
      fontFamily: fontFamilies.medium,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
    errorBanner: {
      alignItems: "center",
      backgroundColor: isDark ? colors.expenseSurface : "#FFEDEB",
      borderColor: isDark ? colors.expense : "#FFC7C1",
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.group,
    },
    errorBannerText: {
      color: colors.error,
      flex: 1,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    field: {
      gap: 6,
    },
    fieldError: {
      color: colors.error,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    flex: {
      flex: 1,
    },
    footer: {
      alignItems: "center",
      gap: spacing.group,
      marginTop: spacing.sm,
    },
    footerLink: {
      color: AUTH_BRAND,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    footerText: {
      color: textSecondaryColor,
      fontFamily: typography.body.fontFamily,
      fontSize: 13.5,
      fontWeight: typography.body.fontWeight,
      lineHeight: 20,
      textAlign: "center",
    },
    forgotRow: {
      alignItems: "flex-end",
      paddingTop: spacing.xs,
    },
    forgotText: {
      color: AUTH_BRAND,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 18,
    },
    form: {
      gap: spacing.group,
    },
    header: {
      alignItems: "center",
      marginBottom: spacing.sm,
      marginTop: spacing.row,
    },
    registerHeader: {
      alignItems: "center",
      marginBottom: spacing.sm,
      marginTop: -8,
    },
    registerBrand: {
      borderRadius: 14,
      height: 56,
      marginBottom: spacing.xs,
      width: 56,
    },
    registerButton: {
      alignItems: "center",
      backgroundColor: AUTH_BRAND,
      borderRadius: radii.lg,
      elevation: 6,
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 48,
      shadowColor: AUTH_BRAND,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    registerContent: {
      alignItems: "stretch",
      gap: spacing.row,
      paddingBottom: spacing.group,
      paddingHorizontal: 28,
      paddingTop: spacing.sm,
    },
    registerFooter: {
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    registerForm: {
      gap: spacing.row,
    },
    registerInput: {
      color: titleColor,
      flex: 1,
      fontFamily: fontFamilies.medium,
      fontSize: 14,
      fontWeight: "500",
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: 0,
    },
    registerInputShell: {
      alignItems: "center",
      backgroundColor: inputBg,
      borderColor: outline,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.lg,
    },
    registerSubtitle: {
      color: textSecondaryColor,
      fontFamily: typography.bodyLarge.fontFamily,
      fontSize: 12,
      fontWeight: typography.bodyLarge.fontWeight,
      lineHeight: 18,
      marginTop: spacing.xs,
      maxWidth: 280,
      textAlign: "center",
    },
    registerTitle: {
      color: titleColor,
      fontFamily: fontFamilies.bold,
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.2,
      lineHeight: 26,
      marginTop: spacing.sm,
      textAlign: "center",
    },
    helpText: {
      color: textSecondaryColor,
      fontFamily: fontFamilies.semibold,
      fontSize: 12,
      fontWeight: "600",
    },
    input: {
      color: titleColor,
      flex: 1,
      fontFamily: fontFamilies.medium,
      fontSize: 14.5,
      fontWeight: "500",
      minHeight: 54,
      paddingHorizontal: spacing.sm,
      paddingVertical: 0,
    },
    inputShell: {
      alignItems: "center",
      backgroundColor: inputBg,
      borderColor: outline,
      borderRadius: radii.lg,
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
      borderColor: colors.focus,
      borderWidth: 1,
    },
    label: {
      color: titleColor,
      fontFamily: fontFamilies.semibold,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    pill: {
      alignItems: "center",
      backgroundColor: AUTH_BRAND_SOFT,
      borderColor: "#A7F3D0",
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 2,
    },
    pillDot: {
      backgroundColor: AUTH_BRAND,
      borderRadius: 3,
      height: 6,
      width: 6,
    },
    pillText: {
      color: AUTH_BRAND,
      fontFamily: fontFamilies.bold,
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 16,
    },
    pressed: {
      opacity: 0.72,
    },
    primaryButton: {
      alignItems: "center",
      backgroundColor: AUTH_BRAND,
      borderRadius: radii.lg,
      elevation: 6,
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 56,
      shadowColor: AUTH_BRAND,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    primaryButtonDisabled: {
      opacity: stateTokens.disabledOpacity,
    },
    primaryButtonText: {
      color: AUTH_BRAND_TEXT,
      fontFamily: fontFamilies.semibold,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 22,
    },
    root: {
      backgroundColor: isDark ? colors.canvas : AUTH_SURFACE,
      flex: 1,
      overflow: "hidden",
    },
    securityBadge: {
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.7)",
      borderColor: "#D1FAE5",
      borderRadius: 999,
      borderWidth: 1,
      flexDirection: "row",
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    securityText: {
      color: textSecondaryColor,
      fontFamily: fontFamilies.medium,
      fontSize: 11,
      fontWeight: "500",
      lineHeight: 16,
    },
    subtitle: {
      color: textSecondaryColor,
      fontFamily: typography.bodyLarge.fontFamily,
      fontSize: 13.5,
      fontWeight: typography.bodyLarge.fontWeight,
      lineHeight: 20,
      marginTop: spacing.xs,
      maxWidth: 280,
      textAlign: "center",
    },
    termsRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    termsText: {
      color: textSecondaryColor,
      flex: 1,
      fontFamily: typography.caption.fontFamily,
      fontSize: 12,
      fontWeight: typography.caption.fontWeight,
      lineHeight: 18,
    },
    termsLink: {
      color: AUTH_BRAND,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
    },
    title: {
      color: titleColor,
      fontFamily: fontFamilies.bold,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.3,
      lineHeight: 30,
      marginTop: spacing.row,
      textAlign: "center",
    },
    topBar: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
  })
}
