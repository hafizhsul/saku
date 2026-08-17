import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { CategoryIcon } from "../../src/components/CategoryIcon"
import { EmptyState } from "../../src/components/EmptyState"
import { HeroCard } from "../../src/components/HeroCard"
import { PrimaryButton } from "../../src/components/PrimaryButton"
import { ScreenShell } from "../../src/components/ScreenShell"
import { useTransactions } from "../../src/features/transactions/TransactionsProvider"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../../src/theme"
import { formatSignedCurrency } from "../../src/utils/currency"
import { formatTransactionDate } from "../../src/utils/dates"

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
        <DetailHeader colors={colors} onBack={() => router.back()} styles={styles} />
        <EmptyState description="Menyiapkan detail transaksi." title="Memuat catatan..." />
      </ScreenShell>
    )
  }

  if (transaction === undefined) {
    return (
      <ScreenShell withTabBar={false}>
        <DetailHeader colors={colors} onBack={() => router.back()} styles={styles} />
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
  const tone = isIncome ? "income" : "expense"
  const busy = saveState === "saving"

  return (
    <ScreenShell withTabBar={false}>
      <DetailHeader colors={colors} onBack={() => router.back()} styles={styles} />

      <HeroCard
        accessibilityLabel={`${typeLabel}, ${formatSignedCurrency(transaction.amount, transaction.type)}, ${formatTransactionDate(transaction.date)}`}
        amount={formatSignedCurrency(transaction.amount, transaction.type)}
        eyebrow={typeLabel.toUpperCase()}
        footer={<Text style={styles.amountDate}>{formatTransactionDate(transaction.date)}</Text>}
        tone={isIncome ? "income" : "expense"}
        trailing={
          <View style={[styles.typePill, { backgroundColor: tone }]}>
            <MaterialCommunityIcons name={isIncome ? "arrow-down-left" : "arrow-up-right"} size={14} color={colors.surfaceElevated} />
          </View>
        }
      />

      <View style={styles.infoCard}>
        <DetailRow
          icon={<CategoryIcon category={transaction.category} tone={tone} size={18} />}
          label="Kategori"
          styles={styles}
          value={transaction.category}
        />
        <View style={styles.divider} />
        <DetailRow
          icon={<MaterialCommunityIcons color={colors.textSecondary} name="calendar-month-outline" size={18} />}
          label="Tanggal"
          styles={styles}
          value={formatTransactionDate(transaction.date)}
        />
        {transaction.note ? (
          <>
            <View style={styles.divider} />
            <DetailRow
              icon={<MaterialCommunityIcons color={colors.textSecondary} name="note-text-outline" size={18} />}
              label="Catatan"
              styles={styles}
              value={transaction.note}
            />
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
        <>
          <PrimaryButton
            icon="pencil-outline"
            label="Edit transaksi"
            onPress={() => router.push({ pathname: "/add-transaction", params: { id: transaction.id } })}
          />
          <PrimaryButton
            icon="delete-outline"
            label="Hapus transaksi"
            onPress={() => setConfirmingDelete(true)}
            variant="danger"
          />
        </>
      )}
    </ScreenShell>
  )
}

type DetailStyles = ReturnType<typeof createStyles>

function DetailHeader({ onBack, colors, styles }: { readonly onBack: () => void; readonly colors: ThemeColors; readonly styles: DetailStyles }): React.ReactElement {
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
      <View style={styles.headerText}>
        <Text style={styles.overline}>DETAIL TRANSAKSI</Text>
        <Text style={styles.title}>Detail transaksi</Text>
      </View>
    </View>
  )
}

function DetailRow({ icon, label, value, styles }: { readonly icon: React.ReactNode; readonly label: string; readonly value: string; readonly styles: DetailStyles }): React.ReactElement {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    amountDate: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    backButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
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
    detailIcon: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    detailLabel: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    detailRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.row,
      minHeight: 56,
    },
    detailValue: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      textAlign: "right",
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
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
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.group,
    },
    headerText: {
      flex: 1,
      gap: spacing.unit,
    },
    infoCard: {
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
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
    },
    typePill: {
      alignItems: "center",
      borderRadius: radii.pill,
      height: 28,
      justifyContent: "center",
      width: 28,
    },
  })
}
