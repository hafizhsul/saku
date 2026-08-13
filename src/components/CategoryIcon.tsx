import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { ComponentProps } from "react"
import { useMemo } from "react"
import { StyleSheet, View } from "react-native"

import { EXPENSE_CATEGORY_OPTIONS, INCOME_CATEGORY_OPTIONS, type CategoryOption } from "../features/transactions/types"
import { radii, useThemeColors, type SemanticTone, type ThemeColors } from "../theme"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

const categoryIcons = {
  Gaji: "cash-multiple",
  Bonus: "gift-outline",
  Freelance: "laptop",
  Bisnis: "store-outline",
  Investasi: "chart-line",
  "Makan & Minum": "silverware-fork-knife",
  Transportasi: "bus",
  Kebutuhan: "shopping-outline",
  "Tempat Tinggal": "home-outline",
  Hiburan: "movie-open-outline",
  Kesehatan: "heart-pulse",
  Lainnya: "dots-horizontal",
} satisfies Record<CategoryOption["key"], IconName>

export function getCategoryIconName(category: string): IconName {
  const option = [...INCOME_CATEGORY_OPTIONS, ...EXPENSE_CATEGORY_OPTIONS].find((item) => item.key === category)
  return option === undefined ? categoryIcons.Lainnya : categoryIcons[option.key]
}

type CategoryIconProps = {
  readonly category: string
  readonly tone?: SemanticTone
  readonly size?: number
}

export function CategoryIcon({ category, tone = "neutral", size = 20 }: CategoryIconProps): React.ReactElement {
  const colors = useThemeColors()
  const config = toneConfig(colors)[tone]
  const styles = useMemo(() => createStyles(), [])

  return (
    <View
      accessible={false}
      style={[styles.well, { backgroundColor: config.backgroundColor, width: size + 20, height: size + 20 }]}
    >
      <MaterialCommunityIcons name={getCategoryIconName(category)} size={size} color={config.iconColor} />
    </View>
  )
}

function toneConfig(colors: ThemeColors): Record<SemanticTone, { readonly backgroundColor: string; readonly iconColor: string }> {
  return {
    income: { backgroundColor: colors.incomeSurface, iconColor: colors.income },
    expense: { backgroundColor: colors.expenseSurface, iconColor: colors.expense },
    neutral: { backgroundColor: colors.surfaceMuted, iconColor: colors.textSecondary },
  }
}

function createStyles() {
  return StyleSheet.create({
    well: {
      alignItems: "center",
      borderRadius: radii.md,
      justifyContent: "center",
    },
  })
}
