import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { CategoryTrendChart } from "../../src/components/CategoryTrendChart"
import { EmptyState } from "../../src/components/EmptyState"
import { MonthNavigator } from "../../src/components/MonthNavigator"
import { MonthlyTrend } from "../../src/components/MonthlyTrend"
import { ScreenShell } from "../../src/components/ScreenShell"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import { selectMonthlyNetSeries } from "../../src/features/transactions/selectors"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { shiftMonth, toMonthKey } from "../../src/utils/dates"

export default function AnalisisScreen(): React.ReactElement {
  const { isLoading, loadError, retryLoad, transactions } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const currentMonth = toMonthKey(new Date())
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const isCurrentMonth = selectedMonth === currentMonth
  const trend = selectMonthlyNetSeries(transactions, currentMonth, 6)

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
      <MonthlyTrend points={trend} />
      <CategoryTrendChart month={selectedMonth} transactions={transactions} />
      {transactions.length === 0 ? (
        <EmptyState
          actionLabel="Catat transaksi"
          description="Tambah pemasukan atau pengeluaran untuk melihat analisis."
          icon="chart-line"
          onAction={() => router.push("/add-transaction")}
          title="Belum ada data"
        />
      ) : null}
    </ScreenShell>
  )
}

type AnalisisStyles = ReturnType<typeof createStyles>

function Header({ colors, styles }: { readonly colors: ThemeColors; readonly styles: AnalisisStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Analisis</Text>
      <Pressable
        accessibilityLabel="Tambah transaksi"
        accessibilityRole="button"
        onPress={() => router.push("/add-transaction")}
        style={({ pressed, hovered }) => [styles.addButton, hovered && styles.addButtonHovered, pressed && styles.pressed]}
      >
        <Text style={styles.addButtonText}>+ Catat</Text>
      </Pressable>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.pill,
      minHeight: 40,
      paddingHorizontal: spacing.group,
      justifyContent: "center",
    },
    addButtonHovered: {
      opacity: 0.85,
    },
    addButtonText: {
      color: colors.surface,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    pressed: {
      opacity: 0.72,
    },
    title: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "700",
      lineHeight: typography.heading.lineHeight,
    },
  })
}
