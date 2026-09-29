// Hook React untuk membaca sesi auth secara reaktif — re-render otomatis saat login/logout.
import { useSyncExternalStore } from 'react'
import { getSession, subscribeSession } from './session'

// Sesi lengkap (token + user), atau null kalau belum login
export function useSession() {
  return useSyncExternalStore(subscribeSession, getSession, getSession)
}

// Shortcut: hanya objek user (id, email, dsb.)
export function useUser() {
  return useSession()?.user ?? null
}
