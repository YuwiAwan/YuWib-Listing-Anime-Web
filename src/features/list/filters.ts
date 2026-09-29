// Penyaringan dan pengurutan My List, dikerjakan di BROWSER, bukan di database.
// Alasannya: seluruh entri sudah diambil sekali (lihat listEntriesQueryOptions), jadi filter terasa
// seketika tanpa request bolak-balik. Kalau suatu saat list mencapai ribuan baris, pindahkan ke query SQL.
import type { ListEntryWithAnime } from './queries'

export const LIST_SORTS = ['updated', 'title', 'score', 'progress', 'started'] as const
export type ListSort = (typeof LIST_SORTS)[number]

export const LIST_SORT_LABELS: Record<ListSort, string> = {
  updated: 'Terakhir diubah',
  title: 'Judul',
  score: 'Skor saya',
  progress: 'Progress',
  started: 'Tanggal mulai',
}

export type ListFilters = {
  q?: string
  genre?: string
  type?: string
  year?: number
  sort: ListSort
  order: 'asc' | 'desc'
}

// Cocokkan kata kunci ke judul romaji maupun judul Inggris
function matchesQuery(entry: ListEntryWithAnime, q: string) {
  const needle = q.toLowerCase()
  const anime = entry.anime
  return (
    anime.title.toLowerCase().includes(needle) || (anime.title_english?.toLowerCase().includes(needle) ?? false)
  )
}

// Ambil nilai yang dipakai untuk mengurutkan. null selalu ditaruh di belakang (lihat compare di bawah).
function sortValue(entry: ListEntryWithAnime, sort: ListSort): string | number | null {
  if (sort === 'title') return entry.anime.title.toLowerCase()
  if (sort === 'score') return entry.score
  if (sort === 'started') return entry.start_date
  if (sort === 'progress') {
    const total = entry.anime.episodes
    // Tanpa jumlah episode, persentase tidak bisa dihitung — urutkan pakai jumlah episode yang ditonton
    return total ? entry.episodes_watched / total : entry.episodes_watched
  }
  return entry.updated_at
}

export function applyListFilters(entries: ListEntryWithAnime[], filters: ListFilters): ListEntryWithAnime[] {
  const { q, genre, type, year, sort, order } = filters

  const filtered = entries.filter((entry) => {
    if (q && !matchesQuery(entry, q)) return false
    if (genre && !entry.anime.genres.includes(genre)) return false
    if (type && entry.anime.type !== type) return false
    if (year && entry.anime.year !== year) return false
    return true
  })

  const direction = order === 'asc' ? 1 : -1
  return filtered.sort((a, b) => {
    const left = sortValue(a, sort)
    const right = sortValue(b, sort)
    // Entri tanpa nilai (belum diberi skor / belum ada tanggal) selalu di bawah, apa pun arah urutannya
    if (left == null && right == null) return 0
    if (left == null) return 1
    if (right == null) return -1
    if (left === right) return 0
    return left < right ? -direction : direction
  })
}

// Kumpulkan pilihan filter dari data yang ADA di list — tidak perlu daftar genre/tahun dari API,
// dan pilihannya otomatis menyusut mengikuti isi list.
export function collectFilterOptions(entries: ListEntryWithAnime[]) {
  const genres = new Set<string>()
  const types = new Set<string>()
  const years = new Set<number>()

  for (const entry of entries) {
    entry.anime.genres.forEach((genre) => genres.add(genre))
    if (entry.anime.type) types.add(entry.anime.type)
    if (entry.anime.year) years.add(entry.anime.year)
  }

  return {
    genres: [...genres].sort((a, b) => a.localeCompare(b)),
    types: [...types].sort((a, b) => a.localeCompare(b)),
    years: [...years].sort((a, b) => b - a),
  }
}
