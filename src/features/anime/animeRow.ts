// Snapshot anime: bentuk data yang DISIMPAN di tabel `anime` Supabase.
// Dipakai sebagai "mata uang bersama" di seluruh app — AnimeCard, grid, dan tombol tambah-ke-list
// semuanya menerima bentuk ini, sehingga komponen yang sama bisa menampilkan data dari API
// (halaman Browse) maupun dari database (halaman My List & Dashboard) tanpa konversi tambahan.
import type { Database } from '@/types/database.types'
import type { JikanAnime } from '@/types/jikan.types'

export type AnimeSnapshot = Database['public']['Tables']['anime']['Insert']

// API memberi durasi sebagai teks bebas: "24 min per ep", "1 hr 30 min", "23 min", "Unknown".
// Halaman Stats butuh angka menit untuk menghitung total waktu tonton, jadi diurai saat snapshot dibuat.
export function parseDurationMinutes(duration: string | null): number | null {
  if (!duration) return null
  const hours = duration.match(/(\d+)\s*hr/)
  const minutes = duration.match(/(\d+)\s*min/)
  const total = (hours ? Number(hours[1]) * 60 : 0) + (minutes ? Number(minutes[1]) : 0)
  return total > 0 ? total : null
}

// Objek dari API (Tenrai/Jikan) → baris tabel `anime`.
// Hanya field yang benar-benar dipakai UI yang disimpan; sisanya tetap diambil dari API saat halaman detail dibuka.
export function jikanToSnapshot(anime: JikanAnime): AnimeSnapshot {
  return {
    mal_id: anime.mal_id,
    title: anime.title,
    title_english: anime.title_english,
    // large_image_url (±225×318) cukup untuk kartu; fallback ke ukuran standar kalau kosong
    image_url: anime.images.jpg.large_image_url ?? anime.images.jpg.image_url ?? null,
    type: anime.type,
    episodes: anime.episodes,
    duration_min: parseDurationMinutes(anime.duration),
    airing_status: anime.status,
    // Jadwal tayang mingguan; dipakai bagian "Tayang minggu ini" di Dashboard tanpa memanggil API lagi
    broadcast_day: anime.broadcast.day,
    broadcast_time: anime.broadcast.time,
    season: anime.season,
    year: anime.year,
    genres: anime.genres.map((genre) => genre.name),
    mal_score: anime.score,
  }
}
