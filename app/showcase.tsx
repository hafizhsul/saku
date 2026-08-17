import { useMemo, useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"

import { BalanceCard } from "../src/components/BalanceCard"
import { CategoryBreakdown } from "../src/components/CategoryBreakdown"
import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { Field } from "../src/components/Field"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { SegmentedControl } from "../src/components/SegmentedControl"
import { StatCard } from "../src/components/StatCard"
import { TransactionRow } from "../src/components/TransactionRow"
import { selectCategoryBreakdown, selectRecentTransactions } from "../src/features/transactions/selectors"
import { createTransaction } from "../src/features/transactions/types"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"

const showcaseTransactions = [
  createTransaction({
    type: "expense",
    amount: 85000,
    category: "Makan & Minum",
    date: "2026-08-11T12:00:00.000Z",
    note: "Makan siang",
  }),
  createTransaction({
    type: "expense",
    amount: 120000,
    category: "Transportasi",
    date: "2026-08-10T12:00:00.000Z",
  }),
  createTransaction({
    type: "income",
    amount: 6500000,
    category: "Gaji",
    date: "2026-08-01T12:00:00.000Z",
    note: "Gaji Agustus",
  }),
]

export default function ShowcaseScreen(): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [segment, setSegment] = useState("all")
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "success">("idle")
  const breakdown = useMemo(() => selectCategoryBreakdown(showcaseTransactions, "2026-08"), [])
  const recent = useMemo(() => selectRecentTransactions(showcaseTransactions, 2), [])

  function simulateSave(): void {
    setButtonState("loading")
    setTimeout(() => setButtonState("success"), 450)
    setTimeout(() => setButtonState("idle"), 1200)
  }

  return (
    <ScreenShell withTabBar={false}>
      <View style={styles.header}>
        <Text style={styles.overline}>PRIMITIVE SHOWCASE</Text>
        <Text style={styles.title}>Saku</Text>
        <Text style={styles.intro}>Kontrak visual sebelum layar produk dirangkai.</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Balance dan statistik</Text>
        <BalanceCard balance={6295000} monthLabel="Agustus 2026" />
        <View style={styles.stats}>
          <StatCard type="income" amount={6500000} />
          <StatCard type="expense" amount={205000} />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Filter dan kategori</Text>
        <SegmentedControl
          accessibilityLabel="Contoh filter transaksi"
          onChange={setSegment}
          options={[
            { value: "all", label: "Semua" },
            { value: "income", label: "Masuk" },
            { value: "expense", label: "Keluar" },
          ]}
          selectedValue={segment}
        />
        <CategoryBreakdown items={breakdown} />
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Transaksi</Text>
        <View style={styles.transactionList}>
          {recent.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
        </View>
        <View style={styles.icons}>
          <CategoryIcon category="Gaji" tone="income" />
          <CategoryIcon category="Lainnya" tone="neutral" />
          <CategoryIcon category="Kebutuhan" tone="expense" />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Field dan aksi</Text>
        <Field hint="Opsional" label="Catatan">
          <TextInput defaultValue="Contoh catatan" placeholder="Misalnya makan siang" placeholderTextColor={colors.textTertiary} style={styles.input} />
        </Field>
        <PrimaryButton
          icon="plus"
          label="Simpan transaksi"
          loading={buttonState === "loading"}
          onPress={simulateSave}
          success={buttonState === "success"}
        />
        <PrimaryButton disabled label="Aksi nonaktif" onPress={() => undefined} />
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Empty dan error</Text>
        <EmptyState description="Catat pemasukan atau pengeluaran pertama untuk melihat ringkasannya." title="Belum ada transaksi" />
        <EmptyState description="Periksa koneksi penyimpanan lalu coba lagi." error onAction={() => undefined} actionLabel="Coba lagi" title="Data belum siap" />
      </View>
    </ScreenShell>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    group: {
      gap: spacing.group,
    },
    groupTitle: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    header: {
      gap: spacing.compact,
      paddingBottom: spacing.sm,
    },
    icons: {
      flexDirection: "row",
      gap: spacing.compact,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.md,
      borderWidth: 1,
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      minHeight: 48,
      paddingHorizontal: spacing.md,
    },
    intro: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    overline: {
      color: colors.textSecondary,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
    },
    stats: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      padding: spacing.lg,
    },
    transactionList: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
    },
  })
}
