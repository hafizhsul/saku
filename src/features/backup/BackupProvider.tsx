import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react"

import {
  hasAnyStoredData,
  hasAutoRestoreMarker,
  loadBackupSettings,
  markAutoRestored,
  readAutoRestoreMirror,
  saveBackupSettings,
  writeAutoRestoreMirror,
  writeRestoredData,
} from "../../storage/backup"
import { parseBackup, serializeBackup, type BackupPayload } from "../../utils/backup"

export type RestoreResult = { readonly ok: true } | { readonly ok: false; readonly message: string }

type BackupContextValue = {
  readonly ready: boolean
  readonly autoRestored: boolean
  readonly autoRestore: boolean
  readonly setAutoRestore: (enabled: boolean) => Promise<void>
  readonly restoreBackup: (payload: BackupPayload) => Promise<RestoreResult>
}

const BackupContext = createContext<BackupContextValue | null>(null)

/**
 * Provider terluar. Saat peluncuran, jika semua data kosong (instal ulang)
 * dan ada file cadangan (dipulihkan OS), data dipulihkan otomatis sebelum
 * provider lain membaca storage. `epoch` dipakai provider lain untuk reload
 * setelah restore manual dari layar data.
 */
export function BackupProvider({ children }: PropsWithChildren): React.ReactElement | null {
  const [ready, setReady] = useState(false)
  const [autoRestored, setAutoRestored] = useState(false)
  const [autoRestore, setAutoRestoreState] = useState(true)
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      let restoreEnabled = true
      try {
        restoreEnabled = (await loadBackupSettings()).autoRestore
        setAutoRestoreState(restoreEnabled)
      } catch {
        // Default tetap aktif.
      }

      if (restoreEnabled) {
        try {
          const mirror = await readAutoRestoreMirror()
          const marker = await hasAutoRestoreMarker()
          const hasData = await hasAnyStoredData()
          if (mirror !== null && !marker && !hasData) {
            const payload = parseBackup(mirror)
            await writeRestoredData(payload)
            await writeAutoRestoreMirror(serializeBackup(payload))
            await markAutoRestored()
            if (!cancelled) {
              setAutoRestored(true)
            }
          }
        } catch {
          // Cadangan rusak atau gagal ditulis: abaikan, biarkan aplikasi kosong.
        }
      }

      if (!cancelled) {
        setReady(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const setAutoRestore = useCallback(async (enabled: boolean): Promise<void> => {
    setAutoRestoreState(enabled)
    try {
      await saveBackupSettings({ autoRestore: enabled })
    } catch {
      // Preferensi tetap berlaku di memori; simpan ulang pada perubahan berikutnya.
    }
  }, [])

  const restoreBackup = useCallback(async (payload: BackupPayload): Promise<RestoreResult> => {
    try {
      await writeRestoredData(payload)
      await writeAutoRestoreMirror(serializeBackup(payload))
      setEpoch((current) => current + 1)
      return { ok: true }
    } catch {
      return { ok: false, message: "Cadangan belum bisa dipulihkan. Coba lagi." }
    }
  }, [])

  const value = useMemo<BackupContextValue>(
    () => ({ ready, autoRestored, autoRestore, setAutoRestore, restoreBackup }),
    [autoRestore, autoRestored, ready, restoreBackup, setAutoRestore],
  )

  // Gate: provider data di bawah hanya dipasang setelah pemeriksaan
  // auto-restore selesai, supaya tidak membaca storage yang belum diisi.
  if (!ready) {
    return null
  }

  return (
    <BackupContext.Provider value={value}>
      {/* epoch dilewatkan supaya provider di bawah ikut re-render saat berubah */}
      <EpochContext.Provider value={epoch}>{children}</EpochContext.Provider>
    </BackupContext.Provider>
  )
}

const EpochContext = createContext(0)

export function useBackup(): BackupContextValue {
  const context = useContext(BackupContext)
  if (context === null) {
    throw new Error("useBackup must be used within BackupProvider")
  }

  return context
}

export function useRestoreEpoch(): number {
  return useContext(EpochContext)
}
