// Pemetaan respons API anime (skema Jikan v4, dipakai Tenrai maupun Jikan) → baris tabel `anime`.
//
// HARUS SAMA dengan src/features/anime/animeRow.ts. Kode ini sengaja diduplikasi: Edge Function
// berjalan di Deno dan tidak bisa mengimpor file src/ yang memakai alias "@/". Kesamaan keduanya
// sudah diuji (lihat catatan pengujian di docs/PLAN.md). Kalau mengubah salah satu, ubah juga yang lain.

// Hanya field yang dibaca pemetaan ini
export type ApiAnime = {
  mal_id: number
  title: string
  title_english: string | null
  images: { jpg: { image_url: string | null; large_image_url: string | null } }
  type: string | null
  episodes: number | null
  duration: string | null
  status: string | null
  broadcast: { day: string | null; time: string | null }
  season: string | null
  year: number | null
  genres: { name: string }[]
  score: number | null
}

// "24 min per ep" → 24, "1 hr 30 min" → 90, "Unknown" → null
export function parseDurationMinutes(duration: string | null): number | null {
  if (!duration) return null
  const hours = duration.match(/(\d+)\s*hr/)
  const minutes = duration.match(/(\d+)\s*min/)
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0)
  return total > 0 ? total : null
}

export function toSnapshot(anime: ApiAnime) {
  return {
    mal_id: anime.mal_id,
    title: anime.title,
    title_english: anime.title_english,
    image_url: anime.images.jpg.large_image_url ?? anime.images.jpg.image_url ?? null,
    type: anime.type,
    episodes: anime.episodes,
    duration_min: parseDurationMinutes(anime.duration),
    airing_status: anime.status,
    broadcast_day: anime.broadcast.day,
    broadcast_time: anime.broadcast.time,
    season: anime.season,
    year: anime.year,
    genres: anime.genres.map((genre) => genre.name),
    mal_score: anime.score,
  }
}
