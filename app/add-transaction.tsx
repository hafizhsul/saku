import DateTimePicker from "@react-native-community/datetimepicker"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { createElement, useMemo, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native"

import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { Field } from "../src/components/Field"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { SegmentedControl } from "../src/components/SegmentedControl"
import { useTransactions } from "../src/features/transactions/TransactionsProvider"
import { isTransactionType, transactionTypeOptions, type FormErrors } from "../src/features/transactions/addTransactionForm"
import { createAddTransactionStyles } from "../src/features/transactions/addTransactionStyles"
import { categoryOptionsForType, type TransactionType } from "../src/features/transactions/types"
import { radii, shadows, typography, useThemeColors } from "../src/theme"
import { formatAmountInput, formatTransactionDate, parseAmountInput, toTransactionDate } from "../src/utils/dates"

function formatNativeDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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
  error,
  max,
  onChange,
  value,
}: {
  readonly ariaLabel: string
  readonly error: boolean
  readonly max: string
  readonly onChange: (value: string) => void
  readonly value: string
}): React.ReactElement {
  const colors = useThemeColors()
  const style = useMemo(
    () => ({
      backgroundColor: colors.surface,
      border: `1px solid ${error ? colors.error : colors.border}`,
      borderRadius: radii.md,
      boxShadow: shadows.card.boxShadow,
      boxSizing: "border-box" as const,
      color: colors.textPrimary,
      fontFamily: typography.bodyLarge.fontFamily,
      fontSize: typography.bodyLarge.fontSize,
      lineHeight: typography.bodyLarge.lineHeight,
      minHeight: 52,
      padding: "13px 12px",
      width: "100%",
    }),
    [colors, error],
  )

  return createElement("input", {
    "aria-label": ariaLabel,
    max,
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
  const styles = useMemo(() => createAddTransactionStyles(colors), [colors])
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
            <View>
              <Text style={styles.overline}>EDIT CATATAN</Text>
              <Text style={styles.title}>Edit transaksi</Text>
            </View>
            <Pressable
              accessibilityLabel="Tutup edit transaksi"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.back()}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.textSecondary} name="close" size={22} />
            </Pressable>
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
      <ScreenShell contentStyle={styles.content} withTabBar={false}>
        <View style={styles.header}>
        <View>
          <Text style={styles.overline}>{editing === undefined ? "CATATAN BARU" : "EDIT CATATAN"}</Text>
          <Text style={styles.title}>{editing === undefined ? "Tambah transaksi" : "Edit transaksi"}</Text>
        </View>
        <Pressable
          accessibilityLabel={editing === undefined ? "Tutup tambah transaksi" : "Tutup edit transaksi"}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons color={colors.textSecondary} name="close" size={22} />
        </Pressable>
        </View>

      <SegmentedControl
        accessibilityLabel="Jenis transaksi"
        onChange={handleTypeChange}
        options={transactionTypeOptions}
        selectedValue={type}
      />

      <Field error={errors.amount} label="Nominal">
        <TextInput
          accessibilityLabel="Nominal transaksi"
          autoFocus
          inputMode="numeric"
          keyboardType="number-pad"
          onChangeText={handleAmountChange}
          placeholder="Rp 0"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, errors.amount && styles.inputError]}
          value={amountInput}
        />
      </Field>

      <Field error={errors.category} label="Kategori">
        <View style={styles.categoryGrid}>
          {categoryOptionsForType(type).map((option) => {
            const selected = category === option.key
            const tone = type === "income" ? "income" : "expense"

            return (
              <Pressable
                accessibilityLabel={`${option.label}${selected ? ", dipilih" : ""}`}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={option.key}
                onPress={() => setCategory(option.key)}
                style={({ pressed }) => [styles.categoryOption, selected && styles.categorySelected, pressed && styles.pressed]}
              >
                <CategoryIcon category={option.key} tone={selected ? tone : "neutral"} size={18} />
                <Text numberOfLines={2} style={[styles.categoryLabel, selected && styles.categorySelectedLabel]}>{option.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </Field>

      <Field error={errors.date} hint="Tanggal transaksi" label="Tanggal">
        {Platform.OS === "web" ? (
          <WebDateInput
            ariaLabel="Tanggal transaksi"
            error={errors.date !== undefined}
            max={formatNativeDate(new Date())}
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
            <MaterialCommunityIcons color={colors.textSecondary} name="calendar-month-outline" size={20} />
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
      </Field>

      <Field hint="Opsional" label="Catatan">
        <TextInput
          accessibilityLabel="Catatan transaksi"
          maxLength={120}
          multiline
          onChangeText={setNote}
          placeholder="Misalnya makan siang bersama tim"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, styles.noteInput]}
          textAlignVertical="top"
          value={note}
        />
      </Field>

      {errors.general ? <Text accessibilityRole="alert" style={styles.generalError}>{errors.general}</Text> : null}
      <PrimaryButton
        icon="check"
        label={editing === undefined ? "Simpan transaksi" : "Simpan perubahan"}
        loading={saveState === "saving"}
        onPress={() => void handleSave()}
        success={isSaved}
      />
      </ScreenShell>
    </KeyboardAvoidingView>
  )
}
