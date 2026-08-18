import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { EmptyState } from "../../src/components/EmptyState"
import { ScreenShell } from "../../src/components/ScreenShell"
import { TransactionRow } from "../../src/components/TransactionRow"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import {
  selectBalance,
  selectCategoryBreakdown,
  selectRecentTransactions,
} from "../../src/features/transactions/selectors"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCurrency } from "../../src/utils/currency"
import { toMonthKey } from "../../src/utils/dates"

export default function HomeScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const { budgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())
  const [balanceVisible, setBalanceVisible] = useState(true)

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

  if (isLoading) {
    return (
      <ScreenShell>
        <Header colors={colors} styles={styles} />
        <EmptyState description="Menyiapkan ringkasan keuanganmu." title="Memuat catatan..." />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell>
        <Header colors={colors} styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={loadError} error onAction={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell>
      <Header colors={colors} styles={styles} />
      <View style={styles.content}>
        <TotalBudgetCard
          balanceVisible={balanceVisible}
          colors={colors}
          onAlokasi={() => router.push("/budgets")}
          onPemasukan={() => router.push("/add-transaction")}
          onToggleBalance={() => setBalanceVisible((v) => !v)}
          styles={styles}
          totalBudget={totalBudget}
        />

        {sakuItems.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saku Saya</Text>
              <Pressable
                accessibilityLabel="Lihat semua saku"
                accessibilityRole="button"
                onPress={() => router.push("/budgets")}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terakhir</Text>
          </View>
          {recent.length === 0 ? (
            <EmptyState
              description="Catat pemasukan atau pengeluaran pertamamu."
              icon="piggy-bank-outline"
              title="Belum ada transaksi"
            />
          ) : (
            <View style={styles.transactionList}>
              {recent.map((transaction, index) => (
                <TransactionRow
                  key={transaction.id}
                  card
                  last={index === recent.length - 1}
                  onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } })}
                  transaction={transaction}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </ScreenShell>
  )
}

type HomeStyles = ReturnType<typeof createStyles>

function Header({ colors, styles }: { readonly colors: ThemeColors; readonly styles: HomeStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../assets/images/screen.png")}
          style={styles.brandIcon}
        />
        <Text style={styles.headerTitle}>Halo!</Text>
      </View>
      <Pressable
        accessibilityLabel="Profil"
        accessibilityRole="button"
        style={({ pressed, hovered }) => [styles.profileButton, hovered && styles.profileButtonHovered, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textSecondary} name="account-circle-outline" size={32} />
      </Pressable>
    </View>
  )
}

type TotalBudgetCardProps = {
  readonly balanceVisible: boolean
  readonly colors: ThemeColors
  readonly onToggleBalance: () => void
  readonly onPemasukan: () => void
  readonly onAlokasi: () => void
  readonly styles: HomeStyles
  readonly totalBudget: number
}

function TotalBudgetCard({
  balanceVisible,
  colors,
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
      <Text style={styles.totalBudgetLabel}>Total Anggaran</Text>
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
          <MaterialCommunityIcons color={colors.surface} name="send" size={18} />
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
      <View style={[styles.sakuIcon, { backgroundColor: icon.backgroundColor }]}>
        <MaterialCommunityIcons color={icon.iconColor} name={getCategoryIconName(category)} size={20} />
      </View>
      <Text style={styles.sakuCategory} numberOfLines={1}>{category}</Text>
      <Text style={styles.sakuSpent}>
        {balanceVisible ? formatCurrency(spent) : "Rp ••••••"}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: progressColor, width: `${Math.round(ratio * 100)}%` }]} />
      </View>
      <Text style={styles.sakuBudget}>
        {balanceVisible ? `Anggaran: ${formatCurrency(limit)}` : "Anggaran: Rp ••••••"}
      </Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    actionButton: {
      alignItems: "center",
      borderRadius: radii.lg,
      flexDirection: "row",
      flex: 1,
      gap: spacing.unit,
      justifyContent: "center",
      minHeight: 52,
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
      backgroundColor: "rgba(255, 255, 255, 0.18)",
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
      height: 36,
      width: 36,
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
      color: colors.textTertiary,
      fontFamily: fontFamilies.regular,
      fontSize: 10,
      lineHeight: 14,
    },
    sakuCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.lg,
      flexBasis: "47%",
      flexGrow: 1,
      gap: spacing.unit,
      padding: spacing.group,
      ...{
        shadowColor: colors.textTertiary,
        shadowOffset: { height: 4, width: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
    },
    sakuCategory: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.regular,
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
    },
    sakuIcon: {
      alignItems: "center",
      borderRadius: radii.pill,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    sakuGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.row,
    },
    sakuSpent: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
      fontVariant: ["tabular-nums"],
    },
    totalBudgetAmount: {
      color: colors.surface,
      fontVariant: ["tabular-nums"],
      fontFamily: fontFamilies.bold,
      fontSize: 32,
      fontWeight: "800",
      lineHeight: 40,
    },
    totalBudgetCard: {
      backgroundColor: colors.accent,
      borderRadius: radii.xl,
      gap: spacing.unit,
      overflow: "hidden",
      padding: spacing.group,
      ...{
        shadowColor: colors.accent,
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
      right: -32,
      top: -32,
      width: 128,
    },
    decorCircleSmall: {
      backgroundColor: `${colors.surface}0D`,
      borderRadius: radii.pill,
      bottom: 16,
      height: 64,
      position: "absolute" as const,
      right: 48,
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
      gap: spacing.xs,
    },
    visibilityButton: {
      borderRadius: radii.md,
      height: 36,
      justifyContent: "center",
      width: 36,
    },
    visibilityButtonHovered: {
      backgroundColor: `${colors.surface}1A`,
    },
  })
}
