import { StyleSheet } from "react-native"

import { fontFamilies, radii, spacing, typography, type ThemeColors } from "../../theme"

export function createAddTransactionStyles(colors: ThemeColors) {
  return StyleSheet.create({
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.compact,
    },
    categoryLabel: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      textAlign: "center",
    },
    categoryOption: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      gap: spacing.unit,
      justifyContent: "center",
      minHeight: 86,
      padding: spacing.sm,
      width: "48%",
    },
    categorySelected: {
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.borderStrong,
    },
    categorySelectedLabel: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    closeButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    content: {
      paddingBottom: spacing["3xl"],
    },
    dateText: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    dateTrigger: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      flexDirection: "row",
      minHeight: 52,
      paddingHorizontal: spacing.md,
    },
    generalError: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.md,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    keyboard: {
      flex: 1,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: typography.bodyLarge.fontFamily,
      minHeight: 52,
      paddingHorizontal: spacing.md,
    },
    inputError: {
      borderColor: colors.error,
    },
    noteInput: {
      minHeight: 96,
      paddingTop: spacing.md,
    },
    overline: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginTop: spacing.xs,
    },
  })
}
