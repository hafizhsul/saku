import { useEffect, useMemo, useState } from "react"
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"

import { CategoryIcon } from "./CategoryIcon"
import type { BudgetsMap } from "../features/budgets/types"
import { selectBalance } from "../features/transactions/selectors"
import type { Transaction } from "../features/transactions/types"
import { EXPENSE_CATEGORY_OPTIONS } from "../features/transactions/types"
import { fontFamilies, radii, spacing, typography, useThemeColors, type ThemeColors } from "../theme"
import { formatCompactCurrency, formatCurrency } from "../utils/currency"

const SLIDER_MIN = 0
const SLIDER_MAX = 3_000_000
const SLIDER_STEP = 50_000
const DEFAULT_NEW_BUDGET = 100_000

// Deskriptor statis per kategori ala Stitch (bukan data).
const CATEGORY_HINTS: Readonly<Record<string, string>> = {
  Kebutuhan: "Batas Pengeluaran Pokok",
  "Makan & Minum": "Konsumsi Harian & Kuliner",
  Hiburan: "Rekreasi, Hobi & Liburan",
  Kesehatan: "Obat, Vitamin & Dokter",
}

type AlokasiSheetProps = {
  readonly visible: boolean
  readonly budgets: BudgetsMap
  readonly transactions: readonly Transaction[]
  readonly busy: boolean
  readonly saveError: string | null
  readonly onClose: () => void
  readonly onSave: (budgets: BudgetsMap) => void
}

