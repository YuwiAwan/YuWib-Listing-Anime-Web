// queryOptions untuk semua data anime eksternal. Semua queryKey diawali ANIME_API_KEY supaya otomatis
// mendapat staleTime 24 jam + dipersist ke IndexedDB (lihat src/lib/queryClient.ts).
// Host mana yang melayani (Tenrai/Jikan) diurus apiFetch — queryKey sengaja tidak menyebut host,
// supaya cache tetap terpakai walau sumbernya berpindah.
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { ANIME_API_KEY } from '@/lib/queryClient'
import type {
  JikanAnime,
  JikanCharacterEntry,
  JikanListResponse,
  JikanRecommendation,
  JikanRelation,
  JikanResponse,
} from '@/types/jikan.types'
import { apiFetch } from './api'
import type { Genre } from './genres'
import type { Season } from './season'

const PAGE_SIZE = 24 // maksimum penyedia 25; 24 habis dibagi 2/3/4/6 kolom grid

// Urutan hasil pada mode filter (pencarian / genre).
// SORT_VALUES dipisah supaya bisa langsung dipakai z.enum() di validateSearch tanpa kehilangan tipe literal.
export const SORT_VALUES = ['score', 'members', 'newest'] as const
export type SortOption = (typeof SORT_VALUES)[number]

export const SORT_LABELS: Record<SortOption, string> = {
  score: 'Skor tertinggi',
  members: 'Terpopuler',
  newest: 'Terbaru',
}

// Terjemahkan pilihan urutan menjadi parameter API.
// Catatan: 'members' dipakai untuk "terpopuler" — BUKAN 'popularity', karena anime tanpa peringkat
// bernilai 0 di field itu dan justru muncul paling atas.
// 'newest' memakai end_date = hari ini untuk menyaring anime yang belum tayang (start_date desc saja
// akan memunculkan pengumuman tahun 2028); konsekuensinya anime yang masih tayang ikut tersaring.
function sortParams(sort: SortOption): Record<string, string> {
  if (sort === 'members') return { order_by: 'members', sort: 'desc' }
  if (sort === 'newest') {
    return { order_by: 'start_date', sort: 'desc', end_date: new Date().toISOString().slice(0, 10) }
  }
  return { order_by: 'score', sort: 'desc' }
}

// Argumen halaman /browse. Kombinasinya menentukan endpoint mana yang dipakai.
export type BrowseArgs = {
  q?: string
  genreIds?: number[]
  sort?: SortOption
  page?: number
  year: number
  season: Season
  // Preferensi per akun (profiles.show_nsfw). Default false: anonim dan user baru selalu tersaring.
  showNsfw?: boolean
}

// Tentukan endpoint + parameter dari kombinasi filter.
// Ada kata kunci ATAU genre  → /anime  (keduanya bisa dipakai bersamaan)
// Tidak ada keduanya         → /seasons/{year}/{season}
function buildBrowseRequest({ q, genreIds = [], sort = 'score', page = 1, year, season, showNsfw = false }: BrowseArgs) {
  // sfw=true menyaring konten dewasa di sisi API. Nilainya ikut masuk queryKey lewat objek params,
  // jadi menyalakan/mematikan preferensi otomatis memakai cache terpisah — hasil lama tidak terpakai ulang.
  const params: Record<string, string | number | boolean> = { page, limit: PAGE_SIZE, sfw: !showNsfw }

  if (!q && genreIds.length === 0) {
    return { path: `/seasons/${year}/${season}`, params }
  }

  Object.assign(params, sortParams(sort))
  if (q) params.q = q
  if (genreIds.length > 0) params.genres = genreIds.join(',')
  return { path: '/anime', params }
}

// Satu queryOptions untuk seluruh mode halaman /browse, supaya bentuk queryKey-nya seragam
// (dua queryOptions dengan bentuk key berbeda tidak bisa digabung dalam satu pemanggilan useQuery).
export function browseQueryOptions(args: BrowseArgs) {
  const { path, params } = buildBrowseRequest(args)
  return queryOptions({
    // path + params ikut jadi key: tiap kombinasi filter punya cache sendiri, dan cache 'newest'
    // otomatis berganti saat tanggalnya berganti
    queryKey: [ANIME_API_KEY, 'browse', path, params],
    queryFn: ({ signal }) => apiFetch<JikanListResponse<JikanAnime>>(path, params, signal),
    // hasil lama tetap tampil saat filter/halaman berganti (tidak berkedip)
    placeholderData: keepPreviousData,
  })
}

// Daftar anime satu musim — dipakai juga oleh Dashboard (Urutan Build ke-7), bukan cuma /browse
export function seasonQueryOptions(year: number, season: Season, page = 1, showNsfw = false) {
  return browseQueryOptions({ year, season, page, showNsfw })
}

// Daftar semua genre beserta jumlah animenya. Jarang berubah, jadi cache 24 jam sudah pas.
export function genresQueryOptions() {
  return queryOptions({
    queryKey: [ANIME_API_KEY, 'genres'],
    queryFn: ({ signal }) => apiFetch<JikanResponse<Genre[]>>('/genres/anime', {}, signal),
    select: (res) => res.data,
  })
}

// Detail satu anime — dipakai halaman /anime/$malId
export function animeQueryOptions(malId: number) {
  return queryOptions({
    queryKey: [ANIME_API_KEY, 'anime', malId],
    queryFn: ({ signal }) => apiFetch<JikanResponse<JikanAnime>>(`/anime/${malId}`, {}, signal),
    select: (res) => res.data,
  })
}

// Relasi (prequel, sequel, side story, adaptasi). Penting untuk tracker: dari sini user melompat
// ke musim berikutnya tanpa harus mencari ulang.
export function animeRelationsQueryOptions(malId: number) {
  return queryOptions({
    queryKey: [ANIME_API_KEY, 'anime', malId, 'relations'],
    queryFn: ({ signal }) => apiFetch<JikanResponse<JikanRelation[]>>(`/anime/${malId}/relations`, {}, signal),
    select: (res) => res.data,
  })
}

// Karakter + pengisi suara. Responsnya besar (60+ entri), jadi query ini sengaja baru dijalankan
// saat tab Karakter dibuka (lihat `enabled` di komponennya), bukan saat halaman dimuat.
export function animeCharactersQueryOptions(malId: number) {
  return queryOptions({
    queryKey: [ANIME_API_KEY, 'anime', malId, 'characters'],
    queryFn: ({ signal }) => apiFetch<JikanResponse<JikanCharacterEntry[]>>(`/anime/${malId}/characters`, {}, signal),
    select: (res) => res.data,
  })
}

// Rekomendasi dari komunitas MAL — juga dimuat saat tabnya dibuka
export function animeRecommendationsQueryOptions(malId: number) {
  return queryOptions({
    queryKey: [ANIME_API_KEY, 'anime', malId, 'recommendations'],
    queryFn: ({ signal }) =>
      apiFetch<JikanResponse<JikanRecommendation[]>>(`/anime/${malId}/recommendations`, {}, signal),
    select: (res) => res.data,
  })
}
