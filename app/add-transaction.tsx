import DateTimePicker from "@react-native-community/datetimepicker"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { createElement, useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { EmptyState } from "../src/components/EmptyState"
import { ScreenShell } from "../src/components/ScreenShell"
import { useTransactions } from "../src/features/transactions/TransactionsProvider"
import { isTransactionType, transactionTypeOptions, type FormErrors } from "../src/features/transactions/addTransactionForm"
import { categoryOptionsForType, type TransactionType } from "../src/features/transactions/types"
import { darkColors, fontFamilies, radii, shadows, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { getCategoryIconName } from "../src/components/CategoryIcon"
import { formatAmountInput, formatTransactionDate, parseAmountInput, toTransactionDate } from "../src/utils/dates"

// Warna hero mengikuti token primary M3 pada referensi desain (selalu emerald
// gelap di semua mode). ponytail: pindah ke token tema kalau hero perlu ikut
// palet dark mode.
const HERO = {
  background: "#003527",
  text: "#FFFFFF",
  labelText: "rgba(255, 255, 255, 0.8)",
  placeholder: "rgba(255, 255, 255, 0.3)",
} as const

function formatNativeDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Bagi opsi menjadi baris berukuran `size` (mis. 4 kolom) supaya baris terakhir
// tetap rata kiri dan kolom sejajar — flex-wrap + lebar % tidak bisa diandalkan.
function chunkRows<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size))
  }
  return rows
}

function parseNativeDate(value: string): Date | null {
  const parts = value.split("-").map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) {
    return null
  }

  const [year, month, day] = parts
  if (year === undefined || month === undefined || day === undefined || year < 2000 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null
}

function WebDateInput({
  ariaLabel,
  onChange,
  value,
}: {
  readonly ariaLabel: string
  readonly onChange: (value: string) => void
  readonly value: string
}): React.ReactElement {
  const colors = useThemeColors()
  const isDark = colors.canvas === darkColors.canvas
  const style = useMemo(
    () => ({
      // Mengarahkan browser merender kalender versi gelap; input transparan
      // di dalam kotak permukaan (tanpa latar putih bawaan browser).
      backgroundColor: "transparent",
      colorScheme: isDark ? ("dark" as const) : ("light" as const),
      color: colors.textPrimary,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: typography.bodyMedium.fontWeight,
      minHeight: 24,
      outline: "none",
      padding: 0,
      width: "100%",
    }),
    [colors, isDark],
  )

  return createElement("input", {
    "aria-label": ariaLabel,
    max: formatNativeDate(new Date()),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    style,
    type: "date",
    value,
  }) as React.ReactElement
}

