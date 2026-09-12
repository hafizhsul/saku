import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { AlokasiSheet } from "../../src/components/AlokasiSheet"
import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { DataState } from "../../src/components/state/DataState"
import { PartialState } from "../../src/components/state/PartialState"
import { AnalysisSkeleton } from "../../src/components/state/skeletons/AnalysisSkeleton"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import { selectBalance, selectMonthlySummary } from "../../src/features/transactions/selectors"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCompactCurrency, formatCurrency } from "../../src/utils/currency"
import { shiftMonth, toMonthKey } from "../../src/utils/dates"

// Abreviasi hari Indonesia, berindeks sama seperti Date.getDay() (0 = Minggu).
const DAY_LABELS = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"] as const

type TrendPeriod = 7 | 30 | 90

const PLOT_HEIGHT = 96
const TAG_ZONE = 20
const TAG_GAP = 4
const CHART_TOP = TAG_ZONE + TAG_GAP
const AXIS_WIDTH = 56

// Label sumbu/tooltip gaya referensi: ringkas tanpa "Rp " dan tanpa spasi
// ("300rb") supaya muat satu baris di kolom sempit.
function axisLabel(amount: number): string {
  return formatCompactCurrency(amount).replace("Rp ", "").replace(" ", "")
}

const PERIOD_OPTIONS: readonly { readonly value: TrendPeriod; readonly label: string }[] = [
  { value: 7, label: "7 Hari" },
  { value: 30, label: "30 Hari" },
  { value: 90, label: "3 Bulan" },
]

type DayBucket = {
  readonly key: string
  readonly label: string
  readonly amount: number
  readonly isToday: boolean
  readonly isSaturday: boolean
}

function trendBuckets(
  transactions: readonly { readonly type: string; readonly amount: number; readonly date: string }[],
  days: TrendPeriod,
): readonly DayBucket[] {
  const today = new Date()
  const buckets: DayBucket[] = []
  const stride = days === 30 ? 5 : 14

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset)
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
    const amount = transactions
      .filter((transaction) => transaction.type === "expense" && transaction.date.slice(0, 10) === key)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
    buckets.push({
      key,
      // 7 hari: label nama hari seperti referensi; rentang panjang:
      // tanggal ber-stride supaya sumbu tidak sesak.
      label: days === 7 ? DAY_LABELS[day.getDay()] : (days - 1 - offset) % stride === 0 ? String(day.getDate()) : "",
      amount,
      isToday: offset === 0,
      isSaturday: day.getDay() === 6,
    })
  }

  return buckets
}

