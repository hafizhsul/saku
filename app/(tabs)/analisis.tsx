import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, type ComponentProps } from "react"
import { Image, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import {
  selectBalance,
  selectCategoryBreakdown,
  selectMonthlySummary,
} from "../../src/features/transactions/selectors"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCompactCurrency, formatCurrency } from "../../src/utils/currency"
import { shiftMonth, toMonthKey } from "../../src/utils/dates"

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"]

// Warna hero memakai token M3 dari referensi desain (primary/tertiary-container)
// yang memang selalu gelap emerald di semua mode. ponytail: pindah ke token
// tema kalau palet hero perlu ikut dark mode.
const HERO = {
  background: "#003527",
  text: "#FFFFFF",
  label: "#95d3ba",
  chipBackground: "#004f34",
  chipText: "#31c98f",
} as const

// Abreviasi hari Indonesia, berindeks sama seperti Date.getDay() (0 = Minggu).
const DAY_LABELS = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"] as const

type DayBucket = {
  readonly key: string
  readonly label: string
  readonly amount: number
  readonly isToday: boolean
  readonly isSaturday: boolean
}

function last7DayBuckets(transactions: readonly { readonly type: string; readonly amount: number; readonly date: string }[]): readonly DayBucket[] {
  const today = new Date()
  const buckets: DayBucket[] = []

  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    const amount = transactions
      .filter((transaction) => transaction.type === "expense" && transaction.date.slice(0, 10) === key)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    buckets.push({
      key,
      label: DAY_LABELS[day.getDay()],
      amount,
      isToday: offset === 0,
      isSaturday: day.getDay() === 6,
    })
  }

  return buckets
}

