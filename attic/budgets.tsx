import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { HeroCard } from "../src/components/HeroCard"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useBudgets } from "../src/features/budgets/BudgetsProvider"
import { useDailyBudget } from "../src/features/budgets/useDailyBudget"
import { useTransactions } from "../src/features/transactions/TransactionsProvider"
import { EXPENSE_CATEGORY_OPTIONS } from "../src/features/transactions/types"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { formatCurrency } from "../src/utils/currency"
import { toMonthKey } from "../src/utils/dates"

export default function BudgetsScreen(): React.ReactElement {
  const { budgets, isLoading, loadError, retryLoad, saveBudgets } = useBudgets()
  const { transactions } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  const currentMonth = toMonthKey(new Date())
  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const transaction of transactions) {
      if (transaction.type === "expense" && toMonthKey(new Date(transaction.date)) === currentMonth) {
        map[transaction.category] = (map[transaction.category] ?? 0) + transaction.amount
      }
    }
    return map
  }, [currentMonth, transactions])

  const totalBudget = useMemo(() => Object.values(budgets).reduce((sum, amount) => sum + amount, 0), [budgets])
  const setCount = Object.keys(budgets).length
  const entries = useMemo(() => Object.entries(budgets), [budgets])
  const availableCategories = useMemo(() => EXPENSE_CATEGORY_OPTIONS.filter((option) => budgets[option.key] === undefined), [budgets])

  const { remaining: remainingBudget, daily: dailyBudget, daysLeft } = useDailyBudget()

  async function handleDelete(category: string): Promise<void> {
    const next = { ...budgets }
    delete next[category]
    await saveBudgets(next)
  }

  if (isLoading) {
    return (
      <ScreenShell withTabBar={false}>
        <BudgetsHeader colors={colors} styles={styles} />
        <EmptyState description="Menyiapkan anggaran bulanan." icon="tune-variant" title="Memuat anggaran..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell withTabBar={false}>
        <BudgetsHeader colors={colors} styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell withTabBar={false}>
      <BudgetsHeader colors={colors} styles={styles} />

      <HeroCard
        amount={formatCurrency(totalBudget)}
        eyebrow="ANGGARAN BULAN INI"
        footer={
          <>
            <Text style={styles.summaryCaption}>
              {setCount === 0
                ? "Tetapkan batas pengeluaran per kategori untuk mulai mengontrol anggaran."
                : `${setCount} dari ${EXPENSE_CATEGORY_OPTIONS.length} kategori punya batas bulanan.`}
            </Text>
            {setCount > 0 ? (
              <View style={styles.summaryStats}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Sisa bulan ini</Text>
                  <Text style={styles.statValue}>{formatCurrency(remainingBudget)}</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Sisa harian</Text>
                  <Text style={styles.statValue}>{formatCurrency(dailyBudget)}</Text>
                  <Text style={styles.statHint}>/hari · {daysLeft} hari</Text>
                </View>
              </View>
            ) : null}
          </>
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          description="Beri batas bulanan untuk kategori yang sering kamu pakai, lalu pantau sisa hariannya di sini."
          icon="tune-variant"
          title="Belum ada anggaran"
        />
      ) : (
        <View style={styles.list}>
          {entries.map(([category, budget]) => {
            const spent = spentByCategory[category] ?? 0
            const over = spent > budget
            const ratio = Math.min(spent / budget, 1)

            return (
              <View key={category} style={styles.budgetCard}>
                <View style={styles.cardTop}>
                  <CategoryIcon category={category} tone="expense" size={20} />
                  <Text style={styles.cardName}>{category}</Text>
                  <Pressable
                    accessibilityLabel={`Edit anggaran ${category}`}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => router.push({ pathname: "/budget-form", params: { category } })}
                    style={({ pressed, hovered }) => [styles.iconButton, hovered && styles.iconHovered, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons color={colors.textSecondary} name="pencil-outline" size={18} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Hapus anggaran ${category}`}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => void handleDelete(category)}
                    style={({ pressed, hovered }) => [styles.iconButton, hovered && styles.iconHovered, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons color={colors.textTertiary} name="trash-can-outline" size={18} />
                  </Pressable>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progress,
                      { backgroundColor: over ? colors.expense : colors.income, width: `${Math.max(Math.round(ratio * 100), spent > 0 ? 4 : 0)}%` },
                    ]}
                  />
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.cardAmount}>{formatCurrency(budget)}</Text>
                  <Text style={[styles.cardCaption, over && styles.cardCaptionOver]}>
                    {over ? `Terpakai ${formatCurrency(spent)} · melebihi ${formatCurrency(spent - budget)}` : `Terpakai ${formatCurrency(spent)}`}
                  </Text>
                </View>
              </View>
            )
          })}
        </View>
      )}

      {availableCategories.length > 0 ? (
        <PrimaryButton icon="plus" label="Tambah anggaran" onPress={() => router.push("/budget-form")} variant="secondary" />
      ) : null}
    </ScreenShell>
  )
}

type BudgetsStyles = ReturnType<typeof createStyles>

function BudgetsHeader({ colors, styles }: { readonly colors: ThemeColors; readonly styles: BudgetsStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.overline}>ANGGARAN BULANAN</Text>
        <Text style={styles.title}>Atur anggaran</Text>
      </View>
      <Pressable
        accessibilityLabel="Tutup atur anggaran"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed, hovered }) => [styles.closeButton, hovered && styles.iconHovered, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textSecondary} name="close" size={22} />
      </Pressable>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    budgetCard: {
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      gap: spacing.row,
      paddingVertical: spacing.lg,
    },
    cardBottom: {
      alignItems: "baseline",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "space-between",
    },
    cardCaption: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    cardCaptionOver: {
      color: colors.expense,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    cardAmount: {
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    cardName: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    cardTop: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
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
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    iconButton: {
      alignItems: "center",
      borderRadius: radii.sm,
      height: 36,
      justifyContent: "center",
      width: 32,
    },
    iconHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    list: {
      gap: 0,
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
    progress: {
      borderRadius: radii.pill,
      height: "100%",
      minWidth: 4,
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      height: 6,
      overflow: "hidden",
      width: "100%",
    },
    statChip: {
      flex: 1,
      gap: spacing.unit,
    },
    statHint: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: typography.bodyLarge.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    summaryCaption: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    summaryStats: {
      flexDirection: "row",
      gap: spacing.row,
      marginTop: spacing.lg,
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