export function AlokasiSheet({ visible, budgets, transactions, busy, saveError, onClose, onSave }: AlokasiSheetProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [draft, setDraft] = useState<BudgetsMap>(budgets)
  const [opened, setOpened] = useState(false)
  const [fadeValue] = useState(() => new Animated.Value(0))
  const [slideAnim] = useState(() => new Animated.Value(0))
  const [dragY] = useState(() => new Animated.Value(0))
  const [sheetHeight, setSheetHeight] = useState(0)

  // Draf disalin dari data tersimpan setiap kali sheet dibuka; Batal
  // membuangnya. Penyesuaian saat render (bukan effect) sesuai anjuran React.
  if (visible && !opened) {
    setOpened(true)
    setDraft({ ...budgets })
  }
  if (!visible && opened) {
    setOpened(false)
  }

  // Backdrop meredup sendiri (fade), sheet meluncur naik (slide): dua
  // animasi terpisah agar backdrop tidak ikut gerak sheet.
  useEffect(() => {
    if (visible) {
      fadeValue.setValue(0)
      slideAnim.setValue(0)
      Animated.parallel([
        Animated.timing(fadeValue, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start()
    }
  }, [fadeValue, slideAnim, visible])

  const enterY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [320, 0] })
  const sheetTranslateY = Animated.add(enterY, dragY)

  // Geser-turun-untuk-tutup pada zona handle + header, tapi jangan rebut
  // tap tombol tutup: responder hanya diklaim setelah benar-benar geser.
  // Jarak dilepas di bawah ambang → pegas kembali; di atas ambang atau
  // fling cepat → tutup. gesture.dy saat release sudah total perpindahan.
  const dragResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8,
        onPanResponderMove: (_event, gesture) => {
          dragY.setValue(Math.max(gesture.dy, 0))
        },
        onPanResponderRelease: (_event, gesture) => {
          const threshold = Math.max(sheetHeight * 0.25, 120)
          const fling = gesture.vy > 0.9
          if (gesture.dy > threshold || fling) {
            onClose()
            return
          }
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start()
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start()
        },
      }),
    [dragY, onClose, sheetHeight],
  )

  // Reset posisi drag setiap sheet dibuka agar tidak nyangkut di bawah.
  useEffect(() => {
    if (visible) {
      dragY.setValue(0)
    }
  }, [dragY, visible])

  const total = useMemo(() => Object.values(draft).reduce((sum, amount) => sum + amount, 0), [draft])
  const balance = useMemo(() => selectBalance(transactions), [transactions])
  const remaining = balance - total

  const available = EXPENSE_CATEGORY_OPTIONS.filter((option) => draft[option.key] === undefined)

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdropFill, { opacity: fadeValue }]}>
          <Pressable accessibilityLabel="Tutup alokasi" onPress={onClose} style={styles.backdrop} />
        </Animated.View>
        <Animated.View
          onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
          style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}
        >
          <View style={styles.grabZone} {...dragResponder.panHandlers}>
            <View style={styles.handle} />
            <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons color={colors.surface} name="tune" size={22} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Sesuaikan Alokasi Anggaran</Text>
              <Text style={styles.subtitle}>Atur ulang batas pengeluaran bulan ini</Text>
            </View>
            <Pressable
              accessibilityLabel="Tutup alokasi"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons color={colors.textSecondary} name="close" size={20} />
            </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.summary}>
              <View>
                <Text style={styles.summaryOverline}>Total Terdistribusi</Text>
                <Text style={styles.summaryTotal}>{formatCurrency(total)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRight}>
                <Text style={styles.summaryOverline}>Sisa Belum Dialokasikan</Text>
                <Text style={[styles.summaryRemaining, remaining < 0 && { color: colors.error }]}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            {Object.entries(draft).map(([category, amount]) => {
              const share = total > 0 ? Math.round((amount / total) * 100) : 0
              return (
                <View key={category} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <CategoryIcon category={category} size={18} tone="neutral" />
                    <View style={styles.rowText}>
                      <View style={styles.nameRow}>
                        <Text numberOfLines={1} style={styles.rowName}>{category}</Text>
                        <Text style={styles.shareBadge}>{share}%</Text>
                      </View>
                      <Text style={styles.rowHint}>{CATEGORY_HINTS[category] ?? "Batas Pengeluaran Bulanan"}</Text>
                    </View>
                    <Text accessibilityLabel={`Nilai alokasi ${category}`} style={styles.rowValue}>
                      {formatCurrency(amount)}
                    </Text>
                  </View>
                  <BudgetSlider
                    label={`Ubah alokasi ${category}`}
                    onChange={(next) => setDraft((prev) => ({ ...prev, [category]: next }))}
                    value={amount}
                  />
                  <View style={styles.minMaxRow}>
                    <Text style={styles.minMaxText}>Min: {formatCompactCurrency(SLIDER_MIN)}</Text>
                    <Text style={styles.minMaxText}>Target Alokasi</Text>
                    <Text style={styles.minMaxText}>Maks: {formatCompactCurrency(SLIDER_MAX)}</Text>
                  </View>
                </View>
              )
            })}

            {available.length > 0 ? (
              <View style={styles.addBlock}>
                <Text style={styles.addTitle}>Tambah kategori</Text>
                <View style={styles.chips}>
                  {available.map((option) => (
                    <Pressable
                      accessibilityLabel={`Tambah anggaran ${option.key}`}
                      accessibilityRole="button"
                      key={option.key}
                      onPress={() => setDraft((prev) => ({ ...prev, [option.key]: DEFAULT_NEW_BUDGET }))}
                      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
                    >
                      <Text style={styles.chipText}>{option.key}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {saveError ? (
              <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={onClose}
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Simpan Alokasi Baru"
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                // Nol berarti dihapus: skema budget hanya menerima positif.
                const cleaned: Record<string, number> = {}
                for (const [category, amount] of Object.entries(draft)) {
                  if (amount > 0) {
                    cleaned[category] = amount
                  }
                }
                onSave(cleaned)
              }}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed, busy && styles.disabled]}
            >
              <MaterialCommunityIcons color={colors.surface} name="check" size={18} />
              <Text style={styles.saveText}>{busy ? "Menyimpan..." : "Simpan Alokasi Baru"}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

type BudgetSliderProps = {
  readonly label: string
  readonly value: number
  readonly onChange: (next: number) => void
}

// Slider custom (PanResponder, tanpa dep native): ketuk atau geser track
// untuk set nilai. 44px area sentuh (R-03), berfungsi di native dan web.
function BudgetSlider({ label, value, onChange }: BudgetSliderProps): React.ReactElement {
  const colors = useThemeColors()
  const styles = useMemo(() => createSliderStyles(colors), [colors])
  const [trackWidth, setTrackWidth] = useState(0)

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          setFromX(event.nativeEvent.locationX)
        },
        onPanResponderMove: (event) => {
          setFromX(event.nativeEvent.locationX)
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setFromX stabil via state setter.
    [trackWidth],
  )

  function setFromX(x: number): void {
    if (trackWidth <= 0) {
      return
    }
    const ratio = Math.min(Math.max(x / trackWidth, 0), 1)
    const stepped = Math.round((ratio * (SLIDER_MAX - SLIDER_MIN)) / SLIDER_STEP) * SLIDER_STEP + SLIDER_MIN
    onChange(Math.min(Math.max(stepped, SLIDER_MIN), SLIDER_MAX))
  }

  const percent = Math.min(Math.max(((value - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100, 0), 100)

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: SLIDER_MIN, max: SLIDER_MAX, now: value }}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={styles.hitArea}
      {...responder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
        <View style={[styles.thumb, { left: `${percent}%` }]} />
      </View>
    </View>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    addBlock: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    addTitle: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
      lineHeight: typography.bodyMedium.lineHeight,
    },
    backdrop: {
      flex: 1,
    },
    backdropFill: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(16, 20, 25, 0.5)",
    },
    body: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    cancelButton: {
      alignItems: "center",
      borderColor: colors.borderStrong,
      borderRadius: radii.md,
      borderWidth: 1,
      flex: 1,
      justifyContent: "center",
      minHeight: 48,
    },
    cancelText: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      fontWeight: "600",
    },
    chip: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radii.pill,
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: spacing.group,
    },
    chipText: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: typography.bodyMedium.fontSize,
      fontWeight: "600",
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    closeButton: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderRadius: 16,
      height: 32,
      justifyContent: "center",
      width: 32,
    },
    disabled: {
      opacity: 0.6,
    },
    error: {
      backgroundColor: colors.expenseSurface,
      borderRadius: radii.sm,
      color: colors.error,
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: typography.bodyMedium.fontSize,
      padding: spacing.md,
    },
    footer: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
    },
    grabZone: {
      paddingTop: spacing.md,
    },
    handle: {
      alignSelf: "center",
      backgroundColor: colors.borderStrong,
      borderRadius: 2,
      height: 4,
      width: 40,
    },
    header: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
      padding: spacing.group,
      paddingBottom: spacing.md,
    },
    headerIcon: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      height: 40,
      justifyContent: "center",
      width: 40,
    },
    headerText: {
      flex: 1,
      gap: spacing.unit,
      paddingRight: spacing.md,
    },
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    pressed: {
      opacity: 0.72,
    },
    row: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.md,
      padding: spacing.group,
    },
    rowHeader: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.md,
    },
    rowHint: {
      color: colors.textSecondary,
      fontSize: 11,
    },
    rowName: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.semibold,
      fontSize: 14,
      fontWeight: "600",
    },
    minMaxRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    minMaxText: {
      color: colors.textTertiary,
      fontSize: 10,
      fontWeight: "500",
    },
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.unit,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowValue: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 16,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    shareBadge: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.pill,
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 10,
      fontWeight: "700",
      overflow: "hidden",
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "85%",
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    summary: {
      alignItems: "center",
      backgroundColor: colors.surfaceMuted,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      padding: spacing.group,
    },
    summaryDivider: {
      backgroundColor: colors.border,
      height: 32,
      width: 1,
    },
    summaryOverline: {
      color: colors.textSecondary,
      fontFamily: fontFamilies.semibold,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    summaryRemaining: {
      color: colors.accent,
      fontFamily: fontFamilies.bold,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
      textAlign: "right",
    },
    summaryRight: {
      alignItems: "flex-end",
    },
    summaryTotal: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 15,
      fontVariant: ["tabular-nums"],
      fontWeight: "700",
    },
    saveButton: {
      alignItems: "center",
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      flex: 2,
      flexDirection: "row",
      gap: spacing.sm,
      justifyContent: "center",
      minHeight: 48,
    },
    saveText: {
      color: colors.surface,
      fontFamily: fontFamilies.bold,
      fontSize: 14,
      fontWeight: "700",
    },
    title: {
      color: colors.textPrimary,
      fontFamily: fontFamilies.bold,
      fontSize: 18,
      fontWeight: "700",
    },
  })
}

function createSliderStyles(colors: ThemeColors) {
  return StyleSheet.create({
    fill: {
      backgroundColor: colors.accent,
      borderRadius: 3,
      height: "100%",
    },
    hitArea: {
      justifyContent: "center",
      minHeight: 44,
    },
    thumb: {
      backgroundColor: colors.accent,
      borderColor: colors.surface,
      borderRadius: 10,
      borderWidth: 2,
      height: 20,
      marginLeft: -10,
      position: "absolute",
      width: 20,
      ...{ elevation: 2 } as object,
    },
    track: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: 3,
      height: 6,
      overflow: "visible",
    },
  })
}
