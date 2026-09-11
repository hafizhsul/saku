import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { AlokasiSheet } from "../../src/components/AlokasiSheet"
import { EmptyState } from "../../src/components/EmptyState"
import { ProfileHeaderButton } from "../../src/components/ProfileHeaderButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { DataState } from "../../src/components/state/DataState"
import { HomeSkeleton } from "../../src/components/state/skeletons/HomeSkeleton"
import { TransactionRow } from "../../src/components/TransactionRow"
import { useAuth } from "../../src/features/auth/AuthProvider"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import type { BudgetsMap } from "../../src/features/budgets/types"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import {
  selectBalance,
  selectCategoryBreakdown,
  selectRecentTransactions,
} from "../../src/features/transactions/selectors"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCurrency } from "../../src/utils/currency"
import { formatMonthLabel, toMonthKey } from "../../src/utils/dates"

export default function HomeScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const { budgets, saveBudgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [sheetVisible, setSheetVisible] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  async function handleSaveSheet(next: BudgetsMap): Promise<void> {
    setSaveBusy(true)
    setSaveError(null)
    const result = await saveBudgets(next)
    setSaveBusy(false)
    if (result.ok) {
      setSheetVisible(false)
    } else {
      setSaveError(result.message)
    }
  }

  const budgetEntries = Object.entries(budgets)
  const breakdown = selectCategoryBreakdown(transactions, currentMonth, budgets)
  const recent = selectRecentTransactions(transactions, 4)

  const sakuItems = budgetEntries.map(([category, limit]) => {
    const item = breakdown.find((b) => b.category === category)
    const spent = item?.amount ?? 0
    const ratio = limit > 0 ? Math.min(spent / limit, 1) : 0
    return { category, spent, limit, ratio }
  })

  // Total Anggaran = saldo (pemasukan − pengeluaran) kumulatif, sehingga
  // berubah setiap transaksi baru (gaji, belanja, dst) tercatat.
  const totalBudget = selectBalance(transactions)

  return (
    <ScreenShell>
      <Header colors={colors} styles={styles} />
      <DataState
        emptyFallback={null}
        error={loadError}
        isEmpty={false}
        loading={isLoading}
        loadingFallback={<HomeSkeleton />}
        onRetry={() => void retryLoad()}
        partial={null}
      >
        <View style={styles.content}>
          <TotalBudgetCard
            balanceVisible={balanceVisible}
            colors={colors}
            monthLabel={formatMonthLabel(currentMonth)}
            onAlokasi={() => setSheetVisible(true)}
            onPemasukan={() => router.push({ pathname: "/add-transaction", params: { type: "income" } })}
            onToggleBalance={() => setBalanceVisible((v) => !v)}
            styles={styles}
            totalBudget={totalBudget}
          />

        {sakuItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>Saku Saya</Text>
                <Text style={styles.countBadge}>{sakuItems.length} Kategori</Text>
              </View>
              <Pressable
                accessibilityLabel="Lihat semua saku"
                accessibilityRole="button"
                onPress={() => setSheetVisible(true)}
                style={({ pressed, hovered }) => [styles.seeAll, hovered && styles.seeAllHovered, pressed && styles.pressed]}
              >
                <Text style={styles.seeAllText}>Semua</Text>
                <MaterialCommunityIcons color={colors.textPrimary} name="chevron-right" size={16} />
              </Pressable>
            </View>
            <View style={styles.sakuGrid}>
              {sakuItems.map((item) => (
                <SakuCard
                  key={item.category}
                  balanceVisible={balanceVisible}
                  category={item.category}
                  colors={colors}
                  limit={item.limit}
                  ratio={item.ratio}
                  spent={item.spent}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        ) : null}

        <CashFlowCard colors={colors} styles={styles} transactions={transactions} />

        <AlokasiSheet
          budgets={budgets}
          busy={saveBusy}
          onClose={() => setSheetVisible(false)}
          onSave={(next) => void handleSaveSheet(next)}
          saveError={saveError}
          transactions={transactions}
          visible={sheetVisible}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
            <Pressable
              accessibilityLabel="Lihat semua transaksi"
              accessibilityRole="button"
              onPress={() => router.push("/transactions")}
              style={({ pressed, hovered }) => [styles.seeAll, hovered && styles.seeAllHovered, pressed && styles.pressed]}
            >
              <Text style={styles.seeAllText}>Lihat Semua</Text>
              <MaterialCommunityIcons color={colors.textPrimary} name="chevron-right" size={16} />
            </Pressable>
          </View>
          {recent.length === 0 ? (
            <EmptyState
              description="Catat pemasukan atau pengeluaran pertamamu."
              icon="piggy-bank-outline"
              title="Belum ada transaksi"
            />
          ) : (
            <View style={styles.transactionList}>
              {recent.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  last
                  onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } })}
                  transaction={transaction}
                />
              ))}
            </View>
          )}
          </View>
        </View>
      </DataState>
    </ScreenShell>
  )
}

