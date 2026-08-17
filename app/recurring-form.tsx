import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { Field } from "../src/components/Field"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { SegmentedControl } from "../src/components/SegmentedControl"
import { useRecurring } from "../src/features/recurring/RecurringProvider"
import type { RecurringDraft } from "../src/features/recurring/types"
import { createAddTransactionStyles } from "../src/features/transactions/addTransactionStyles"
import { transactionTypeOptions } from "../src/features/transactions/addTransactionForm"
import { categoryOptionsForType, type TransactionType } from "../src/features/transactions/types"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { formatAmountInput, parseAmountInput } from "../src/utils/dates"

export default function RecurringFormScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const editingId = typeof params.id === "string" ? params.id : undefined
  const recurring = useRecurring()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const formStyles = useMemo(() => createAddTransactionStyles(colors), [colors])
  const editing = editingId === undefined ? undefined : recurring.definitions.find((definition) => definition.id === editingId)
  const [type, setType] = useState<TransactionType>(editing?.type ?? "expense")
  const [amountInput, setAmountInput] = useState(() => (editing === undefined ? "" : formatAmountInput(String(editing.amount))))
  const [category, setCategory] = useState(editing?.category ?? "Makan & Minum")
  const [dayInput, setDayInput] = useState(() => (editing === undefined ? "1" : String(editing.dayOfMonth)))
  const [note, setNote] = useState(editing?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  function handleTypeChange(value: string): void {
    if (value !== "income" && value !== "expense") {
      return
    }
    setType(value)
    setCategory(value === "income" ? "Gaji" : "Makan & Minum")
  }

  async function handleSave(): Promise<void> {
    const amount = parseAmountInput(amountInput)
    const day = Number(dayInput)

    if (amount === null) {
      setError("Masukkan nominal lebih dari 0.")
      return
    }
    if (!Number.isInteger(day) || day < 1 || day > 28) {
      setError("Tanggal jatuh tempo harus antara 1 dan 28.")
      return
    }

    const draft: RecurringDraft = {
      type,
      amount,
      category,
      dayOfMonth: day,
      note: note.trim() || undefined,
    }

    const result = editing === undefined
      ? await recurring.addDefinition(draft)
      : await recurring.updateDefinition(editing.id, draft)

    if (!result.ok) {
      setError(result.message ?? "Transaksi berulang belum tersimpan. Coba lagi.")
      return
    }

    router.back()
  }

  if (editingId !== undefined && editing === undefined) {
    return (
      <ScreenShell withTabBar={false}>
        <FormHeader colors={colors} editing={false} styles={styles} />
        <EmptyState
          actionLabel="Kembali"
          description="Transaksi berulang ini sudah tidak tersedia atau alamatnya salah."
          onAction={() => router.back()}
          title="Transaksi berulang tidak ditemukan"
        />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell withTabBar={false}>
      <FormHeader colors={colors} editing={editingId !== undefined} styles={styles} />
      <Text style={styles.hint}>Berlaku mulai bulan depan, setiap tanggal yang kamu pilih.</Text>

      <View style={styles.formCard}>
        <SegmentedControl
          accessibilityLabel="Jenis transaksi berulang"
          onChange={handleTypeChange}
          options={transactionTypeOptions}
          selectedValue={type}
        />
        <Field error={error ?? undefined} label="Nominal">
          <TextInput
            accessibilityLabel="Nominal transaksi berulang"
            autoFocus
            inputMode="numeric"
            keyboardType="number-pad"
            onChangeText={(value) => {
              setAmountInput(formatAmountInput(value))
              setError(null)
            }}
            placeholder="Rp 0"
            placeholderTextColor={colors.textTertiary}
            style={formStyles.input}
            value={amountInput}
          />
        </Field>
        <Field label="Tanggal jatuh tempo">
          <TextInput
            accessibilityLabel="Tanggal jatuh tempo"
            inputMode="numeric"
            keyboardType="number-pad"
            onChangeText={(value) => {
              setDayInput(value.replace(/[^0-9]/g, ""))
              setError(null)
            }}
            placeholder="1-28"
            placeholderTextColor={colors.textTertiary}
            style={formStyles.input}
            value={dayInput}
          />
        </Field>
        <Field label="Kategori">
          <View style={formStyles.categoryGrid}>
            {categoryOptionsForType(type).map((option) => {
              const selected = category === option.key

              return (
                <Pressable
                  accessibilityLabel={`${option.label}${selected ? ", dipilih" : ""}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={option.key}
                  onPress={() => setCategory(option.key)}
                  style={({ pressed }) => [formStyles.categoryOption, selected && formStyles.categorySelected, pressed && formStyles.pressed]}
                >
                  <CategoryIcon category={option.key} tone={selected ? (type === "income" ? "income" : "expense") : "neutral"} size={18} />
                  <Text numberOfLines={2} style={[formStyles.categoryLabel, selected && formStyles.categorySelectedLabel]}>{option.label}</Text>
                </Pressable>
              )
            })}
          </View>
        </Field>
        <Field hint="Opsional" label="Catatan">
          <TextInput
            accessibilityLabel="Catatan transaksi berulang"
            maxLength={120}
            multiline
            onChangeText={setNote}
            placeholder="Misalnya gaji bulanan"
            placeholderTextColor={colors.textTertiary}
            style={[formStyles.input, formStyles.noteInput]}
            textAlignVertical="top"
            value={note}
          />
        </Field>
        <View style={styles.formActions}>
          <View style={styles.formAction}>
            <PrimaryButton disabled={recurring.saveState === "saving"} label="Batal" onPress={() => router.back()} variant="secondary" />
          </View>
          <View style={styles.formAction}>
            <PrimaryButton
              icon="check"
              label={editing === undefined ? "Simpan" : "Simpan perubahan"}
              loading={recurring.saveState === "saving"}
              onPress={() => void handleSave()}
            />
          </View>
        </View>
      </View>
    </ScreenShell>
  )
}

type FormStyles = ReturnType<typeof createStyles>

function FormHeader({ colors, editing, styles }: { readonly colors: ThemeColors; readonly editing: boolean; readonly styles: FormStyles }): React.ReactElement {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.overline}>{editing ? "EDIT OTOMATIS" : "OTOMATIS BARU"}</Text>
        <Text style={styles.title}>{editing ? "Edit transaksi berulang" : "Tambah transaksi berulang"}</Text>
      </View>
      <Pressable
        accessibilityLabel={editing ? "Tutup edit transaksi berulang" : "Tutup tambah transaksi berulang"}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
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
    formAction: {
      flex: 1,
    },
    formActions: {
      flexDirection: "row",
      gap: spacing.row,
    },
    formCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.group,
      padding: spacing.lg,
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
      marginTop: spacing.xs,
    },
  })
}