export default function AddTransactionScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const transactionId = typeof params.id === "string" ? params.id : undefined
  const { addTransaction, isLoading, saveState, transactions, updateTransaction } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const editing = transactionId === undefined ? undefined : transactions.find((transaction) => transaction.id === transactionId)
  const [type, setType] = useState<TransactionType>(editing?.type ?? "expense")
  const [amountInput, setAmountInput] = useState(() => (editing === undefined ? "" : new Intl.NumberFormat("id-ID").format(editing.amount)))
  const [category, setCategory] = useState(editing?.category ?? "Makan & Minum")
  const [selectedDate, setSelectedDate] = useState(() => (editing === undefined ? new Date() : new Date(editing.date)))
  const [webDateInput, setWebDateInput] = useState(() => formatNativeDate(editing === undefined ? new Date() : new Date(editing.date)))
  const [showPicker, setShowPicker] = useState(false)
  const [note, setNote] = useState(editing?.note ?? "")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSaved, setIsSaved] = useState(false)

  if (transactionId !== undefined && editing === undefined) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <ScreenShell contentStyle={styles.content} withTabBar={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityLabel="Kembali"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.textPrimary} name="arrow-left" size={22} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit transaksi</Text>
          </View>
          {isLoading ? (
            <EmptyState description="Menyiapkan catatan yang akan diedit." title="Memuat catatan..." />
          ) : (
            <EmptyState
              actionLabel="Kembali"
              description="Transaksi ini sudah tidak tersedia atau alamatnya salah."
              onAction={() => router.back()}
              title="Transaksi tidak ditemukan"
            />
          )}
        </ScreenShell>
      </KeyboardAvoidingView>
    )
  }

  function handleTypeChange(value: string): void {
    if (!isTransactionType(value)) {
      return
    }

    const nextType: TransactionType = value
    setType(nextType)
    setCategory(nextType === "income" ? "Gaji" : "Makan & Minum")
    setErrors({})
  }

  function handleAmountChange(value: string): void {
    setAmountInput(formatAmountInput(value))
    setErrors((current) => ({ ...current, amount: undefined, general: undefined }))
  }

  function handleWebDateChange(value: string): void {
    setWebDateInput(value)
    const parsedDate = parseNativeDate(value)
    if (parsedDate !== null) {
      setSelectedDate(parsedDate)
      setErrors((current) => ({ ...current, date: undefined, general: undefined }))
    }
  }

  async function handleSave(): Promise<void> {
    const amount = parseAmountInput(amountInput)
    const nextErrors: FormErrors = {
      amount: amount === null ? "Masukkan nominal lebih dari 0." : undefined,
      category: category.length === 0 ? "Pilih kategori transaksi." : undefined,
      date: Platform.OS === "web" && parseNativeDate(webDateInput) === null ? "Pilih tanggal transaksi." : undefined,
    }

    if (nextErrors.amount || nextErrors.category || nextErrors.date || amount === null) {
      setErrors(nextErrors)
      return
    }

    const result = editing === undefined
      ? await addTransaction({
          amount,
          category,
          date: toTransactionDate(selectedDate),
          note: note.trim() || undefined,
          type,
        })
      : await updateTransaction(editing.id, {
          amount,
          category,
          date: toTransactionDate(selectedDate),
          note: note.trim() || undefined,
          type,
        })

    if (!result.ok) {
      setErrors({ general: result.message })
      return
    }

    setIsSaved(true)
    setTimeout(() => router.back(), 700)
  }

  const isEditing = editing !== undefined
  const amountLabel = type === "expense" ? "Jumlah Pengeluaran" : "Jumlah Pemasukan"

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScreenShell contentStyle={styles.content} withTabBar={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Kembali"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons color={colors.textPrimary} name="arrow-left" size={22} />
          </Pressable>
          <Text style={styles.headerTitle}>{isEditing ? "Edit transaksi" : "Tambah Transaksi"}</Text>
        </View>

        {/* Header nominal */}
        <View style={styles.amountHero}>
          <Text style={styles.amountLabel}>{amountLabel}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              accessibilityLabel="Nominal transaksi"
              autoFocus
              inputMode="numeric"
              keyboardType="number-pad"
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor={HERO.placeholder}
              style={styles.amountInput}
              value={amountInput}
            />
          </View>
          {errors.amount ? (
            <Text accessibilityRole="alert" style={styles.amountError}>
              {errors.amount}
            </Text>
          ) : null}
        </View>

        {/* Pilih jenis transaksi */}
        <View accessibilityLabel="Jenis transaksi" accessibilityRole="tablist" style={styles.typeToggle}>
          {transactionTypeOptions.map((option) => {
            const selected = option.value === type
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={option.value}
                onPress={() => handleTypeChange(option.value)}
                style={({ pressed }) => [styles.typeOption, selected && styles.typeOptionSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.typeOptionText, selected && styles.typeOptionTextSelected]}>{option.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {/* Kategori */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Kategori</Text>
          {chunkRows(categoryOptionsForType(type), 4).map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.categoryRow}>
              {row.map((option) => {
                const selected = category === option.key
                const tone = type === "income" ? colors.income : colors.expense

                return (
                  <Pressable
                    accessibilityLabel={`${option.label}${selected ? ", dipilih" : ""}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.key}
                    onPress={() => setCategory(option.key)}
                    style={({ pressed }) => [styles.categoryOption, pressed && styles.pressed]}
                  >
                    <View style={[styles.categoryWell, selected && { backgroundColor: tone }]}>
                      <MaterialCommunityIcons
                        color={selected ? colors.surface : colors.textSecondary}
                        name={getCategoryIconName(option.key)}
                        size={22}
                      />
                    </View>
                    <Text numberOfLines={2} style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ))}
        </View>

        {/* Tanggal & Catatan */}
        <View style={styles.section}>
          <View style={styles.inputBox}>
            <MaterialCommunityIcons color={colors.textSecondary} name="calendar-today" size={20} />
            {Platform.OS === "web" ? (
              <WebDateInput
                ariaLabel="Tanggal transaksi"
                onChange={handleWebDateChange}
                value={webDateInput}
              />
            ) : (
              <Pressable
                accessibilityLabel={`Tanggal transaksi ${formatTransactionDate(selectedDate.toISOString())}`}
                accessibilityRole="button"
                onPress={() => setShowPicker(true)}
                style={({ pressed }) => [styles.dateTrigger, pressed && styles.pressed]}
              >
                <Text style={styles.dateText}>{formatTransactionDate(selectedDate.toISOString())}</Text>
              </Pressable>
            )}
            {Platform.OS !== "web" && showPicker ? (
              <DateTimePicker
                display="default"
                maximumDate={new Date()}
                mode="date"
                onChange={(_event, date) => {
                  setShowPicker(false)
                  if (date !== undefined) {
                    setSelectedDate(date)
                  }
                }}
                value={selectedDate}
              />
            ) : null}
          </View>

          <View style={[styles.inputBox, styles.noteBox]}>
            <MaterialCommunityIcons color={colors.textSecondary} name="note-edit-outline" size={20} />
            <TextInput
              accessibilityLabel="Catatan transaksi"
              maxLength={120}
              multiline
              onChangeText={setNote}
              placeholder="Tambahkan catatan (opsional)..."
              placeholderTextColor={colors.textTertiary}
              style={styles.noteInput}
              textAlignVertical="top"
              value={note}
            />
          </View>
        </View>

        {errors.general ? <Text accessibilityRole="alert" style={styles.generalError}>{errors.general}</Text> : null}

        {/* Simpan */}
        <Pressable
          accessibilityRole="button"
          disabled={saveState === "saving"}
          onPress={() => void handleSave()}
          style={({ pressed, hovered }) => [
            styles.saveButton,
            hovered && styles.saveButtonHovered,
            pressed && styles.saveButtonPressed,
            (saveState === "saving" || isSaved) && styles.saveButtonDisabled,
          ]}
        >
          <MaterialCommunityIcons color={HERO.text} name={isSaved ? "check-circle" : "check-circle-outline"} size={22} />
          <Text style={styles.saveButtonText}>
            {saveState === "saving" ? "Menyimpan..." : isSaved ? "Tersimpan" : isEditing ? "Simpan perubahan" : "Simpan Transaksi"}
          </Text>
        </Pressable>
      </ScreenShell>
    </KeyboardAvoidingView>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    amountError: {
      color: "#FF9C94",
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      marginTop: spacing.sm,
    },
    amountHero: {
      alignItems: "center",
      backgroundColor: HERO.background,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      marginHorizontal: -spacing.xl,
      paddingBottom: spacing["2xl"],
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      ...shadows.elevated,
    },
    amountInput: {
      color: HERO.text,
      fontFamily: fontFamilies.bold,
      fontSize: 32,
      fontWeight: "700",
      lineHeight: 40,
      padding: 0,
      textAlign: "center",
      width: 200,
    },
    amountLabel: {
      color: HERO.labelText,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
    },
    amountPrefix: {
      color: HERO.labelText,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    amountRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
    },
    backButton: {
      alignItems: "center",
      borderRadius: radii.sm,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    categoryRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    categoryLabel: {
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      marginTop: spacing.xs,
      minHeight: 32, // 2 baris label tersedia supaya semua lingkaran ikon sejajar
      textAlign: "center",
    },
    categoryLabelSelected: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    categoryOption: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      paddingVertical: spacing.xs,
    },
    categoryWell: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: 28,
      height: 56,
      justifyContent: "center",
      width: 56,
      ...shadows.card,
    },
    content: {
      paddingBottom: spacing["3xl"],
    },
    dateText: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    dateTrigger: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      minHeight: 24,
    },
    generalError: {
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
      gap: spacing.sm,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    inputBox: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.lg,
      flexDirection: "row",
      gap: spacing.md,
      minHeight: 52,
      paddingHorizontal: spacing.group,
      ...shadows.card,
    },
    keyboard: {
      flex: 1,
    },
    noteBox: {
      alignItems: "flex-start",
      minHeight: 96,
      paddingVertical: spacing.md,
    },
    noteInput: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      minHeight: 64,
      padding: 0,
    },
    pressed: {
      opacity: 0.72,
    },
    saveButton: {
      alignItems: "center",
      backgroundColor: HERO.background,
      borderRadius: radii.pill,
      flexDirection: "row",
      gap: spacing.compact,
      height: 52,
      justifyContent: "center",
      ...shadows.elevated,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonHovered: {
      opacity: 0.92,
    },
    saveButtonPressed: {
      opacity: 0.96,
      transform: [{ scale: 0.985 }],
    },
    saveButtonText: {
      color: HERO.text,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.heading.fontSize,
      fontWeight: "600",
      lineHeight: typography.heading.lineHeight,
    },
    section: {
      gap: spacing.md,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
      textTransform: "uppercase",
    },
    typeOption: {
      alignItems: "center",
      borderRadius: radii.pill,
      flex: 1,
      justifyContent: "center",
      minHeight: 40,
      paddingHorizontal: spacing.md,
    },
    typeOptionSelected: {
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    typeOptionText: {
      color: colors.textSecondary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    typeOptionTextSelected: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    typeToggle: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      flexDirection: "row",
      marginTop: -spacing.sm,
      padding: spacing.xs,
      ...shadows.card,
    },
  })
}