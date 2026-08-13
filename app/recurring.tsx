import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router } from "expo-router"
import { useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useRecurring } from "../src/features/recurring/RecurringProvider"
import type { RecurringDefinition } from "../src/features/recurring/types"
import { fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { formatSignedCurrency } from "../src/utils/currency"

export default function RecurringScreen(): React.ReactElement {
  const recurring = useRecurring()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (recurring.isLoading) {
    return (
      <ScreenShell withTabBar={false}>
        <RecurringHeader colors={colors} styles={styles} />
        <EmptyState description="Menyiapkan transaksi berulang." title="Memuat catatan..." />
      </ScreenShell>
    )
  }

  if (recurring.loadError) {
    return (
      <ScreenShell withTabBar={false}>
        <RecurringHeader colors={colors} styles={styles} />
        <EmptyState actionLabel="Coba lagi" description={recurring.loadError} error onAction={() => void recurring.retryLoad()} title="Data belum siap" />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell withTabBar={false}>
      <RecurringHeader colors={colors} styles={styles} />
      <Text style={styles.hint}>Gaji dan tagihan masuk otomatis setiap tanggal yang kamu pilih, mulai bulan depan.</Text>
      {recurring.definitions.length === 0 ? (
        <EmptyState
          description="Tambahkan gaji atau tagihan bulanan sekali, lalu biarkan tercatat otomatis."
          icon="repeat"
          title="Belum ada transaksi berulang"
        />
      ) : (
        <View style={styles.list}>
          {recurring.definitions.map((definition, index) => (
            <RecurringRow
              colors={colors}
              definition={definition}
              key={definition.id}
              last={index === recurring.definitions.length - 1}
              onDelete={() => void recurring.deleteDefinition(definition.id)}
              onEdit={() => router.push({ pathname: "/recurring-form", params: { id: definition.id } })}
              styles={styles}
            />
          ))}
        </View>
      )}
      <PrimaryButton icon="repeat" label="Tambah transaksi berulang" onPress={() => router.push("/recurring-form")} variant="secondary" />
    </ScreenShell>
  )
}

type RecurringStyles = ReturnType<typeof createStyles>

function RecurringRow({
  colors,
  definition,
  styles,
  last = false,
  onEdit,
  onDelete,
}: {
  readonly colors: ThemeColors
  readonly definition: RecurringDefinition
  readonly styles: RecurringStyles
  readonly last?: boolean
  readonly onEdit: () => void
  readonly onDelete: () => void
}): React.ReactElement {
  const isIncome = definition.type === "income"
  const title = definition.note ?? definition.category

  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Pressable
        accessibilityLabel={`${title}, ${isIncome ? "pemasukan" : "pengeluaran"}, tiap tanggal ${definition.dayOfMonth}, ${formatSignedCurrency(definition.amount, definition.type)}. Edit`}
        accessibilityRole="button"
        onPress={onEdit}
        style={({ pressed, hovered }) => [styles.rowMain, hovered && styles.rowHovered, pressed && styles.pressed]}
      >
        <CategoryIcon category={definition.category} tone={isIncome ? "income" : "expense"} size={20} />
        <View style={styles.rowInfo}>
          <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowMeta}>{definition.category} · tiap tanggal {definition.dayOfMonth}</Text>
        </View>
        <Text style={[styles.rowAmount, { color: isIncome ? colors.income : colors.expense }]}>
          {formatSignedCurrency(definition.amount, definition.type)}
        </Text>
      </Pressable>
      <Pressable
        accessibilityLabel={`Hapus ${title}`}
        accessibilityRole="button"
        hitSlop={10}
        onPress={onDelete}
        style={({ pressed, hovered }) => [styles.deleteButton, hovered && styles.rowHovered, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textSecondary} name="trash-can-outline" size={18} />
      </Pressable>
    </View>
  )
}

function RecurringHeader({ colors, styles }: { readonly colors: ThemeColors; readonly styles: RecurringStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.overline}>OTOMATIS</Text>
        <Text style={styles.title}>Transaksi berulang</Text>
      </View>
      <Pressable
        accessibilityLabel="Tutup transaksi berulang"
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed, hovered }) => [styles.closeButton, hovered && styles.iconHovered, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.textSecondary} name="close" size={22} />
      </Pressable>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    closeButton: {
      alignItems: "center",
      borderColor: colors.border,
      borderRadius: radii.sm,
      borderWidth: 1,
      height: 44,
      justifyContent: "center",
      width: 44,
    },
    deleteButton: {
      alignItems: "center",
      borderRadius: radii.md,
      height: 44,
      justifyContent: "center",
      width: 40,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    hint: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    iconHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    list: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      ...shadows.card,
    },
    overline: {
      color: colors.accent,
      fontSize: typography.overline.fontSize,
      fontFamily: typography.overline.fontFamily,
      fontWeight: typography.overline.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.overline.lineHeight,
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      alignItems: "center",
      borderBottomColor: colors.border,
      borderBottomWidth: 1,
      flexDirection: "row",
      gap: spacing.unit,
    },
    rowAmount: {
      fontSize: typography.caption.fontSize,
      fontFamily: fontFamilies.bold,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      lineHeight: typography.caption.lineHeight,
      maxWidth: "35%",
      textAlign: "right",
    },
    rowHovered: {
      backgroundColor: colors.surfaceMuted,
    },
    rowInfo: {
      flex: 1,
      gap: spacing.unit,
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    rowMain: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: spacing.row,
      minHeight: 68,
      paddingVertical: spacing.md,
    },
    rowMeta: {
      color: colors.textTertiary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: typography.body.fontSize,
      fontFamily: fontFamilies.semibold,
      fontWeight: "600",
      lineHeight: typography.body.lineHeight,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.title.fontSize,
      fontFamily: typography.title.fontFamily,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      marginTop: spacing.xs,
    },
  })
}
