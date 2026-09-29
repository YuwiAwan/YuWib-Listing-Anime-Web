// Tipe respons berskema Jikan v4 — hanya field yang dipakai YuWib.
// Skema ini diimplementasikan oleh DUA penyedia yang kita pakai (lihat src/features/anime/api.ts):
//   - Tenrai (https://api.tenrai.org/v1)  — primer
//   - Jikan  (https://api.jikan.moe/v4)   — cadangan
// Sudah dibandingkan field-per-field: keduanya identik, jadi satu set tipe cukup.
// Ditulis berdasarkan respons asli /anime/{id}; field yang bisa kosong di MAL ditandai `| null`.

export type JikanImage = {
  image_url: string
  small_image_url: string
  large_image_url: string
}

// Entitas bernama yang berulang di Jikan: genre, studio, tema, demografi
export type JikanNamed = {
  mal_id: number
  type: string
  name: string
  url: string
}

export type JikanSeason = 'winter' | 'spring' | 'summer' | 'fall'

export type JikanAnime = {
  mal_id: number
  url: string
  images: { jpg: JikanImage; webp: JikanImage }
  trailer: { youtube_id: string | null; url: string | null; embed_url: string | null }
  title: string
  title_english: string | null
  title_japanese: string | null
  type: string | null // "TV" | "Movie" | "OVA" | "ONA" | "Special" | "Music"
  source: string | null
  episodes: number | null // null = MAL belum tahu (biasanya anime yang masih tayang)
  status: string | null // "Finished Airing" | "Currently Airing" | "Not yet aired"
  airing: boolean
  aired: { from: string | null; to: string | null; string: string | null }
  duration: string | null // contoh: "24 min per ep", "1 hr 30 min"
  rating: string | null
  score: number | null
  scored_by: number | null
  rank: number | null
  popularity: number | null
  members: number | null
  favorites: number | null
  synopsis: string | null
  background: string | null
  season: JikanSeason | null
  year: number | null
  broadcast: { day: string | null; time: string | null; timezone: string | null; string: string | null }
  studios: JikanNamed[]
  genres: JikanNamed[]
  themes: JikanNamed[]
  demographics: JikanNamed[]
}

export type JikanPagination = {
  last_visible_page: number
  has_next_page: boolean
  current_page: number
  items: { count: number; total: number; per_page: number }
}

// Respons endpoint daftar (search, seasonal): data[] + pagination
export type JikanListResponse<T> = { data: T[]; pagination: JikanPagination }

// Respons endpoint tunggal (/anime/{id})
export type JikanResponse<T> = { data: T }

// ---------------------------------------------------------------------------
// Tipe endpoint tambahan halaman detail: /anime/{id}/relations, /characters, /recommendations
// ---------------------------------------------------------------------------

// Entri yang ditunjuk sebuah relasi. `type` membedakan anime dan manga —
// penting karena hanya entri anime yang punya halaman di YuWib.
export type JikanRelationEntry = {
  mal_id: number
  type: 'anime' | 'manga'
  name: string
  url: string
}

// Satu kelompok relasi, mis. { relation: "Sequel", entry: [...] }
export type JikanRelation = {
  relation: string
  entry: JikanRelationEntry[]
}

export type JikanCharacterEntry = {
  character: {
    mal_id: number
    name: string
    images: { jpg: { image_url: string }; webp?: { image_url: string } }
    url: string
  }
  role: string // "Main" | "Supporting"
  favorites: number
  voice_actors: {
    language: string
    person: { mal_id: number; name: string; images: { jpg: { image_url: string } } }
  }[]
}

export type JikanRecommendation = {
  entry: {
    mal_id: number
    title: string
    images: { jpg: { image_url: string; large_image_url: string } }
    url: string
  }
  votes: number
}
