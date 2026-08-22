import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { EmptyState } from "../../src/components/EmptyState"
import { getCategoryIconName } from "../../src/components/CategoryIcon"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatSignedCurrency } from "../../src/utils/currency"
import { formatTimeOfDay, formatTransactionDate } from "../../src/utils/dates"

export default function TransactionDetailScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const transactionId = typeof params.id === "string" ? params.id : undefined
  const { transactions, isLoading, deleteTransaction, saveState } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const transaction = transactionId === undefined ? undefined : transactions.find((item) => item.id === transactionId)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
        <EmptyState description="Menyiapkan detail transaksi." title="Memuat catatan..." />
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
  const typeLabel = isIncome ? "Pemasukan" : "Pengeluaran"
  const amountColor = isIncome ? colors.income : colors.error
  const iconColor = isIncome ? colors.income : colors.error
  const iconBackground = isIncome ? colors.incomeSurface : colors.expenseSurface
  const busy = saveState === "saving"

  return (
    <ScreenShell withTabBar={false}>
      <DetailHeader onBack={() => router.back()} />

      {/* Ringkasan transaksi */}
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: iconBackground }]}>
          <MaterialCommunityIcons color={iconColor} name={getCategoryIconName(transaction.category)} size={28} />
        </View>
        <Text numberOfLines={2} style={styles.heroTitle}>
          {transaction.note ?? transaction.category}
        </Text>
        <Text
          accessibilityLabel={`${typeLabel}, ${formatSignedCurrency(transaction.amount, transaction.type)}, ${formatTransactionDate(transaction.date)}`}
          style={[styles.heroAmount, { color: amountColor }]}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </Text>
      </View>

      {/* Kartu status */}
      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Text style={styles.fieldLabel}>Status</Text>
          <View style={styles.badge}>
            <MaterialCommunityIcons color={colors.accent} name="check-circle" size={16} />
            <Text style={styles.badgeText}>Berhasil</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Tanggal</Text>
              <Text style={styles.fieldValue}>{formatTransactionDate(transaction.date)}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Waktu</Text>
              <Text style={styles.fieldValue}>{formatTimeOfDay(transaction.date)} WIB</Text>
            </View>
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.fieldLabel}>Saku</Text>
              <View style={styles.sakuValue}>
                <View style={[styles.sakuWell, { backgroundColor: iconBackground }]}>
                  <MaterialCommunityIcons color={iconColor} name={getCategoryIconName(transaction.category)} size={14} />
                </View>
                <Text style={styles.fieldValue}>{transaction.category}</Text>
              </View>
            </View>
          </View>
          {transaction.note ? (
            <View style={styles.gridRow}>
              <View style={styles.gridCellFull}>
                <Text style={styles.fieldLabel}>Catatan</Text>
                <Text style={styles.noteBox}>{transaction.note}</Text>
              </View>
            </View>
          ) : null}
        </View>
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
            <MaterialCommunityIcons color={colors.surfaceElevated} name="pencil-outline" size={20} />
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
            <Text style={styles.actionDeleteText}>Hapus</Text>
          </Pressable>
        </View>
      )}
    </ScreenShell>
  )
}

// Header mengikuti pola detail: tombol kembali + judul "Detail Saku".
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
      <Text style={styles.headerTitle}>Detail Saku</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    actionDelete: {
      alignItems: "center",
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.compact,
      height: 52,
      justifyContent: "center",
    },
    actionDeleteText: {
      color: colors.error,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    actionHovered: {
      opacity: 0.85,
    },
    actionPrimary: {
      alignItems: "center",
      backgroundColor: colors.action,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.compact,
      height: 52,
      justifyContent: "center",
      ...shadows.card,
    },
    actionPrimaryText: {
      color: colors.surfaceElevated,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    actions: {
      gap: spacing.sm,
    },
    backButton: {
      alignItems: "center",
      borderRadius: radii.sm,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    badge: {
      alignItems: "center",
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    badgeText: {
      color: colors.accent,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
      lineHeight: typography.caption.lineHeight,
    },
    confirmCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.row,
      padding: spacing.xl,
    },
    confirmDescription: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    confirmTitle: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: spacing.group,
    },
    error: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      color: colors.error,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.md,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      marginBottom: spacing.xs,
    },
    fieldValue: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    grid: {
      gap: spacing.lg,
    },
    gridCell: {
      flex: 1,
    },
    gridCellFull: {
      flex: 1,
    },
    gridRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    hero: {
      alignItems: "center",
      paddingVertical: spacing.lg,
    },
    heroAmount: {
      fontFamily: fontFamilies.bold,
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
      marginTop: spacing.sm,
    },
    heroIcon: {
      alignItems: "center",
      borderRadius: 32,
      height: 64,
      justifyContent: "center",
      marginBottom: spacing.md,
      width: 64,
    },
    heroTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
      textAlign: "center",
    },
    noteBox: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.sm,
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.sm,
    },
    pressed: {
      opacity: 0.72,
    },
    sakuValue: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    sakuWell: {
      alignItems: "center",
      borderRadius: 12,
      height: 24,
      justifyContent: "center",
      width: 24,
    },
    statusCard: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.lg,
      padding: spacing.group,
      ...shadows.card,
    },
    statusRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
    },
  })
}
