import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react"

import { useRestoreEpoch } from "../backup/BackupProvider"

import {
  defaultSettings,
  loadSettings,
  saveSettings as persistSettings,
  type Settings,
} from "../../storage/settings"
import { ThemePreferenceProvider, type ThemePreference } from "../../theme"

type SettingsContextValue = {
  readonly settings: Settings
  readonly isLoading: boolean
  readonly loadError: string | null
  readonly setTheme: (theme: ThemePreference) => Promise<void>
  readonly retryLoad: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: PropsWithChildren): React.ReactElement {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const restoreEpoch = useRestoreEpoch()

  const retryLoad = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setLoadError(null)

    try {
      const loaded = await loadSettings()
      setSettings(loaded)
    } catch {
      setLoadError("Pengaturan belum bisa dimuat. Coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void retryLoad()
  }, [retryLoad, restoreEpoch])

  const setTheme = useCallback(async (theme: ThemePreference): Promise<void> => {
    const next: Settings = { theme }
    setSettings(next)

    try {
      await persistSettings(next)
    } catch {
      // Keep the in-memory choice applied; persistence retries on next change.
    }
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, isLoading, loadError, setTheme, retryLoad }),
    [isLoading, loadError, retryLoad, setTheme, settings],
  )

  return (
    <SettingsContext.Provider value={value}>
      <ThemePreferenceProvider preference={settings.theme}>{children}</ThemePreferenceProvider>
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (context === null) {
    throw new Error("useSettings must be used within SettingsProvider")
  }

  return context
}
