import AsyncStorage from "@react-native-async-storage/async-storage"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Platform } from "react-native"

import { createTransaction } from "../features/transactions/types"

import {
  BACKUP_MIRROR_KEY,
  BACKUP_SETTINGS_KEY,
  hasAnyStoredData,
  hasAutoRestoreMarker,
  loadBackupSettings,
  markAutoRestored,
  readAutoRestoreMirror,
  saveBackupSettings,
  writeAutoRestoreMirror,
  writeRestoredData,
} from "./backup"
import { BUDGETS_STORAGE_KEY } from "./budgets"
import { RECURRING_STORAGE_KEY } from "./recurring"
import { SETTINGS_STORAGE_KEY } from "./settings"
import { TRANSACTIONS_STORAGE_KEY } from "./transactions"

const fileSystem = vi.hoisted(() => {
  class MockFile {
    static instances: MockFile[] = []
    static defaultContent = ""
    static defaultExists = false
    uri = ""
    exists = MockFile.defaultExists
    content = MockFile.defaultContent

    constructor(public directory: string, public name: string) {
      this.uri = `file:///${directory}/${name}`
      MockFile.instances.push(this)
    }

    create(): void {
      this.exists = true
    }

    delete(): void {
      this.exists = false
    }

    write(content: string): void {
      this.content = content
      this.exists = true
    }

    async text(): Promise<string> {
      return this.content
    }
  }

  return { MockFile }
})

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    multiGet: vi.fn(),
  },
}))

vi.mock("expo-file-system", () => ({
  File: fileSystem.MockFile,
  Paths: { cache: "/cache", document: "/document" },
}))

vi.mock("react-native", () => ({ Platform: { OS: "web" } }))

const mockGetItem = vi.mocked(AsyncStorage.getItem)
const mockSetItem = vi.mocked(AsyncStorage.setItem)
const mockMultiGet = vi.mocked(AsyncStorage.multiGet)

const payload = {
  schemaVersion: 1 as const,
  createdAt: "2026-08-01T00:00:00.000Z",
  transactions: [
    createTransaction({
      type: "expense",
      amount: 100,
      category: "Makan & Minum",
      date: "2026-08-01T00:00:00.000Z",
    }),
  ],
  budgets: { "Makan & Minum": 100_000 },
  recurring: [],
  settings: { theme: "dark" as const },
}

beforeEach(() => {
  vi.clearAllMocks()
  fileSystem.MockFile.instances.length = 0
  fileSystem.MockFile.defaultContent = ""
  fileSystem.MockFile.defaultExists = false
  ;(Platform as { OS: string }).OS = "web"
})

describe("backup settings", () => {
  it("defaults auto-restore to enabled when nothing is stored", async () => {
    mockGetItem.mockResolvedValueOnce(null)

    await expect(loadBackupSettings()).resolves.toEqual({ autoRestore: true })
  })

  it("parses a stored preference", async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify({ autoRestore: false }))

    await expect(loadBackupSettings()).resolves.toEqual({ autoRestore: false })
  })

  it("falls back to enabled on invalid JSON or shape", async () => {
    mockGetItem.mockResolvedValueOnce("not-json")
    await expect(loadBackupSettings()).resolves.toEqual({ autoRestore: true })

    mockGetItem.mockResolvedValueOnce(JSON.stringify({ autoRestore: "yes" }))
    await expect(loadBackupSettings()).resolves.toEqual({ autoRestore: true })
  })

  it("persists the preference", async () => {
    await saveBackupSettings({ autoRestore: false })

    expect(mockSetItem).toHaveBeenCalledWith(BACKUP_SETTINGS_KEY, JSON.stringify({ autoRestore: false }))
  })
})

describe("auto-restore mirror", () => {
  it("stores the mirror in AsyncStorage on web without touching files", async () => {
    await writeAutoRestoreMirror("{}")

    expect(mockSetItem).toHaveBeenCalledWith(BACKUP_MIRROR_KEY, "{}")
    expect(fileSystem.MockFile.instances).toHaveLength(0)
  })

  it("reads the mirror from AsyncStorage on web", async () => {
    mockGetItem.mockResolvedValueOnce("mirror-content")

    await expect(readAutoRestoreMirror()).resolves.toBe("mirror-content")
  })

  it("writes the mirror file on native platforms", async () => {
    ;(Platform as { OS: string }).OS = "android"

    await writeAutoRestoreMirror('{"schemaVersion":1}')

    expect(mockSetItem).toHaveBeenCalledWith(BACKUP_MIRROR_KEY, '{"schemaVersion":1}')
    const file = fileSystem.MockFile.instances.at(-1)
    expect(file?.exists).toBe(true)
    expect(file?.content).toBe('{"schemaVersion":1}')
  })

  it("reads the mirror file when storage is empty on native", async () => {
    ;(Platform as { OS: string }).OS = "android"
    mockGetItem.mockResolvedValueOnce(null)
    fileSystem.MockFile.defaultContent = "file-mirror"
    fileSystem.MockFile.defaultExists = true

    await expect(readAutoRestoreMirror()).resolves.toBe("file-mirror")
  })
})

describe("stored data detection", () => {
  it("returns true when at least one slice has data", async () => {
    mockMultiGet.mockResolvedValueOnce([
      [TRANSACTIONS_STORAGE_KEY, null],
      [BUDGETS_STORAGE_KEY, "{}"],
      [RECURRING_STORAGE_KEY, null],
      [SETTINGS_STORAGE_KEY, null],
    ])

    await expect(hasAnyStoredData()).resolves.toBe(true)
  })

  it("returns false when every slice is empty", async () => {
    mockMultiGet.mockResolvedValueOnce([
      [TRANSACTIONS_STORAGE_KEY, null],
      [BUDGETS_STORAGE_KEY, null],
      [RECURRING_STORAGE_KEY, null],
      [SETTINGS_STORAGE_KEY, null],
    ])

    await expect(hasAnyStoredData()).resolves.toBe(false)
  })
})

describe("restore", () => {
  it("persists all four data slices", async () => {
    await writeRestoredData(payload)

    const writtenKeys = mockSetItem.mock.calls.map((call) => call[0])
    expect(writtenKeys).toContain(TRANSACTIONS_STORAGE_KEY)
    expect(writtenKeys).toContain(BUDGETS_STORAGE_KEY)
    expect(writtenKeys).toContain(RECURRING_STORAGE_KEY)
    expect(writtenKeys).toContain(SETTINGS_STORAGE_KEY)
  })

  it("marks auto-restore once and reports it afterwards", async () => {
    mockGetItem.mockResolvedValueOnce(null)
    await expect(hasAutoRestoreMarker()).resolves.toBe(false)

    await markAutoRestored()

    expect(mockSetItem).toHaveBeenCalledWith(expect.stringContaining("autoRestored"), expect.any(String))
    mockGetItem.mockResolvedValueOnce("2026-08-01T00:00:00.000Z")
    await expect(hasAutoRestoreMarker()).resolves.toBe(true)
  })
})
