import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { DetailSkeleton } from "../../src/components/state/skeletons/DetailSkeleton"
import { ErrorState } from "../../src/components/state/ErrorState"
import { useBudgets } from "../../src/features/budgets/BudgetsProvider"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatCurrency, formatSignedCurrency } from "../../src/utils/currency"
import { formatTimeOfDay, formatTransactionDate, toMonthKey } from "../../src/utils/dates"

// Aksen Stitch: emerald saat Pemasukan, crimson saat Pengeluaran.
const INCOME_ACCENT = "#006B50"
const EXPENSE_ACCENT = "#c0263e"

export default function TransactionDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const transactionId = typeof params.id === "string" ? params.id : undefined
  const { transactions, isLoading, loadError, retryLoad, deleteTransaction, saveState } = useTransactions()
  const { budgets } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const transaction = transactionId === undefined ? undefined : transactions.find((item) => item.id === transactionId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Dampak anggaran dihitung nyata dari budget + total belanja kategori bulan ini.
  const budgetImpact = useMemo(() => {
    if (transaction === undefined || transaction.type !== "expense") {
      return null
    }
    const budget = budgets[transaction.category] ?? 0
    if (budget <= 0) {
      return null
    }
    const month = toMonthKey(new Date(transaction.date))
    const spent = transactions
      .filter((item) => item.type === "expense" && item.category === transaction.category && toMonthKey(new Date(item.date)) === month)
      .reduce((total, item) => total + item.amount, 0)
    return { budget, spent, percent: Math.min(100, Math.round((spent / budget) * 100)), rest: Math.max(0, budget - spent) }
  }, [budgets, transaction, transactions])

  async function handleDelete(): Promise<void> {
    if (transactionId === undefined) {
      return
    }

    const result = await deleteTransaction(transactionId)
    if (result.ok) {
      router.back()
    } else {
      setDeleteError(result.message)
    }
  }

  if (isLoading) {
    return (
      <ScreenShell withTabBar={false}>
        <DetailHeader onBack={() => router.back()} />
        <DetailSkeleton />
      </ScreenShell>
    )
  }

  if (loadError) {
    return (
      <ScreenShell withTabBar={false}>
        <DetailHeader onBack={() => router.back()} />
        <ErrorState description={loadError} onRetry={() => void retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  if (transaction === undefined) {
    return (
      <ScreenShell withTabBar={false}>
        <DetailHeader onBack={() => router.back()} />
        <EmptyState
          actionLabel="Kembali ke Beranda"
          description="Transaksi ini sudah tidak tersedia atau alamatnya salah."
          onAction={() => router.replace("/")}
          title="Transaksi tidak ditemukan"
        />
      </ScreenShell>
    )
  }

  const isIncome = transaction.type === "income"
  const accent = isIncome ? INCOME_ACCENT : EXPENSE_ACCENT
  const typeLabel = isIncome ? "Pemasukan" : "Pengeluaran"
  const busy = saveState === "saving"

  return (
    <ScreenShell withTabBar={false}>
      <DetailHeader onBack={() => router.back()} />

      {/* Ringkasan transaksi */}
      <View style={styles.hero}>
        <View style={styles.statusPill}>
          <MaterialCommunityIcons color={colors.accent} name="check-circle" size={14} />
          <Text style={styles.statusPillText}>Transaksi Berhasil</Text>
        </View>
        <View style={[styles.heroIcon, { backgroundColor: accent }]}>
          <MaterialCommunityIcons color="#FFFFFF" name={getCategoryIconName(transaction.category)} size={28} />
        </View>
        <Text numberOfLines={2} style={styles.heroTitle}>
          {transaction.note ?? transaction.category}
        </Text>
        <Text
          accessibilityLabel={`${typeLabel}, ${formatSignedCurrency(transaction.amount, transaction.type)}, ${formatTransactionDate(transaction.date)}`}
          style={[styles.heroAmount, { color: accent }]}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </Text>
        <View style={styles.heroDate}>
          <MaterialCommunityIcons color={colors.textTertiary} name="calendar-today" size={14} />
          <Text style={styles.heroDateText}>
            {formatTransactionDate(transaction.date)}, {formatTimeOfDay(transaction.date)} WIB
          </Text>
        </View>
      </View>

      {/* Dampak anggaran: hanya bila ada budget untuk kategori ini */}
      {budgetImpact !== null ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dampak Anggaran Saku</Text>
            <View style={styles.percentPill}>
              <Text style={styles.percentPillText}>{budgetImpact.percent}% terpakai</Text>
            </View>
          </View>
          <Text style={styles.budgetCategory}>{transaction.category}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { backgroundColor: accent, width: `${budgetImpact.percent}%` }]} />
          </View>
          <Text style={styles.budgetUsed}>
            Terpakai {formatCurrency(budgetImpact.spent)} / {formatCurrency(budgetImpact.budget)}
          </Text>
          <Text style={styles.budgetRest}>Sisa {formatCurrency(budgetImpact.rest)}</Text>
        </View>
      ) : null}

      {/* Rincian */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rincian Pembayaran</Text>
        <View style={styles.detailRow}>
          <Text style={styles.fieldLabel}>Kategori Pos</Text>
          <View style={styles.sakuValue}>
            <View style={[styles.sakuWell, { backgroundColor: accent }]}>
              <MaterialCommunityIcons color="#FFFFFF" name={getCategoryIconName(transaction.category)} size={14} />
            </View>
            <Text style={styles.fieldValue}>{transaction.category}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.fieldLabel}>Tanggal</Text>
          <Text style={styles.fieldValue}>{formatTransactionDate(transaction.date)}</Text>
        </View>
        {transaction.note ? (
          <>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.fieldLabel}>Catatan Transaksi</Text>
              <Text style={styles.noteBox}>{transaction.note}</Text>
            </View>
          </>
        ) : null}
      </View>

      {confirmingDelete ? (
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>Hapus transaksi ini?</Text>
          <Text style={styles.confirmDescription}>
            {transaction.note ?? transaction.category} akan dihapus permanen dan tidak bisa dikembalikan.
          </Text>
          {deleteError ? <Text accessibilityRole="alert" style={styles.error}>{deleteError}</Text> : null}
          <PrimaryButton disabled={busy} label="Batal" onPress={() => setConfirmingDelete(false)} variant="secondary" />
          <PrimaryButton
            icon="delete-outline"
            label="Hapus transaksi"
            loading={busy}
            onPress={() => void handleDelete()}
            variant="danger"
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/add-transaction", params: { id: transaction.id } })}
            style={({ pressed, hovered }) => [
              styles.actionPrimary,
              hovered && styles.actionHovered,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons color="#FFFFFF" name="pencil-outline" size={20} />
            <Text style={styles.actionPrimaryText}>Edit Transaksi</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Hapus transaksi"
            accessibilityRole="button"
            onPress={() => setConfirmingDelete(true)}
            style={({ pressed, hovered }) => [
              styles.actionDelete,
              hovered && styles.actionHovered,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons color={colors.error} name="delete-outline" size={20} />
            <Text style={styles.actionDeleteText}>Hapus Catatan Transaksi</Text>
          </Pressable>
        </View>
      )}
    </ScreenShell>
  )
}

// Header: tombol kembali lingkaran + judul tengah (tanpa ikon share —
// tidak ada fitur bagikan di aplikasi).
function DetailHeader({ onBack }: { readonly onBack: () => void }): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Kembali"
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textPrimary} name="arrow-left" size={22} />
      </Pressable>
      <Text style={styles.headerTitle}>Detail Transaksi</Text>
      <View style={styles.headerSpacer} />
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    actionDelete: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
      minHeight: 44,
    },
    actionDeleteText: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    actionHovered: {
      opacity: 0.92,
    },
    actionPrimary: {
      alignItems: "center",
      backgroundColor: INCOME_ACCENT,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.compact,
      height: 52,
      justifyContent: "center",
      ...shadows.elevated,
    },
    actionPrimaryText: {
      color: "#FFFFFF",
      fontFamily: fontFamilies.bold,
      fontSize: 14,
      fontWeight: "700",
    },
    actions: {
      gap: spacing.sm,
    },
    backButton: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.pill,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
      ...shadows.card,
    },
    budgetCategory: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      marginTop: spacing.xs,
    },
    budgetRest: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      marginTop: spacing.xs,
    },
    budgetUsed: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      marginTop: spacing.sm,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      gap: spacing.sm,
      padding: spacing.group,
      ...shadows.card,
    },
    cardHeader: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cardTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "700",
    },
    confirmCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      gap: spacing.sm,
      padding: spacing.group,
      ...shadows.card,
    },
    confirmDescription: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
    },
    confirmTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "700",
    },
    detailRow: {
      gap: spacing.xs,
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
    },
    error: {
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    fieldValue: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    headerSpacer: {
      width: 40,
    },
    headerTitle: {
      color: colors.textPrimary,
      flex: 1,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "600",
      textAlign: "center",
    },
    hero: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      gap: spacing.sm,
      padding: spacing.xl,
      ...shadows.card,
    },
    heroAmount: {
      fontFamily: fontFamilies.bold,
      fontSize: 28,
      fontWeight: "700",
    },
    heroDate: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    heroDateText: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
    },
    heroIcon: {
      alignItems: "center",
      borderRadius: 32,
      height: 64,
      justifyContent: "center",
      width: 64,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: typography.bodyLarge.fontSize,
      fontWeight: "700",
      textAlign: "center",
    },
    noteBox: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.sm,
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      padding: spacing.sm,
    },
    percentPill: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    percentPillText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
    },
    pressed: {
      opacity: 0.72,
    },
    progressFill: {
      borderRadius: 3,
      height: 6,
    },
    progressTrack: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 3,
      height: 6,
      marginTop: spacing.sm,
      overflow: "hidden",
    },
    sakuValue: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    sakuWell: {
      alignItems: "center",
      borderRadius: 14,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
    statusPill: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    statusPillText: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: typography.caption.fontSize,
      fontWeight: "700",
    },
  })
}
