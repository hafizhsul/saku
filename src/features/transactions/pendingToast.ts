import { useSyncExternalStore } from "react"

import type { ToastData } from "../../components/ToastBanner"

// Toast satu-kali lintas layar: form tambah transaksi menyimpan lalu langsung
// kembali ke Home; Home menampilkan ToastBanner dari store ini.
// Store module-level (bukan state komponen) agar selamat dari remount Home
// saat navigasi replace/back — state komponen bisa hilang bila instance lama
// unmount sebelum instance baru baca pending.
let pending: ToastData | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): ToastData | null {
  return pending
}

export function setPendingToast(toast: ToastData): void {
  pending = toast
  notify()
}

export function clearPendingToast(): void {
  if (pending !== null) {
    pending = null
    notify()
  }
}

export function usePendingToast(): ToastData | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
