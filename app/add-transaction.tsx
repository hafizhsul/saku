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
import { setPendingToast } from "../src/features/transactions/pendingToast"
import { formatCurrency } from "../src/utils/currency"
import { formatAmountInput, formatTransactionDate, parseAmountInput, toTransactionDate } from "../src/utils/dates"

// Putih di atas hero emerald/crimson terbaca di kedua mode (R-34 aman).
const HERO_LABEL = "rgba(255, 255, 255, 0.8)"
const HERO_PLACEHOLDER = "rgba(255, 255, 255, 0.3)"

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
      border: "none",
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
  const params = useLocalSearchParams<{ id?: string | string[]; type?: string | string[] }>()
  const transactionId = typeof params.id === "string" ? params.id : undefined
  const initialTypeParam = typeof params.type === "string" ? params.type : undefined
  const { addTransaction, isLoading, saveState, transactions, updateTransaction } = useTransactions()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const editing = transactionId === undefined ? undefined : transactions.find((transaction) => transaction.id === transactionId)
  const [type, setType] = useState<TransactionType>(() => {
    if (editing?.type !== undefined) {
      return editing.type
    }
    // Tombol "Pemasukan" di Beranda membuka form langsung di tab Pemasukan;
    // nilai asing diabaikan (jatuh ke Pengeluaran).
    return initialTypeParam !== undefined && isTransactionType(initialTypeParam) ? initialTypeParam : "expense"
  })
  const [amountInput, setAmountInput] = useState(() => (editing === undefined ? "" : new Intl.NumberFormat("id-ID").format(editing.amount)))
  const [category, setCategory] = useState(
    () => editing?.category ?? (initialTypeParam === "income" && isTransactionType(initialTypeParam) ? "Gaji" : "Makan & Minum"),
  )
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

  function handlePreset(increment: number): void {
    const current = parseAmountInput(amountInput) ?? 0
    setAmountInput(formatAmountInput(String(current + increment)))
    setErrors((currentErrors) => ({ ...currentErrors, amount: undefined, general: undefined }))
  }

  function handleResetAmount(): void {
    setAmountInput("")
    setErrors((currentErrors) => ({ ...currentErrors, amount: undefined, general: undefined }))
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
    const typeLabel = type === "expense" ? "Pengeluaran" : "Pemasukan"
    // Toast dititipkan ke Home via pending store; form langsung kembali
    // agar toast muncul di Home, bukan di layar form.
    setPendingToast({
      title: editing === undefined ? `${typeLabel} Berhasil Dicatat!` : "Perubahan Tersimpan!",
      subtitle: `${category} • ${formatCurrency(amount)}`,
      transactionId: result.transaction.id,
    })
    // Tambah baru: back() pop modal ke tabs yang sudah ada, navigate("/")
    // memastikan mendarat di tab Beranda (toast konfirmasi tampil di Home).
    // navigate/replace TANPA back() dari modal menumpuk instance tabs baru
    // (tab bar terduplikasi di DOM). Edit: cukup back() ke layar asal.
    router.back()
    if (editing === undefined) {
      router.navigate("/")
    }
  }

  const isEditing = editing !== undefined
  // Aksen Stitch mengikuti tipe: emerald saat Pemasukan, crimson saat Pengeluaran.
  const typeAccent = type === "expense" ? "#c0263e" : "#006B50"
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
          <View style={styles.headerSpacer} />
        </View>

        {/* Header nominal */}
        <View style={[styles.amountHero, { backgroundColor: type === "expense" ? colors.expense : colors.heroBackground }]}>
          <View style={styles.decorCircleLarge} />
          <View style={styles.decorCircleSmall} />
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
              placeholderTextColor={HERO_PLACEHOLDER}
              style={styles.amountInput}
              value={amountInput}
            />
          </View>
          <View style={styles.presetRow}>
            {(
              [
                { increment: 100_000, label: "+100rb", spoken: "Tambah 100 ribu" },
                { increment: 500_000, label: "+500rb", spoken: "Tambah 500 ribu" },
                { increment: 1_000_000, label: "+1jt", spoken: "Tambah 1 juta" },
              ] as const
            ).map((preset) => (
              <Pressable
                accessibilityLabel={preset.spoken}
                accessibilityRole="button"
                key={preset.label}
                onPress={() => handlePreset(preset.increment)}
                style={({ pressed }) => [styles.presetChip, pressed && styles.pressed]}
              >
                <Text style={styles.presetChipText}>{preset.label}</Text>
              </Pressable>
            ))}
            <Pressable
              accessibilityLabel="Atur ulang nominal"
              accessibilityRole="button"
              onPress={handleResetAmount}
              style={({ pressed }) => [styles.presetReset, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={HERO_LABEL} name="refresh" size={14} />
            </Pressable>
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
                <View style={styles.typeOptionContent}>
                  {selected ? <View style={[styles.typeDot, { backgroundColor: typeAccent }]} /> : null}
                  <Text style={[styles.typeOptionText, selected && styles.typeOptionTextSelected, selected && { color: typeAccent }]}>
                    {option.label}
                  </Text>
                </View>
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

                return (
                  <Pressable
                    accessibilityLabel={`${option.label}${selected ? ", dipilih" : ""}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.key}
                    onPress={() => setCategory(option.key)}
                    style={({ pressed }) => [styles.categoryOption, pressed && styles.pressed]}
                  >
                    <View
                      style={[
                        styles.categoryWell,
                        selected && styles.categoryWellSelected,
                        selected && { backgroundColor: typeAccent, borderColor: typeAccent },
                      ]}
                    >
                      <MaterialCommunityIcons
                        color={selected ? "#FFFFFF" : "#475569"}
                        name={getCategoryIconName(option.key)}
                        size={24}
                      />
                      {selected ? (
                        <View style={styles.categoryBadge}>
                          <MaterialCommunityIcons color="#022c22" name="check" size={10} />
                        </View>
                      ) : null}
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
            <MaterialCommunityIcons color="#94a3b8" name="calendar-today" size={16} />
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
            <MaterialCommunityIcons color="#94a3b8" name="calendar-month" size={16} />
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
            <MaterialCommunityIcons color="#94a3b8" name="note-edit-outline" size={16} style={styles.noteIcon} />
            <TextInput
              accessibilityLabel="Catatan transaksi"
              maxLength={120}
              multiline
              onChangeText={setNote}
              placeholder="Tambahkan catatan (opsional)..."
              placeholderTextColor="#94a3b8"
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
            { backgroundColor: type === "expense" ? colors.expense : "#006B50" },
            hovered && styles.saveButtonHovered,
            pressed && styles.saveButtonPressed,
            (saveState === "saving" || isSaved) && styles.saveButtonDisabled,
          ]}
        >
          <MaterialCommunityIcons color={colors.surface} name={isSaved ? "check-circle" : "check-circle-outline"} size={20} />
          <Text style={styles.saveButtonText}>
            {saveState === "saving" ? "Menyimpan..." : isSaved ? "Tersimpan!" : isEditing ? "Simpan perubahan" : "Simpan Transaksi"}
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
      borderRadius: radii.xl,
      overflow: "hidden",
      paddingBottom: spacing["2xl"],
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xl,
      ...shadows.elevated,
    },
    amountInput: {
      color: colors.heroText,
      fontFamily: fontFamilies.bold,
      fontSize: 30,
      fontWeight: "700",
      lineHeight: 38,
      padding: 0,
      textAlign: "center",
      width: 200,
    },
    amountLabel: {
      color: HERO_LABEL,
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: typography.caption.fontWeight,
      letterSpacing: 1,
      lineHeight: typography.caption.lineHeight,
      marginBottom: spacing.sm,
      textTransform: "uppercase",
    },
    amountPrefix: {
      color: HERO_LABEL,
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
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.pill,
      borderWidth: 1,
      height: 40,
      justifyContent: "center",
      width: 40,
      ...shadows.card,
    },
    categoryBadge: {
      alignItems: "center",
      backgroundColor: "#34d399",
      borderColor: "#FFFFFF",
      borderRadius: 8,
      borderWidth: 2,
      height: 16,
      justifyContent: "center",
      position: "absolute",
      right: -4,
      top: -4,
      width: 16,
    },
    categoryRow: {
      flexDirection: "row",
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
      color: "#0f172a",
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    // Kolom tetap 25% (bukan flex:1) supaya baris terakhir yang tak penuh
    // tetap rata kiri, sejajar dengan kolom di atasnya.
    categoryOption: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xs, // setengah jarak antar kolom
      paddingVertical: spacing.xs,
      width: "25%",
    },
    categoryWell: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: 26,
      borderWidth: 1,
      height: 52,
      justifyContent: "center",
      width: 52,
      ...shadows.card,
    },
    categoryWellSelected: {
      backgroundColor: "#006B50",
      borderColor: "#006B50",
    },
    content: {
      paddingBottom: spacing["3xl"],
    },
    decorCircleLarge: {
      backgroundColor: "rgba(255, 255, 255, 0.07)",
      borderRadius: radii.pill,
      height: 128,
      position: "absolute",
      right: -32,
      top: -48,
      width: 128,
    },
    decorCircleSmall: {
      backgroundColor: "rgba(255, 255, 255, 0.07)",
      borderRadius: radii.pill,
      bottom: -40,
      height: 96,
      left: -40,
      position: "absolute",
      width: 96,
    },
    dateText: {
      color: "#1e293b",
      flex: 1,
      fontFamily: fontFamilies.medium,
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
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
      lineHeight: typography.bodyLarge.lineHeight,
      textAlign: "center",
    },
    inputBox: {
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderColor: "rgba(227, 232, 229, 0.8)",
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      gap: spacing.row,
      minHeight: 52,
      paddingHorizontal: 14,
      paddingVertical: spacing.md,
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
    noteIcon: {
      marginTop: 2,
    },
    noteInput: {
      color: "#1e293b",
      flex: 1,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: 12,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: 18,
      minHeight: 64,
      padding: 0,
    },
    pressed: {
      opacity: 0.72,
    },
    presetChip: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: radii.pill,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    presetChipText: {
      color: colors.heroText,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.caption.fontSize,
      fontWeight: "600",
    },
    presetReset: {
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: radii.pill,
      borderWidth: 1,
      justifyContent: "center",
      minHeight: 44,
      minWidth: 44,
    },
    presetRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      marginTop: spacing.group,
    },
    saveButton: {
      alignItems: "center",
      borderRadius: radii.lg,
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
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
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
    typeDot: {
      backgroundColor: "#006B50",
      borderRadius: 4,
      height: 8,
      width: 8,
    },
    typeOption: {
      alignItems: "center",
      borderRadius: radii.md,
      flex: 1,
      justifyContent: "center",
      minHeight: 44,
      paddingHorizontal: spacing.md,
    },
    typeOptionContent: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.compact,
      justifyContent: "center",
    },
    typeOptionSelected: {
      backgroundColor: "#FFFFFF",
      ...shadows.card,
    },
    typeOptionText: {
      color: "#64748b",
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    typeOptionTextSelected: {
      color: "#006B50",
      fontFamily: fontFamilies.bold,
      fontWeight: "700",
    },
    typeToggle: {
      backgroundColor: "rgba(219, 232, 226, 0.5)",
      borderColor: "rgba(227, 232, 229, 0.4)",
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      marginTop: -spacing.sm,
      padding: spacing.xs,
    },
  })
}