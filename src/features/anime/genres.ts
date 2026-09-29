// Helper genre: daftar pilihan cepat, genre yang disembunyikan, dan konversi ke/dari search param URL.
// Daftar genre lengkapnya diambil dari API (lihat genresQueryOptions) — file ini hanya mengatur penyajiannya.

// Genre dewasa. Selama preferensi "tampilkan konten dewasa" mati, request memakai sfw=true dan
// kedua genre ini selalu mengembalikan 0 hasil (sudah diuji) — chip-nya disembunyikan supaya
// tidak ada tombol yang tidak pernah memberi hasil. Saat preferensi menyala, keduanya ditampilkan.
const ADULT_GENRE_IDS = new Set([12, 49]) // Hentai, Erotica

// Pilihan cepat yang ditampilkan lebih dulu. Dikurasi manual: yang biasa dipakai orang menjelajah,
// bukan sekadar yang jumlah animenya terbanyak (Kids & Music menang jumlah tapi jarang dicari).
export const FEATURED_GENRE_IDS = [
  1, // Action
  2, // Adventure
  4, // Comedy
  8, // Drama
  10, // Fantasy
  24, // Sci-Fi
  22, // Romance
  36, // Slice of Life
  7, // Mystery
  37, // Supernatural
  30, // Sports
  18, // Mecha
  14, // Horror
  40, // Psychological
  62, // Isekai
  19, // Music
]

export type Genre = { mal_id: number; name: string; count: number }

// Buang genre yang tidak akan memberi hasil dengan preferensi saat ini
export function usableGenres(genres: Genre[], showNsfw = false): Genre[] {
  return showNsfw ? genres : genres.filter((genre) => !ADULT_GENRE_IDS.has(genre.mal_id))
}

// Pisahkan menjadi pilihan cepat (urut sesuai FEATURED_GENRE_IDS) dan sisanya (urut abjad)
export function splitGenres(genres: Genre[], showNsfw = false) {
  const usable = usableGenres(genres, showNsfw)
  const byId = new Map(usable.map((genre) => [genre.mal_id, genre]))
  const featured = FEATURED_GENRE_IDS.map((id) => byId.get(id)).filter((genre) => genre !== undefined)
  const featuredIds = new Set(FEATURED_GENRE_IDS)
  const rest = usable.filter((genre) => !featuredIds.has(genre.mal_id)).sort((a, b) => a.name.localeCompare(b.name))
  return { featured, rest }
}

// URL ditulis "?genres=1,10" (bukan JSON) supaya tetap enak dibaca dan diketik manual
export function parseGenreParam(value: string | undefined): number[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => Number(part))
    .filter((id) => Number.isInteger(id) && id > 0)
}

export function formatGenreParam(ids: number[]): string | undefined {
  return ids.length > 0 ? ids.join(',') : undefined
}
