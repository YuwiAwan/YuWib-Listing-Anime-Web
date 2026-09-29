// Store sesi auth di luar React. Dibutuhkan karena guard router (beforeLoad di _app.tsx)
// berjalan sebelum komponen apa pun di-render, jadi tidak bisa memakai hook.
// Komponen React membacanya lewat useSession() (useSyncExternalStore).
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type Listener = () => void

let currentSession: Session | null = null
const listeners = new Set<Listener>()

// Beri tahu semua subscriber (komponen) bahwa sesi berubah
function emit() {
  listeners.forEach((listener) => listener())
}

// Baca sesi awal dari localStorage (tempat supabase-js menyimpan token). Selesai dalam hitungan ms.
const initialLoad: Promise<void> = supabase.auth.getSession().then(({ data }) => {
  currentSession = data.session
  emit()
})

// Dengarkan login / logout / refresh token — termasuk yang terjadi di tab lain
supabase.auth.onAuthStateChange((_event, session) => {
  currentSession = session
  emit()
})

// Sesi saat ini (sinkron). Bisa null = belum login ATAU sesi awal belum selesai dibaca; pakai waitForSession() kalau perlu pasti.
export function getSession() {
  return currentSession
}

// Tunggu sesi awal selesai dibaca, lalu kembalikan sesinya. Dipakai guard router.
export async function waitForSession() {
  await initialLoad
  return currentSession
}

// Daftarkan listener; mengembalikan fungsi unsubscribe (bentuk yang diminta useSyncExternalStore)
export function subscribeSession(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