export default function AnalisisScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const { budgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())

  const balance = selectBalance(transactions)
  const breakdown = selectCategoryBreakdown(transactions, currentMonth, budgets)
  const weekDays = useMemo(() => last7DayBuckets(transactions), [transactions])
  const weekTotal = weekDays.reduce((sum, day) => sum + day.amount, 0)

  const net = selectMonthlySummary(transactions, currentMonth).net
  const previousNet = selectMonthlySummary(transactions, shiftMonth(currentMonth, -1)).net
  const monthChangePercent =
    previousNet === 0 ? undefined : Math.round(((net - previousNet) / Math.abs(previousNet)) * 100)

  if (isLoading) {
    return (
      <ScreenShell>
        <Header />
        <EmptyState description="Menyiapkan ringkasan keuanganmu." title="Memuat catatan..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell>
        <Header />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <Header />

      {/* Total Saldo */}
      <View style={styles.balanceCard}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <Text style={styles.balanceLabel}>Total Saldo Tergabung</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
        <View style={styles.balanceMeta}>
          {monthChangePercent !== undefined ? (
            <View style={styles.changeChip}>
              <MaterialCommunityIcons
                color={HERO.chipText}
                name={monthChangePercent >= 0 ? "trending-up" : "trending-down"}
                size={14}
              />
              <Text style={styles.changeChipText}>
                {monthChangePercent >= 0 ? "+" : ""}
                {monthChangePercent}%
              </Text>
            </View>
          ) : null}
          <Text style={styles.balanceMetaText}>Bulan ini</Text>
        </View>
      </View>

      {transactions.length === 0 ? (
        <EmptyState
          actionLabel="Catat transaksi"
          description="Tambah pemasukan atau pengeluaran untuk melihat analisis."
          icon="chart-line"
          onAction={() => router.push("/add-transaction")}
          title="Belum ada data"
        />
      ) : (
        <>
          {/* Tren Pengeluaran */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Tren Pengeluaran</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>7 Hari</Text>
              </View>
            </View>
            <View style={styles.whiteCard}>
              <View style={styles.weekTotalBlock}>
                <Text style={styles.labelMuted}>Total Minggu Ini</Text>
                <Text style={styles.weekTotal}>{formatCurrency(weekTotal)}</Text>
              </View>
              <View style={styles.chart}>
                <View style={styles.chartBarsArea}>
                  {[0.2, 0.5, 0.8].map((ratio) => (
                    <View
                      key={ratio}
                      style={[styles.gridLine, { top: 96 * ratio }]}
                    />
                  ))}
                  <View style={styles.chartBarsRow}>
                    {weekDays.map((day) => {
                      const maxAmount = Math.max(...weekDays.map((item) => item.amount), 1)
                      const height = day.amount === 0 ? 0 : Math.max(4, Math.round((day.amount / maxAmount) * 96))
                      const barColor = day.isToday
                        ? colors.income
                        : day.isSaturday
                          ? colors.expense
                          : colors.surfaceMuted
                      return (
                        <View key={day.key} style={styles.chartBarColumn}>
                          <View style={[styles.chartBar, { backgroundColor: barColor, height }]} />
                        </View>
                      )
                    })}
                  </View>
                </View>
                <View style={styles.chartLabelsRow}>
                  {weekDays.map((day) => (
                    <Text
                      key={day.key}
                      style={[
                        styles.chartLabel,
                        day.isToday && styles.chartLabelToday,
                        day.isSaturday && styles.chartLabelSaturday,
                      ]}
                    >
                      {day.label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Kategori Alokasi */}
          {breakdown.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategori Alokasi</Text>
              {breakdown.map((item, index) => (
                <CategoryRow colors={colors} index={index} item={item} key={item.category} styles={styles} />
              ))}
            </View>
          ) : null}

          {/* Saku Insight */}
          <View style={styles.insightCard}>
            <View style={styles.insightIcon}>
              <MaterialCommunityIcons color={colors.surface} name="lightbulb-on-outline" size={18} />
            </View>
            <View style={styles.insightBody}>
              <Text style={styles.insightTitle}>Saku Insight</Text>
              <Text style={styles.insightText}>
                {breakdown.length === 0
                  ? "Belum ada pengeluaran tercatat bulan ini. Tambahkan transaksi untuk melihat pola keuanganmu."
                  : `Pengeluaran terbesar bulan ini ada di "${breakdown[0]?.category}" sebesar ${formatCompactCurrency(breakdown[0]?.amount ?? 0)}. Tinjau kembali budgetmu agar target tetap tercapai.`}
              </Text>
            </View>
          </View>
        </>
      )}
    </ScreenShell>
  )
}

type AnalisisStyles = ReturnType<typeof createStyles>

// Header mengikuti pola tab Beranda/Riwayat: ikon brand + judul + tombol profil.
function Header(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../assets/images/screen.png")}
          style={styles.brandIcon}
        />
        <Text style={styles.headerTitle}>Analisis</Text>
      </View>
      <MaterialCommunityIcons color={colors.textSecondary} name="account-circle-outline" size={32} />
    </View>
  )
}

type CategoryRowProps = {
  readonly colors: ThemeColors
  readonly index: number
  readonly item: { readonly category: string; readonly percentage: number }
  readonly styles: AnalisisStyles
}

function CategoryRow({ colors, index, item, styles }: CategoryRowProps): React.ReactElement {
  const palette = [
    { well: colors.accentSurface, icon: colors.income, fill: colors.income },
    { well: colors.income, icon: colors.surface, fill: colors.income },
    { well: colors.expenseSurface, icon: colors.expense, fill: colors.expense },
  ][index % 3]

  return (
    <View style={styles.rowCard}>
      <View style={[styles.rowWell, { backgroundColor: palette.well }]}>
        <MaterialCommunityIcons color={palette.icon} name={getCategoryIconName(item.category)} size={20} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text numberOfLines={1} style={styles.rowName}>
            {item.category}
          </Text>
          <Text style={styles.rowPercent}>{item.percentage}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: palette.fill, width: `${Math.min(item.percentage, 100)}%` }]} />
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    balanceAmount: {
      color: HERO.text,
      fontFamily: fontFamilies.bold,
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
      marginTop: spacing.xs,
    },
    balanceCard: {
      backgroundColor: HERO.background,
      borderRadius: radii.lg,
      overflow: "hidden",
      padding: spacing.lg,
      ...shadows.elevated,
    },
    balanceLabel: {
      color: HERO.label,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
      textTransform: "uppercase",
    },
    balanceMeta: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    balanceMetaText: {
      color: HERO.label,
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    brandIcon: {
      borderRadius: radii.sm,
      height: 36,
      width: 36,
    },
    changeChip: {
      alignItems: "center",
      backgroundColor: HERO.chipBackground,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    changeChipText: {
      color: HERO.chipText,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    chart: {
      marginTop: spacing.md,
    },
    chartBar: {
      borderRadius: radii.sm,
      width: 20,
    },
    chartBarColumn: {
      alignItems: "center",
      flex: 1,
    },
    chartBarsArea: {
      height: 96,
      justifyContent: "flex-end",
      position: "relative",
    },
    chartBarsRow: {
      alignItems: "flex-end",
      flexDirection: "row",
      justifyContent: "space-between",
      height: 96,
    },
    chartLabel: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      textAlign: "center",
    },
    chartLabelSaturday: {
      color: colors.expense,
    },
    chartLabelToday: {
      color: colors.income,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    chartLabelsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    chip: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    chipText: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    glowBottom: {
      backgroundColor: "#004f34",
      borderRadius: 100,
      bottom: -40,
      height: 96,
      left: -40,
      opacity: 0.35,
      position: "absolute",
      width: 96,
    },
    glowTop: {
      backgroundColor: "#064e3b",
      borderRadius: 100,
      height: 128,
      opacity: 0.5,
      position: "absolute",
      right: -32,
      top: -48,
      width: 128,
    },
    gridLine: {
      borderColor: colors.border,
      borderStyle: "dashed",
      borderTopWidth: 1,
      left: 0,
      position: "absolute",
      right: 0,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingBottom: spacing.compact,
    },
    headerLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
    },
    insightBody: {
      flex: 1,
      gap: spacing.unit,
      paddingTop: spacing.xs,
    },
    insightCard: {
      alignItems: "flex-start",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
    },
    insightIcon: {
      alignItems: "center",
      backgroundColor: colors.warning,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    insightText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: 20,
    },
    insightTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    labelMuted: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    progressFill: {
      borderRadius: radii.pill,
      height: "100%",
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      height: 6,
      marginTop: spacing.sm,
      overflow: "hidden",
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    rowCard: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
      ...shadows.card,
    },
    rowName: {
      color: colors.textPrimary,
      flex: 1,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    rowPercent: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    rowTopLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    rowWell: {
      alignItems: "center",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    section: {
      gap: spacing.md,
    },
    sectionHeaderRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    weekTotal: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
      marginTop: spacing.xs,
    },
    weekTotalBlock: {
      marginBottom: spacing.xs,
    },
    whiteCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.group,
      ...shadows.card,
    },
  })
}