// Aturan turunan saat entri list diubah. Fungsi MURNI, tanpa akses database — supaya hasilnya sama persis
// antara pembaruan optimis di layar dan yang dikirim ke server, dan supaya bisa diuji sendiri.
import type { ListEntry, ListEntryWithAnime } from './queries'

// Tanggal hari ini dalam format DATE Postgres (YYYY-MM-DD), memakai waktu lokal user
export function today() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

// Field yang bisa diubah user. EntryEditor di halaman detail memakai semuanya;
// tabel My List hanya memakai status/score/episodes_watched.
export type EntryChanges = Partial<
  Pick<
    ListEntry,
    'status' | 'score' | 'episodes_watched' | 'start_date' | 'finish_date' | 'rewatch_count' | 'is_favorite' | 'notes'
  >
>

export function buildEntryPatch(entry: ListEntryWithAnime, changes: EntryChanges): Partial<ListEntry> {
  const patch: Partial<ListEntry> = { ...changes }
  const total = entry.anime?.episodes ?? null
  const status = changes.status ?? entry.status
  const watched = changes.episodes_watched ?? entry.episodes_watched

  // Episode terakhir tercapai saat sedang menonton → otomatis tandai selesai
  if (total != null && watched >= total && status === 'watching') {
    patch.status = 'completed'
    patch.episodes_watched = total
  }

  // Ditandai selesai → progress dianggap penuh
  if (patch.status === 'completed' && total != null) patch.episodes_watched = total

  // Tanggal hanya diisi kalau belum pernah terisi — jangan menimpa catatan lama user
  const nextStatus = patch.status ?? status
  if (nextStatus === 'watching' && !entry.start_date) patch.start_date = today()
  if (nextStatus === 'completed' && !entry.finish_date) patch.finish_date = today()

  return patch
}
