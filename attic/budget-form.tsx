import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { router, useLocalSearchParams } from "expo-router"
import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { CategoryIcon } from "../src/components/CategoryIcon"
import { EmptyState } from "../src/components/EmptyState"
import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useBudgets } from "../src/features/budgets/BudgetsProvider"
import { createAddTransactionStyles } from "../src/features/transactions/addTransactionStyles"
import { EXPENSE_CATEGORY_OPTIONS } from "../src/features/transactions/types"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { formatAmountInput, parseAmountInput } from "../src/utils/dates"

export default function BudgetFormScreen(): React.ReactElement {
  const params = useLocalSearchParams<{ category?: string | string[] }>()
  const editingCategory = typeof params.category === "string" ? params.category : undefined
  const { budgets, saveBudgets, saveState } = useBudgets()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const formStyles = useMemo(() => createAddTransactionStyles(colors), [colors])
  const editing = editingCategory === undefined ? undefined : budgets[editingCategory]
  const [selectedCategory, setSelectedCategory] = useState<string | null>(editingCategory ?? null)
  const [amountInput, setAmountInput] = useState(() => (editing === undefined ? "" : formatAmountInput(String(editing))))
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  const availableCategories = useMemo(() => EXPENSE_CATEGORY_OPTIONS.filter((option) => budgets[option.key] === undefined), [budgets])

  async function handleSave(): Promise<void> {
    if (selectedCategory === null) {
      setError("Pilih kategori dulu.")
      return
    }

    const amount = parseAmountInput(amountInput)
    if (amount === null) {
      setError("Masukkan nominal lebih dari 0.")
      return
    }

    const result = await saveBudgets({ ...budgets, [selectedCategory]: amount })
    if (!result.ok) {
      setError(result.message)
      return
    }

    setIsSaved(true)
    setTimeout(() => router.back(), 600)
  }

  if (editingCategory !== undefined && editing === undefined) {
    return (
      <ScreenShell withTabBar={false}>
        <FormHeader colors={colors} editing={false} styles={styles} />
        <EmptyState
          actionLabel="Kembali"
          description="Anggaran ini sudah tidak tersedia atau alamatnya salah."
          onAction={() => router.back()}
          title="Anggaran tidak ditemukan"
        />
      </ScreenShell>
    )
  }

  return (
    <ScreenShell withTabBar={false}>
      <FormHeader colors={colors} editing={editingCategory !== undefined} styles={styles} />

      <View style={styles.formCard}>
        {editingCategory === undefined ? (
          <>
            <Text style={styles.formTitle}>Pilih kategori</Text>
            <View style={formStyles.categoryGrid}>
              {availableCategories.map((option) => {
                const selected = selectedCategory === option.key

                return (
                  <Pressable
                    accessibilityLabel={`${option.label}${selected ? ", dipilih" : ""}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.key}
                    onPress={() => {
                      setSelectedCategory(option.key)
                      setError(null)
                    }}
                    style={({ pressed }) => [formStyles.categoryOption, selected && formStyles.categorySelected, pressed && formStyles.pressed]}
                  >
                    <CategoryIcon category={option.key} tone={selected ? "expense" : "neutral"} size={18} />
                    <Text numberOfLines={2} style={[formStyles.categoryLabel, selected && formStyles.categorySelectedLabel]}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </>
        ) : (
          <View style={styles.selectedCategory}>
            <CategoryIcon category={editingCategory} tone="expense" size={20} />
            <Text style={styles.selectedCategoryLabel}>{editingCategory}</Text>
          </View>
        )}
        <Text style={styles.formTitle}>{editingCategory === undefined ? "Nominal batas bulanan" : `Batas bulanan ${editingCategory}`}</Text>
        <TextInput
          accessibilityLabel="Nominal anggaran"
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
        {error ? <Text accessibilityRole="alert" style={formStyles.generalError}>{error}</Text> : null}
        <View style={styles.formActions}>
          <View style={styles.formAction}>
            <PrimaryButton disabled={saveState === "saving"} label="Batal" onPress={() => router.back()} variant="secondary" />
          </View>
          <View style={styles.formAction}>
            <PrimaryButton
              icon="check"
              label={editingCategory === undefined ? "Tambah" : "Simpan"}
              loading={saveState === "saving"}
              onPress={() => void handleSave()}
              success={isSaved}
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
        <Text style={styles.overline}>{editing ? "EDIT ANGGARAN" : "ANGGARAN BARU"}</Text>
        <Text style={styles.title}>{editing ? "Edit anggaran" : "Tambah anggaran"}</Text>
      </View>
      <Pressable
        accessibilityLabel={editing ? "Tutup edit anggaran" : "Tutup tambah anggaran"}
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
    formTitle: {
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
    },
    header: {
      alignItems: "flex-start",
      flexDirection: "row",
      justifyContent: "space-between",
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
    selectedCategory: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.md,
      flexDirection: "row",
      gap: spacing.row,
      padding: spacing.md,
    },
    selectedCategoryLabel: {
      color: colors.textPrimary,
      flex: 1,
      fontSize: typography.body.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
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