export default function AnalisisScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const { budgets, loadError: budgetsError, retryLoad: retryBudgetsLoad, saveBudgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())
  const [period, setPeriod] = useState<TrendPeriod>(7)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [balanceVisible, setBalanceVisible] = useState(true)

  const balance = selectBalance(transactions)
  const monthSummary = selectMonthlySummary(transactions, currentMonth)
  const days = useMemo(() => trendBuckets(transactions, period), [period, transactions])
  const daysTotal = days.reduce((sum, day) => sum + day.amount, 0)
  const daysAverage = Math.round(daysTotal / period)

  // Skala chart dari data nyata: benchmark hijau = rata-rata harian
  // referensi; zona atas TAG_ZONE dicadangkan untuk tooltip puncak supaya
  // tidak menutupi badge rata-rata.
  const maxAmount = Math.max(1, ...days.map((day) => day.amount))
  const barZone = PLOT_HEIGHT - CHART_TOP
  const scaleMax = maxAmount * (PLOT_HEIGHT / barZone)
  const benchmarkPerDay = daysAverage
  const benchmarkTop = CHART_TOP + Math.min(barZone, Math.max(0, barZone - (benchmarkPerDay / scaleMax) * PLOT_HEIGHT))
  const axisStep = maxAmount / 2

  const previousNet = selectMonthlySummary(transactions, shiftMonth(currentMonth, -1)).net
  const monthChangePercent =
    previousNet === 0 ? undefined : Math.round(((monthSummary.net - previousNet) / Math.abs(previousNet)) * 100)

  // Distribusi budget nyata: kategori dengan alokasi > 0 + pemakaian bulan ini.
  const totalBudget = Object.values(budgets).reduce((sum, value) => sum + value, 0)
  const allocationList = Object.entries(budgets)
    .filter(([, budget]) => budget > 0)
    .map(([category, budget]) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" && transaction.category === category && transaction.date.slice(0, 7) === currentMonth,
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0)
      const percent = Math.min(100, Math.round((spent / budget) * 100))
      const status = percent >= 90 ? "Melebihi Limit" : percent >= 70 ? "Mendekati Limit" : "Aman"
      return { budget, category, percent, rest: Math.max(0, budget - spent), spent, status }
    })
    .sort((left, right) => right.percent - left.percent)
  const totalSpent = allocationList.reduce((sum, row) => sum + Math.min(row.spent, row.budget), 0)
  const usedPercent = totalBudget === 0 ? 0 : Math.round((totalSpent / totalBudget) * 100)
  const allocationRows = { rows: allocationList, totalBudget, totalSpent, usedPercent }

  const nearLimit = allocationRows.rows.find((row) => row.percent >= 70)

  async function handleSaveBudgets(next: Record<string, number>): Promise<void> {
    setSaveBusy(true)
    setSaveError(null)
    const result = await saveBudgets(next)
    setSaveBusy(false)
    if (!result.ok) {
      setSaveError(result.message)
      return
    }
    setSheetVisible(false)
  }

  return (
    <ScreenShell>
      <DataState
        emptyFallback={
          transactions.length === 0 ? (
            <EmptyState
              actionLabel="Catat transaksi"
              description="Tambah pemasukan atau pengeluaran untuk melihat analisis."
              icon="chart-line"
              onAction={() => router.push("/add-transaction")}
              title="Belum ada data"
            />
          ) : null
        }
        error={loadError}
        isEmpty={transactions.length === 0}
        loading={isLoading}
        loadingFallback={<AnalysisSkeleton />}
        onRetry={() => void retryLoad()}
        partial={null}
      >
      {/* Total Saldo */}
      <View style={styles.balanceCard}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        <View style={styles.balanceTopRow}>
          <Text style={styles.balanceLabel}>Total Saldo Tergabung</Text>
          <Pressable
            accessibilityLabel={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
            accessibilityRole="button"
            onPress={() => setBalanceVisible((visible) => !visible)}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.heroMuted} name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={18} />
          </Pressable>
        </View>
        <Text style={styles.balanceAmount}>{balanceVisible ? formatCurrency(balance) : "Rp ••••••"}</Text>
        <View style={styles.balanceMeta}>
          <View style={styles.monthPill}>
            <MaterialCommunityIcons color={colors.heroChipText} name="calendar-today" size={14} />
            <Text style={styles.monthPillText}>Bulan ini</Text>
          </View>
          {monthChangePercent !== undefined ? (
            <View style={styles.changeChip}>
              <MaterialCommunityIcons
                color={colors.heroChipText}
                name={monthChangePercent >= 0 ? "trending-up" : "trending-down"}
                size={14}
              />
              <Text style={styles.changeChipText}>
                {monthChangePercent >= 0 ? "+" : ""}
                {monthChangePercent}% ({monthChangePercent >= 0 ? "+" : "-"}Rp{formatCompactCurrency(Math.abs(monthSummary.net - previousNet))}{" "}
                vs bln lalu)
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroFlow}>
          <View style={styles.heroFlowItem}>
            <View style={styles.heroFlowIcon}>
              <MaterialCommunityIcons color={colors.heroChipText} name="arrow-down" size={14} />
            </View>
            <View>
              <Text style={styles.heroFlowLabel}>Pemasukan</Text>
              <Text style={styles.heroFlowValue}>+{formatCurrency(monthSummary.income)}</Text>
            </View>
          </View>
          <View style={styles.heroFlowDivider} />
          <View style={styles.heroFlowItem}>
            <View style={styles.heroFlowIcon}>
              <MaterialCommunityIcons color={colors.heroChipText} name="arrow-up" size={14} />
            </View>
            <View>
              <Text style={styles.heroFlowLabel}>Pengeluaran</Text>
              <Text style={styles.heroFlowValue}>-{formatCurrency(monthSummary.expense)}</Text>
            </View>
          </View>
        </View>
      </View>

          {/* Tren Pengeluaran */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.trendTitleBlock}>
                <View style={styles.sectionIcon}>
                  <MaterialCommunityIcons color={colors.accent} name="chart-line" size={18} />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Tren Pengeluaran</Text>
                  <Text style={styles.sectionSubtitle}>Analisis harian vs target batas</Text>
                </View>
              </View>
              <View style={styles.periodRow}>
                {PERIOD_OPTIONS.map((option) => {
                  const active = period === option.value
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      key={option.value}
                      onPress={() => setPeriod(option.value)}
                      style={({ pressed }) => [styles.periodTab, active && styles.periodTabActive, pressed && styles.pressed]}
                    >
                      <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>{option.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <View style={styles.whiteCard}>
              <View style={styles.trendSummary}>
                <View>
                  <Text style={styles.labelMuted}>
                    {period === 7 ? "Total 7 Hari Terakhir" : period === 30 ? "Total 30 Hari Terakhir" : "Total 3 Bulan Terakhir"}
                  </Text>
                  <Text style={[styles.trendTotal, daysTotal === 0 && { color: colors.textPrimary }]}>{formatCurrency(daysTotal)}</Text>
                </View>
                <View style={styles.averageBadge}>
                  <View style={styles.averageDash} />
                  <Text style={styles.averageText}>
                    Rata-rata: <Text style={styles.averageStrong}>{formatCompactCurrency(daysAverage)}/hari</Text>
                  </Text>
                </View>
              </View>
              {daysTotal === 0 ? (
                <Text style={styles.chartEmpty}>Belum ada pengeluaran {period} hari terakhir. Chart terisi setelah kamu mencatat.</Text>
              ) : (
                <View style={styles.chart}>
                  <View style={styles.chartWithAxis}>
                    <View style={styles.yAxis}>
                      <Text numberOfLines={1} style={styles.yLabel}>
                        {axisLabel(maxAmount)}
                      </Text>
                      <Text numberOfLines={1} style={styles.yLabel}>
                        {axisLabel(axisStep)}
                      </Text>
                      <Text numberOfLines={1} style={styles.yLabel}>
                        0
                      </Text>
                    </View>
                    <View style={styles.chartBarsArea}>
                      <View style={[styles.benchmarkLine, { top: benchmarkTop }]} />
                      <View style={[styles.benchmarkTag, { top: Math.min(PLOT_HEIGHT - 18, Math.max(0, benchmarkTop - 9)) }]}>
                        <Text style={styles.benchmarkTagText}>Batas: {formatCompactCurrency(benchmarkPerDay)}/hr</Text>
                      </View>
                      {[0.25, 0.5, 0.75].map((ratio) => (
                        <View key={ratio} style={[styles.gridLine, { top: PLOT_HEIGHT * ratio }]} />
                      ))}
                      <View style={styles.chartBarsRow}>
                        {days.map((day) => {
                          const height = day.amount === 0 ? 0 : Math.max(4, Math.round((day.amount / scaleMax) * PLOT_HEIGHT))
                          const barColor = day.isToday ? colors.chartToday : day.isSaturday ? colors.chartSaturday : colors.chartBar
                          const peak = day.amount === maxAmount && maxAmount > 0
                          return (
                            <View key={day.key} style={styles.chartBarColumn}>
                              <View style={styles.peakSlot}>
                                {peak ? (
                                  <View style={styles.peakTag}>
                                    <Text style={styles.peakTagText}>{axisLabel(day.amount)}</Text>
                                  </View>
                                ) : null}
                              </View>
                              <View style={[styles.chartBar, { backgroundColor: barColor, height }]} />
                            </View>
                          )
                        })}
                      </View>
                    </View>
                  </View>
                  <View style={styles.chartLabelsRow}>
                    {days.map((day) => (
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
                  <View style={styles.chartLegend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.chartToday }]} />
                      <Text style={styles.legendText}>Hari Aktif (Puncak)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: colors.chartBar }]} />
                      <Text style={styles.legendText}>Di Bawah Target Rata-rata</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Kategori Alokasi */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.trendTitleBlock}>
                <View style={styles.sectionIcon}>
                  <MaterialCommunityIcons color={colors.accent} name="chart-pie" size={18} />
                </View>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Kategori Alokasi</Text>
                  <Text style={styles.sectionSubtitle}>{allocationRows.rows.length} Kategori aktif bulan ini</Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Atur limit"
                accessibilityRole="button"
                onPress={() => setSheetVisible(true)}
                style={({ pressed }) => [styles.limitButton, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons color={colors.accent} name="tune" size={16} />
                <Text style={styles.limitButtonText}>Atur Limit</Text>
              </Pressable>
            </View>
            <View style={styles.whiteCard}>
              {budgetsError ? (
                <PartialState message={budgetsError} onRetry={() => void retryBudgetsLoad()} />
              ) : null}
              <Text style={styles.distribLabel}>
                Distribusi Budget (Total {formatCurrency(allocationRows.totalBudget)})
              </Text>
              <Text style={styles.distribUsed}>
                Terpakai: {formatCurrency(allocationRows.totalSpent)} ({allocationRows.usedPercent}%)
              </Text>
              {allocationRows.rows.length > 0 ? (
                <View style={styles.segmentBar}>
                  {allocationRows.rows.map((row, index) => {
                    const share = allocationRows.totalBudget > 0 ? (row.budget / allocationRows.totalBudget) * 100 : 0
                    return (
                      <View
                        key={row.category}
                        style={[
                          styles.segmentFill,
                          {
                            backgroundColor: index === 0 ? colors.accent : colors.accentSurface,
                            width: `${Math.max(share, 4)}%`,
                          },
                        ]}
                      />
                    )
                  })}
                </View>
              ) : null}
              {allocationRows.rows.length === 0 ? (
                <Text style={styles.chartEmpty}>Belum ada alokasi. Ketuk &quot;Atur Limit&quot; untuk membagi budget ke kategori.</Text>
              ) : (
                <View style={styles.allocRows}>
                  {allocationRows.rows.map((row) => (
                    <AllocationRow colors={colors} key={row.category} row={row} styles={styles} />
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Peringatan kuota: hanya muncul bila ada kategori ≥ 70% */}
          {nearLimit !== undefined ? (
            <View style={styles.warningCard}>
              <View style={styles.warningIcon}>
                <MaterialCommunityIcons color={colors.error} name="alert-outline" size={20} />
              </View>
              <View style={styles.warningBody}>
                <Text style={styles.warningTitle}>Peringatan Kuota Anggaran</Text>
                <Text style={styles.warningText}>
                  Alokasi &quot;{nearLimit.category}&quot; {nearLimit.percent >= 100 ? "sudah melebihi" : "mendekati"} batas ({nearLimit.percent}
                  %). Sisa kuota {formatCurrency(nearLimit.rest)} untuk kategori ini.
                </Text>
                <View style={styles.warningActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setSheetVisible(true)}
                    style={({ pressed }) => [styles.warningAction, pressed && styles.pressed]}
                  >
                    <Text style={styles.warningActionText}>Sesuaikan Alokasi</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/(tabs)/transactions")}
                    style={({ pressed }) => [styles.warningSecondary, pressed && styles.pressed]}
                  >
                    <Text style={styles.warningSecondaryText}>Lihat Detail</Text>
                  </Pressable>
                </View>
              </View>
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
                {monthSummary.expense === 0
                  ? "Belum ada pengeluaran tercatat bulan ini. Tambahkan transaksi untuk melihat pola keuanganmu."
                  : `Pengeluaran bulan ini ${formatCompactCurrency(monthSummary.expense)}. ${daysTotal > 0 ? `Rata-rata ${formatCurrency(daysAverage)}/hari dalam ${period} hari terakhir.` : ""} Tinjau kembali budgetmu agar target tetap tercapai.`}
              </Text>
            </View>
          </View>
          <View style={styles.protectedRow}>
            <MaterialCommunityIcons color={colors.accent} name="shield-check-outline" size={16} />
            <Text style={styles.protectedText}>Diproteksi oleh Saku Financial Assistant</Text>
          </View>
      </DataState>

      <AlokasiSheet
        budgets={budgets}
        busy={saveBusy}
        onClose={() => setSheetVisible(false)}
        onSave={(next) => void handleSaveBudgets(next)}
        saveError={saveError}
        transactions={transactions}
        visible={sheetVisible}
      />
    </ScreenShell>
  )
}

type AnalisisStyles = ReturnType<typeof createStyles>

type AllocationRowData = {
  readonly budget: number
  readonly category: string
  readonly percent: number
  readonly rest: number
  readonly spent: number
  readonly status: string
}

type AllocationRowProps = {
  readonly colors: ThemeColors
  readonly row: AllocationRowData
  readonly styles: AnalisisStyles
}

function AllocationRow({ colors, row, styles }: AllocationRowProps): React.ReactElement {
  const tone =
    row.percent >= 90
      ? { badge: colors.expenseSurface, text: colors.error, fill: colors.error }
      : row.percent >= 70
        ? { badge: colors.expenseSurface, text: colors.error, fill: colors.heroBackground }
        : { badge: colors.accentSurface, text: colors.accent, fill: colors.heroBackground }

  return (
    <View style={styles.allocRow}>
      <View style={[styles.rowWell, { backgroundColor: tone.badge }]}>
        <MaterialCommunityIcons color={tone.text} name={getCategoryIconName(row.category)} size={20} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTopLine}>
          <Text numberOfLines={1} style={styles.rowName}>
            {row.category}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: tone.badge }]}>
            <Text style={[styles.statusBadgeText, { color: tone.text }]}>{row.status.toUpperCase()}</Text>
          </View>
          <Text style={[styles.rowPercent, { color: tone.text }]}>{row.percent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: tone.fill, width: `${row.percent}%` }]} />
        </View>
        <View style={styles.rowBottomLine}>
          <Text style={styles.rowUsed}>
            {formatCurrency(Math.min(row.spent, row.budget))} dari {formatCurrency(row.budget)}
          </Text>
          <Text style={styles.rowRest}>Sisa {formatCurrency(row.rest)}</Text>
        </View>
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    allocRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
    },
    allocRows: {
      gap: spacing.group,
      marginTop: spacing.md,
    },
    averageBadge: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    averageDash: {
      borderTopColor: colors.textSecondary,
      borderTopWidth: 1,
      borderStyle: "dashed",
      width: 12,
    },
    averageText: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    averageStrong: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
    },
    balanceAmount: {
      color: colors.heroText,
      fontFamily: fontFamilies.bold,
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
      marginTop: spacing.xs,
    },
    balanceCard: {
      backgroundColor: colors.heroBackground,
      borderRadius: radii.lg,
      overflow: "hidden",
      padding: spacing.lg,
      ...shadows.elevated,
    },
    balanceLabel: {
      color: colors.heroMuted,
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
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    balanceTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    changeChip: {
      alignItems: "center",
      backgroundColor: colors.heroChip,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    changeChipText: {
      color: colors.heroChipText,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    monthPill: {
      alignItems: "center",
      backgroundColor: colors.heroChip,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    monthPillText: {
      color: colors.heroChipText,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
    },
    heroDivider: {
      backgroundColor: colors.heroChip,
      height: 1,
      marginTop: spacing.md,
      opacity: 0.5,
    },
    heroFlow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.md,
    },
    heroFlowItem: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
    },
    heroFlowIcon: {
      alignItems: "center",
      backgroundColor: colors.heroChip,
      borderRadius: radii.pill,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    heroFlowLabel: {
      color: colors.heroMuted,
      fontFamily: fontFamilies.semibold,
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    heroFlowValue: {
      color: colors.heroText,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyMedium.fontSize,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    heroFlowDivider: {
      backgroundColor: colors.heroChip,
      height: 28,
      opacity: 0.6,
      width: 1,
    },
    chart: {
      marginTop: spacing.md,
    },
    chartWithAxis: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    yAxis: {
      height: PLOT_HEIGHT,
      justifyContent: "space-between",
      paddingTop: CHART_TOP - 8,
      width: AXIS_WIDTH,
    },
    yLabel: {
      color: colors.textTertiary,
      flexShrink: 1,
      fontSize: 10,
      textAlign: "right",
    },
    benchmarkLine: {
      borderTopColor: colors.accent,
      borderTopWidth: 1.5,
      borderStyle: "dashed",
      left: 0,
      opacity: 0.85,
      position: "absolute",
      right: 0,
      zIndex: 1,
    },
    benchmarkTag: {
      backgroundColor: colors.accent,
      borderRadius: 4,
      maxWidth: 110,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      position: "absolute",
      right: 0,
      zIndex: 2,
    },
    benchmarkTagText: {
      color: "#FFFFFF",
      fontFamily: fontFamilies.bold,
      fontSize: 9,
      fontWeight: "700",
      textAlign: "center",
    },
    peakTag: {
      alignSelf: "center",
      backgroundColor: colors.textPrimary,
      borderRadius: 6,
      maxWidth: 52,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    peakSlot: {
      alignItems: "center",
      height: TAG_ZONE,
      justifyContent: "flex-end",
      marginBottom: 4,
    },
    peakTagText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 9,
      fontWeight: "700",
      textAlign: "center",
    },
    chartLegend: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    legendItem: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    legendDot: {
      borderRadius: 6,
      height: 10,
      width: 10,
    },
    legendText: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    trendSummary: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "space-between",
      padding: spacing.md,
    },
    trendTitleBlock: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
      minWidth: 220,
    },
    sectionIcon: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.sm,
      height: 32,
      justifyContent: "center",
      width: 32,
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
      flex: 1,
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
    chartEmpty: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: typography.bodyMedium.lineHeight,
      paddingVertical: spacing.md,
    },
    chartLabel: {
      color: colors.textSecondary,
      flex: 1,
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
      marginLeft: AXIS_WIDTH + spacing.sm,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
    distribLabel: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    distribUsed: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      marginTop: 2,
    },
    eyeButton: {
      alignItems: "center",
      borderRadius: radii.pill,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    glowBottom: {
      backgroundColor: colors.heroChip,
      borderRadius: 100,
      bottom: -40,
      height: 96,
      left: -40,
      opacity: 0.35,
      position: "absolute",
      width: 96,
    },
    glowTop: {
      backgroundColor: colors.heroBackground,
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
    insightBody: {
      flex: 1,
      gap: spacing.unit,
      paddingTop: spacing.xs,
    },
    insightCard: {
      alignItems: "flex-start",
      backgroundColor: colors.tint,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
    },
    insightIcon: {
      alignItems: "center",
      backgroundColor: colors.insightIcon,
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
    limitButton: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    limitButtonText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
    },
    periodRow: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      flexDirection: "row",
      padding: 2,
    },
    periodTab: {
      alignItems: "center",
      borderRadius: radii.pill,
      justifyContent: "center",
      minHeight: 36,
      paddingHorizontal: spacing.md,
    },
    periodTabActive: {
      backgroundColor: colors.accent,
    },
    periodTabText: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
    },
    periodTabTextActive: {
      color: "#FFFFFF",
    },
    pressed: {
      opacity: 0.72,
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
    rowBottomLine: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.xs,
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
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
    },
    rowRest: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    rowTopLine: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "space-between",
    },
    statusBadge: {
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    statusBadgeText: {
      fontFamily: fontFamilies.bold,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    rowUsed: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
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
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "space-between",
      paddingHorizontal: spacing.xs,
    },
    sectionHeaderText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    sectionSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    trendTotal: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontSize: 24,
      fontWeight: "600",
      lineHeight: 32,
      marginTop: spacing.xs,
    },
    warningAction: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.sm,
      flex: 1,
      justifyContent: "center",
      marginTop: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    warningActions: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    warningActionText: {
      color: "#FFFFFF",
      fontFamily: fontFamilies.bold,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    warningSecondary: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      marginTop: spacing.sm,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    warningSecondaryText: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 13,
      fontWeight: "700",
      textAlign: "center",
    },
    segmentBar: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: 4,
      height: 12,
      marginTop: spacing.sm,
      overflow: "hidden",
      padding: 2,
    },
    segmentFill: {
      borderRadius: radii.pill,
      height: "100%",
    },
    protectedRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      paddingVertical: spacing.sm,
    },
    protectedText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
    },
    warningBody: {
      flex: 1,
      minWidth: 0,
    },
    warningCard: {
      alignItems: "flex-start",
      backgroundColor: colors.expenseSurface,
      borderColor: colors.error,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
    },
    warningIcon: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    warningText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      lineHeight: 20,
    },
    warningTitle: {
      color: colors.error,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    whiteCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.group,
      ...shadows.card,
    },
  })
}