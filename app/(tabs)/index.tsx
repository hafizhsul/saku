import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { BalanceCard } from "../../src/components/BalanceCard"
import { CategoryBreakdown } from "../../src/components/CategoryBreakdown"
import { CategoryTrendChart } from "../../src/components/CategoryTrendChart"
import { DailyBudgetCard } from "../../src/components/DailyBudgetCard"
import { EmptyState } from "../../src/components/EmptyState"
import { MonthNavigator } from "../../src/components/MonthNavigator"
import { MonthlyTrend } from "../../src/components/MonthlyTrend"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { StatCard } from "../../src/components/StatCard"
import { TransactionRow } from "../../src/components/TransactionRow"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import { useDailyBudget } from "../../src/features/budgets/useDailyBudget"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import {
  selectBalance,
  selectBalanceThrough,
  selectCategoryBreakdown,
  selectMonthlyNetSeries,
  selectMonthlySummary,
  selectRecentTransactions,
} from "../../src/features/transactions/selectors"
import { darkColors, fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatMonthLabel, shiftMonth, toMonthKey } from "../../src/utils/dates"

export default function HomeScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const { budgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const isCurrentMonth = selectedMonth === currentMonth
  const monthLabel = formatMonthLabel(selectedMonth)
  const summary = selectMonthlySummary(transactions, selectedMonth)
  const balance = isCurrentMonth ? selectBalance(transactions) : selectBalanceThrough(transactions, selectedMonth)
  const breakdown = selectCategoryBreakdown(transactions, selectedMonth, budgets)
  const trend = selectMonthlyNetSeries(transactions, currentMonth, 6)
  const recent = selectRecentTransactions(transactions, 4)
  const budgetCount = Object.keys(budgets).length
  const { remaining: remainingBudget, daily: dailyBudget, daysLeft } = useDailyBudget()

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
      <MonthNavigator
        canGoNext={!isCurrentMonth}
        month={selectedMonth}
        onNext={() => setSelectedMonth((month) => shiftMonth(month, 1))}
        onPrev={() => setSelectedMonth((month) => shiftMonth(month, -1))}
      />
      <BalanceCard
        balance={balance}
        contextLabel={isCurrentMonth ? "Saldo saat ini" : "Saldo akhir bulan"}
        isEmpty={transactions.length === 0}
        monthLabel={monthLabel}
      />
      <View style={styles.statRow}>
        <StatCard amount={summary.income} periodLabel={isCurrentMonth ? "Bulan ini" : monthLabel} type="income" />
        <StatCard amount={summary.expense} periodLabel={isCurrentMonth ? "Bulan ini" : monthLabel} type="expense" />
      </View>
      {transactions.length > 0 ? <CategoryBreakdown items={breakdown} /> : null}
      {transactions.length > 0 ? <CategoryTrendChart month={selectedMonth} transactions={transactions} /> : null}
      {budgetCount > 0 ? (
        <DailyBudgetCard
          daily={dailyBudget}
          daysLeft={daysLeft}
          onPress={() => router.push("/budgets")}
          remaining={remainingBudget}
        />
      ) : null}
      <View style={styles.budgetRow}>
        <Pressable
          accessibilityLabel="Atur anggaran bulanan"
          accessibilityRole="button"
          onPress={() => router.push("/budgets")}
          style={({ pressed, hovered }) => [styles.budgetLink, hovered && styles.budgetLinkHovered, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.accent} name="tune-variant" size={16} />
          <Text style={styles.budgetLinkText}>Atur anggaran bulanan</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Transaksi berulang"
          accessibilityRole="button"
          onPress={() => router.push("/recurring")}
          style={({ pressed, hovered }) => [styles.budgetLink, hovered && styles.budgetLinkHovered, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.accent} name="repeat" size={16} />
          <Text style={styles.budgetLinkText}>Transaksi berulang</Text>
        </Pressable>
      </View>
      {transactions.length > 0 ? <MonthlyTrend points={trend} /> : null}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi terbaru</Text>
          {recent.length > 0 ? <Text style={styles.sectionMeta}>{recent.length} catatan</Text> : null}
        </View>
        {recent.length === 0 ? (
          <EmptyState
            description="Catat pemasukan atau pengeluaran pertamamu untuk mulai melihat pola keuangan."
            icon="piggy-bank-outline"
            title="Belum ada transaksi"
          />
        ) : (
          <View style={styles.transactionList}>
            {recent.map((transaction, index) => (
              <TransactionRow
                key={transaction.id}
                last={index === recent.length - 1}
                onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } })}
                transaction={transaction}
              />
            ))}
          </View>
        )}
      </View>
      <PrimaryButton icon="plus" label="Tambah transaksi" onPress={() => router.push("/add-transaction")} />
    </ScreenShell>
  )
}

type HomeStyles = ReturnType<typeof createStyles>

function Header({ colors, styles }: { readonly colors: ThemeColors; readonly styles: HomeStyles }): React.ReactElement {
  const isDark = colors.canvas === darkColors.canvas

  return (
    <View style={styles.header}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={isDark ? require("../../assets/images/logo-lockup-dark.png") : require("../../assets/images/logo-lockup.png")}
        style={styles.brandLockup}
      />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    budgetLink: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.unit,
      minHeight: 44,
    },
    budgetLinkHovered: {
      opacity: 0.8,
    },
    budgetLinkText: {
      color: colors.accent,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    budgetRow: {
      alignItems: "flex-start",
      flexDirection: "row",
      gap: spacing.section,
    },
    brandLockup: {
      height: 80,
      width: 240,
    },
    header: {
      paddingBottom: spacing.compact,
    },
    pressed: {
      opacity: 0.72,
    },
    recentSection: {
      gap: spacing.section,
    },
    sectionHeader: {
      alignItems: "baseline",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    sectionMeta: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
    },
    statRow: {
      flexDirection: "row",
      gap: spacing.row,
    },
    transactionList: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      ...shadows.card,
    },
  })
}