type HomeStyles = ReturnType<typeof createStyles>

function Header({ colors, styles }: { readonly colors: ThemeColors; readonly styles: HomeStyles }): React.ReactElement {
  const { user } = useAuth()
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? ""
  const greeting = firstName.length > 0 ? `Halo, ${firstName}` : "Halo"

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../assets/images/saku-logo.png")}
          style={styles.brandIcon}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerOverline}>Saku Finansial</Text>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {greeting}
          </Text>
        </View>
      </View>
      <ProfileHeaderButton />
    </View>
  )
}

type TotalBudgetCardProps = {
  readonly balanceVisible: boolean
  readonly colors: ThemeColors
  readonly monthLabel: string
  readonly onToggleBalance: () => void
  readonly onPemasukan: () => void
  readonly onAlokasi: () => void
  readonly styles: HomeStyles
  readonly totalBudget: number
}

function TotalBudgetCard({
  balanceVisible,
  colors,
  monthLabel,
  onAlokasi,
  onPemasukan,
  onToggleBalance,
  styles,
  totalBudget,
}: TotalBudgetCardProps): React.ReactElement {
  return (
    <View style={styles.totalBudgetCard}>
      <View style={styles.decorCircleLarge} />
      <View style={styles.decorCircleSmall} />
      <View style={styles.totalBudgetTopRow}>
        <Text style={styles.totalBudgetLabel}>Total Anggaran</Text>
        <Text style={styles.monthChip}>{monthLabel}</Text>
      </View>
      <View style={styles.totalBudgetRow}>
        <Text style={styles.totalBudgetAmount}>
          {balanceVisible ? formatCurrency(totalBudget) : "Rp ••••••"}
        </Text>
        <Pressable
          accessibilityLabel={balanceVisible ? "Sembunyikan saldo" : "Tampilkan saldo"}
          accessibilityRole="button"
          onPress={onToggleBalance}
          style={({ pressed, hovered }) => [styles.visibilityButton, hovered && styles.visibilityButtonHovered, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            color={colors.surface}
            name={balanceVisible ? "eye" : "eye-off"}
            size={20}
          />
        </Pressable>
      </View>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityLabel="Tambah pemasukan"
          accessibilityRole="button"
          onPress={onPemasukan}
          style={({ pressed, hovered }) => [styles.actionButton, styles.actionButtonPrimary, hovered && styles.actionButtonHovered, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.textPrimary} name="plus" size={18} />
          <Text style={styles.actionButtonPrimaryText}>Pemasukan</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Alokasi anggaran"
          accessibilityRole="button"
          onPress={onAlokasi}
          style={({ pressed, hovered }) => [styles.actionButton, styles.actionButtonSecondary, hovered && styles.actionButtonHovered, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.surface} name="arrow-top-right" size={18} />
          <Text style={styles.actionButtonSecondaryText}>Alokasi</Text>
        </Pressable>
      </View>
    </View>
  )
}

type SakuCardProps = {
  readonly balanceVisible: boolean
  readonly category: string
  readonly colors: ThemeColors
  readonly limit: number
  readonly ratio: number
  readonly spent: number
  readonly styles: HomeStyles
}

function SakuCard({ balanceVisible, category, colors, limit, ratio, spent, styles }: SakuCardProps): React.ReactElement {
  const isOverBudget = ratio >= 1
  const progressColor = isOverBudget ? colors.expense : colors.accent
  const icon = sakuIconConfig(colors, category)

  return (
    <View style={styles.sakuCard}>
      <View style={styles.sakuTopRow}>
        <View style={[styles.sakuIcon, { backgroundColor: icon.backgroundColor }]}>
          <MaterialCommunityIcons color={icon.iconColor} name={getCategoryIconName(category)} size={20} />
        </View>
        <Text style={[styles.sakuPercent, ratio === 0 && { color: colors.textSecondary }, isOverBudget && { color: colors.expense }]}>
          {Math.round(ratio * 100)}%
        </Text>
      </View>
      <Text style={styles.sakuCategory} numberOfLines={1}>{category}</Text>
      <Text style={styles.sakuSpent}>
        {balanceVisible ? formatCurrency(spent) : "Rp ••••••"}
      </Text>
      <Text style={styles.sakuBudget}>
        {balanceVisible ? `Anggaran: ${formatCurrency(limit)}` : "Anggaran: Rp ••••••"}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${Math.round(ratio * 100)}%` }]} />
      </View>
    </View>
  )
}

function sakuIconConfig(colors: ThemeColors, category: string): { readonly backgroundColor: string; readonly iconColor: string } {
  // Tone kontainer mengikuti referensi Stitch per kategori: kebutuhan/hiburan
  // latar terang + ikon gelap, tabungan latar gelap + ikon terang, darurat merah.
  const byCategory: Readonly<Record<string, { readonly backgroundColor: string; readonly iconColor: string }>> = {
    Kebutuhan: { backgroundColor: colors.accentSurface, iconColor: colors.accent },
    Hiburan: { backgroundColor: colors.incomeSurface, iconColor: colors.income },
    Tabungan: { backgroundColor: colors.accent, iconColor: colors.surface },
    Darurat: { backgroundColor: colors.expenseSurface, iconColor: colors.expense },
  }
  const known = byCategory[category]
  if (known !== undefined) {
    return known
  }

  const variants = [
    { backgroundColor: colors.accentSurface, iconColor: colors.accent },
    { backgroundColor: colors.incomeSurface, iconColor: colors.income },
    { backgroundColor: colors.expenseSurface, iconColor: colors.expense },
    { backgroundColor: colors.surfaceMuted, iconColor: colors.textSecondary },
  ]
  let hash = 0
  for (const char of category) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0
  }
  return variants[Math.abs(hash) % variants.length] ?? variants[0]
}

type CashFlowCardProps = {
  readonly colors: ThemeColors
  readonly styles: HomeStyles
  readonly transactions: readonly { readonly type: string; readonly amount: number; readonly date: string }[]
}

function CashFlowCard({ colors, styles, transactions }: CashFlowCardProps): React.ReactElement | null {
  const summary = useMemo(() => summarizeWeeks(transactions), [transactions])
  if (summary === null) {
    return null
  }
  return (
    <View style={styles.cashFlowCard}>
      <View style={styles.cashFlowText}>
        <Text style={styles.cashFlowOverline}>Arus Kas Pekan Ini</Text>
        <Text style={styles.cashFlowTitle} numberOfLines={2}>{summary.title}</Text>
        <Text style={styles.cashFlowSubtitle}>{summary.subtitle}</Text>
      </View>
      <View style={[styles.cashFlowIcon, { backgroundColor: summary.saving ? colors.accentSurface : colors.expenseSurface }]}>
        <MaterialCommunityIcons
          color={summary.saving ? colors.accent : colors.expense}
          name={summary.saving ? "trending-down" : "trending-up"}
          size={22}
        />
      </View>
    </View>
  )
}

// Perbandingan pengeluaran 7 hari terakhir vs 7 hari sebelumnya dari data
// nyata. Null bila belum ada pengeluaran sama sekali (R-17, R-38: tanpa
// data nyata, kartu tidak tampil).
function summarizeWeeks(
  transactions: readonly { readonly type: string; readonly amount: number; readonly date: string }[],
): { readonly title: string; readonly subtitle: string; readonly saving: boolean } | null {
  const toKey = (time: number): string => {
    const day = new Date(time)
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`
  }
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const inRange = (date: string, fromDaysAgo: number, toDaysAgo: number): boolean => {
    const key = date.slice(0, 10)
    return key >= toKey(startOfToday - fromDaysAgo * 86_400_000) && key <= toKey(startOfToday - toDaysAgo * 86_400_000)
  }
  const sum = (from: number, to: number): number =>
    transactions
      .filter((item) => item.type === "expense" && inRange(item.date, from, to))
      .reduce((total, item) => total + item.amount, 0)
  const current = sum(6, 0)
  const previous = sum(13, 7)
  if (current === 0 && previous === 0) {
    return null
  }
  if (previous === 0) {
    return { title: "Pekan pertama tercatat", subtitle: "Pengeluaranmu mulai terpantau", saving: true }
  }
  const percent = Math.round(((current - previous) / previous) * 100)
  if (percent <= 0) {
    return { title: `Hemat ${-percent}% vs Pekan Lalu`, subtitle: "Kondisi pengeluaran membaik", saving: true }
  }
  return { title: `Naik ${percent}% vs Pekan Lalu`, subtitle: "Pantau pengeluaranmu", saving: false }
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    actionButton: {
      alignItems: "center",
      borderRadius: radii.pill,
      flexDirection: "row",
      flex: 1,
      gap: spacing.unit,
      justifyContent: "center",
      minHeight: 46,
      paddingVertical: spacing.compact,
    },
    actionButtonHovered: {
      opacity: 0.85,
    },
    actionButtonPrimary: {
      backgroundColor: colors.surface,
    },
    actionButtonPrimaryText: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    actionButtonSecondary: {
      backgroundColor: "rgba(255, 255, 255, 0.22)",
    },
    actionButtonSecondaryText: {
      color: colors.surface,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    actionRow: {
      flexDirection: "row",
      gap: spacing.row,
      marginTop: spacing.row,
    },
    brandIcon: {
      borderRadius: radii.sm,
      height: 40,
      width: 40,
    },
    content: {
      gap: spacing.section,
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
    cashFlowCard: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.group,
      padding: spacing.group,
    },
    cashFlowIcon: {
      alignItems: "center",
      borderRadius: 20,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    cashFlowOverline: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.overline.fontSize,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
      textTransform: "uppercase",
    },
    cashFlowSubtitle: {
      color: colors.textSecondary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    cashFlowText: {
      flex: 1,
      gap: spacing.unit,
      minWidth: 0,
    },
    cashFlowTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "700",
      lineHeight: typography.bodyLarge.lineHeight,
    },
    countBadge: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      color: colors.accent,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    headerOverline: {
      color: colors.textTertiary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.overline.fontSize,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
      textTransform: "uppercase",
    },
    headerText: {
      gap: 2,
    },
    monthChip: {
      backgroundColor: `${colors.surface}38`,
      borderRadius: radii.pill,
      color: colors.surface,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    sakuPercent: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.overline.fontSize,
      fontWeight: "700",
      lineHeight: typography.overline.lineHeight,
    },
    sakuTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionHeaderLeft: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    totalBudgetTopRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    pressed: {
      opacity: 0.72,
    },
    profileButton: {
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    profileButtonHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    progressFill: {
      borderRadius: radii.sm,
      height: 6,
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      height: 6,
      width: "100%",
    },
    seeAll: {
      alignItems: "center",
      flexDirection: "row",
      gap: 2,
    },
    seeAllHovered: {
      opacity: 0.8,
    },
    seeAllText: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    section: {
      gap: spacing.row,
    },
    sectionHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
    },
    sakuBudget: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.regular,
      fontSize: 12,
      lineHeight: 16,
    },
    sakuCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      flexBasis: "47%",
      flexGrow: 1,
      gap: spacing.unit,
      padding: spacing.md,
      ...{
        shadowColor: colors.textTertiary,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
    },
    sakuCategory: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 20,
    },
    sakuIcon: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    sakuGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.row,
    },
    sakuSpent: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 18,
      fontVariant: ["tabular-nums"],
    },
    totalBudgetAmount: {
      color: colors.surface,
      fontVariant: ["tabular-nums"],
      fontFamily: fontFamilies.bold,
      fontSize: 26,
      fontWeight: "800",
      lineHeight: 32,
    },
    totalBudgetCard: {
      backgroundColor: colors.heroBackground,
      borderRadius: radii.xl,
      gap: spacing.unit,
      overflow: "hidden",
      padding: spacing.group,
      ...{
        shadowColor: colors.heroBackground,
        shadowOffset: { height: 6, width: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
    },
    decorCircleLarge: {
      backgroundColor: `${colors.surface}0D`,
      borderRadius: radii.pill,
      height: 128,
      position: "absolute" as const,
      right: -14,
      top: -8,
      width: 128,
    },
    decorCircleSmall: {
      backgroundColor: `${colors.surface}0D`,
      borderRadius: radii.pill,
      bottom: 34,
      height: 64,
      position: "absolute" as const,
      right: 80,
      width: 64,
    },
    totalBudgetLabel: {
      color: `${colors.surface}CC`,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.overline.fontSize,
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
      textTransform: "uppercase" as const,
    },
    totalBudgetRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
    },
    transactionList: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      gap: spacing.xs,
      padding: spacing.sm,
      ...shadows.card,
    },
    visibilityButton: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    visibilityButtonHovered: {
      backgroundColor: `${colors.surface}1A`,
    },
  })
}
