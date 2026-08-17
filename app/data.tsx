import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import * as DocumentPicker from "expo-document-picker"
import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native"

import { PrimaryButton } from "../src/components/PrimaryButton"
import { ScreenShell } from "../src/components/ScreenShell"
import { useBackup } from "../src/features/backup/BackupProvider"
import { useBudgets } from "../src/features/budgets/BudgetsProvider"
import { useRecurring } from "../src/features/recurring/RecurringProvider"
import { useSettings } from "../src/features/settings/SettingsProvider"
import { useTransactions } from "../src/features/transactions/TransactionsProvider"
import { radii, spacing, typography, useThemeColors, type ThemeColors } from "../src/theme"
import { writeAutoRestoreMirror } from "../src/storage/backup"
import { BackupFormatError, buildBackupPayload, parseBackup, serializeBackup } from "../src/utils/backup"
import { parseTransactionsCsv, serializeTransactionsToCsv } from "../src/utils/csv"
import { toMonthKey } from "../src/utils/dates"

type Notice = { readonly tone: "success" | "error"; readonly text: string }

export default function DataScreen(): React.ReactElement {
  const { transactions, importTransactions } = useTransactions()
  const { budgets } = useBudgets()
  const { definitions: recurring } = useRecurring()
  const { settings } = useSettings()
  const { autoRestore, autoRestored, restoreBackup, setAutoRestore } = useBackup()
  const colors = useThemeColors()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [busy, setBusy] = useState<"csv-export" | "csv-import" | "json-export" | "json-import" | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  async function handleCsvExport(): Promise<void> {
    setBusy("csv-export")
    setNotice(null)
    try {
      const csv = serializeTransactionsToCsv(transactions)
      const filename = `bendahara-transaksi-${toMonthKey(new Date())}.csv`

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
        setNotice({ tone: "success", text: `${transactions.length} transaksi diekspor ke ${filename}.` })
        return
      }

      const file = new File(Paths.cache, filename)
      if (file.exists) {
        file.delete()
      }
      file.create()
      file.write(csv)
      await Sharing.shareAsync(file.uri, { dialogTitle: "Ekspor transaksi", mimeType: "text/csv" })
      setNotice({ tone: "success", text: `${transactions.length} transaksi diekspor ke ${filename}.` })
    } catch {
      setNotice({ tone: "error", text: "Ekspor gagal. Coba lagi." })
    } finally {
      setBusy(null)
    }
  }

  async function handleCsvImport(): Promise<void> {
    setBusy("csv-import")
    setNotice(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: "text/csv" })
      if (result.canceled || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      const text = asset.file !== undefined && typeof asset.file.text === "function"
        ? await asset.file.text()
        : await (await fetch(asset.uri)).text()

      const { rows, skipped } = parseTransactionsCsv(text)
      if (rows.length === 0) {
        setNotice({ tone: "error", text: "Tidak ada transaksi valid di file tersebut." })
        return
      }

      const imported = await importTransactions(rows)
      if (!imported.ok) {
        setNotice({ tone: "error", text: imported.message })
        return
      }

      setNotice({ tone: "success", text: `${imported.added} transaksi diimpor, ${imported.skipped + skipped} dilewati.` })
    } catch {
      setNotice({ tone: "error", text: "Impor gagal. Pastikan file CSV berformat Saku." })
    } finally {
      setBusy(null)
    }
  }

  async function handleJsonExport(): Promise<void> {
    setBusy("json-export")
    setNotice(null)
    try {
      const payload = buildBackupPayload({ transactions, budgets, recurring, settings })
      const json = serializeBackup(payload)
      await writeAutoRestoreMirror(json)
      const filename = `saku-cadangan-${toMonthKey(new Date())}.json`

      if (Platform.OS === "web") {
        const blob = new Blob([json], { type: "application/json;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
      } else {
        const file = new File(Paths.cache, filename)
        if (file.exists) {
          file.delete()
        }
        file.create()
        file.write(json)
        await Sharing.shareAsync(file.uri, { dialogTitle: "Cadangkan data", mimeType: "application/json" })
      }

      setNotice({ tone: "success", text: `Seluruh data dicadangkan ke ${filename}.` })
    } catch {
      setNotice({ tone: "error", text: "Pencadangan gagal. Coba lagi." })
    } finally {
      setBusy(null)
    }
  }

  async function handleJsonRestore(): Promise<void> {
    setBusy("json-import")
    setNotice(null)
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["application/json", ".json"] })
      if (result.canceled || result.assets.length === 0) {
        return
      }

      const asset = result.assets[0]
      const text = asset.file !== undefined && typeof asset.file.text === "function"
        ? await asset.file.text()
        : await (await fetch(asset.uri)).text()

      const payload = parseBackup(text)
      const restored = await restoreBackup(payload)
      if (!restored.ok) {
        setNotice({ tone: "error", text: restored.message })
        return
      }

      setNotice({
        tone: "success",
        text: `Data dipulihkan: ${payload.transactions.length} transaksi, ${Object.keys(payload.budgets).length} anggaran, ${payload.recurring.length} transaksi berulang.`,
      })
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof BackupFormatError ? error.message : "Pemulihan gagal. Pastikan file cadangan Saku valid.",
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <ScreenShell withTabBar={false}>
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
        <View style={styles.headerText}>
          <Text style={styles.overline}>DATA</Text>
          <Text style={styles.title}>Kelola data</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Cadangkan seluruh data (transaksi, anggaran, transaksi berulang, pengaturan) ke file JSON, atau ekspor transaksi ke CSV.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cadangan lengkap</Text>
        <Text style={styles.cardCopy}>
          {transactions.length === 0
            ? "Belum ada transaksi, tetapi pengaturan tetap ikut dicadangkan."
            : `${transactions.length} transaksi, ${Object.keys(budgets).length} anggaran, dan ${recurring.length} transaksi berulang siap dicadangkan.`}
        </Text>
        <PrimaryButton
          icon="database-export-outline"
          label="Ekspor JSON"
          loading={busy === "json-export"}
          onPress={() => void handleJsonExport()}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pulihkan cadangan</Text>
        <Text style={styles.cardCopy}>Pilih file JSON cadangan Saku. Seluruh data diganti dengan isi file.</Text>
        <PrimaryButton
          icon="database-import-outline"
          label="Pulihkan JSON"
          loading={busy === "json-import"}
          onPress={() => void handleJsonRestore()}
          variant="secondary"
        />
      </View>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.cardTitle}>Pulihkan otomatis</Text>
            <Text style={styles.cardCopy}>Setelah instal ulang, data dipulihkan sendiri dari file cadangan yang tersimpan di perangkat.</Text>
          </View>
          <Switch
            accessibilityLabel="Pulihkan otomatis saat instal ulang"
            onValueChange={(value) => void setAutoRestore(value)}
            trackColor={{ false: colors.borderStrong, true: colors.income }}
            value={autoRestore}
          />
        </View>
        {autoRestored ? <Text style={styles.autoRestoredNote}>Data dipulihkan otomatis dari cadangan saat aplikasi dibuka.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cadangan transaksi (CSV)</Text>
        <Text style={styles.cardCopy}>
          {transactions.length === 0
            ? "Belum ada transaksi untuk diekspor."
            : `${transactions.length} transaksi siap diekspor.`}
        </Text>
        <PrimaryButton
          icon="download-outline"
          label="Ekspor CSV"
          loading={busy === "csv-export"}
          onPress={() => void handleCsvExport()}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pulihkan transaksi (CSV)</Text>
        <Text style={styles.cardCopy}>Impor menggabungkan transaksi dari file CSV. Data dengan isi sama dilewati.</Text>
        <PrimaryButton
          icon="upload-outline"
          label="Impor CSV"
          loading={busy === "csv-import"}
          onPress={() => void handleCsvImport()}
          variant="secondary"
        />
      </View>

      {notice ? <Text accessibilityRole="alert" style={[styles.notice, notice.tone === "error" && styles.noticeError]}>{notice.text}</Text> : null}
    </ScreenShell>
  )
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    autoRestoredNote: {
      backgroundColor: colors.accentSurface,
      borderRadius: radii.sm,
      color: colors.accent,
      fontSize: typography.caption.fontSize,
      fontFamily: typography.caption.fontFamily,
      fontWeight: typography.caption.fontWeight,
      lineHeight: typography.caption.lineHeight,
      padding: spacing.sm,
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
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radii.lg,
      borderWidth: 1,
      gap: spacing.row,
      padding: spacing.xl,
    },
    cardCopy: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontSize: typography.heading.fontSize,
      fontFamily: typography.heading.fontFamily,
      fontWeight: typography.heading.fontWeight,
      lineHeight: typography.heading.lineHeight,
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.body.fontSize,
      fontFamily: typography.body.fontFamily,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
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
    notice: {
      backgroundColor: colors.incomeSurface,
      borderRadius: radii.sm,
      color: colors.textPrimary,
      fontSize: typography.bodyMedium.fontSize,
      fontFamily: typography.bodyMedium.fontFamily,
      fontWeight: typography.bodyMedium.fontWeight,
      lineHeight: typography.bodyMedium.lineHeight,
      padding: spacing.md,
    },
    noticeError: {
      backgroundColor: colors.expenseSurface,
      color: colors.error,
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
    toggleRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.group,
    },
    toggleText: {
      flex: 1,
      gap: spacing.compact,
    },
  })
}
