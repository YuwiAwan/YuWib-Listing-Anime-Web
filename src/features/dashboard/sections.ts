// Pemilihan data untuk tiap bagian Dashboard. Fungsi MURNI — semuanya bekerja di atas entri
// yang sudah diambil listEntriesQueryOptions, jadi Dashboard tidak menambah satu pun query database.
import type { ListEntryWithAnime } from '@/features/list/queries'
import { broadcastDayIndex } from './broadcast'

// Anime yang sedang ditonton, yang terakhir disentuh lebih dulu — inilah yang biasanya ingin dilanjutkan
export function continueWatching(entries: ListEntryWithAnime[], limit = 8) {
  return entries
    .filter((entry) => entry.status === 'watching')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit)
}

// Anime di list yang masih tayang, diurut hari tayang (Senin → Minggu, tak terjadwal paling akhir).
// Sumber hari tayangnya kolom broadcast_day di snapshot, bukan panggilan API.
export function airingThisWeek(entries: ListEntryWithAnime[]) {
  return entries
    .filter((entry) => entry.anime.airing_status === 'Currently Airing' && entry.status !== 'dropped')
    .sort((a, b) => {
      const dayDiff = broadcastDayIndex(a.anime.broadcast_day) - broadcastDayIndex(b.anime.broadcast_day)
      return dayDiff !== 0 ? dayDiff : a.anime.title.localeCompare(b.anime.title)
    })
}

// Sepuluh entri yang terakhir diubah. YuWib tidak menyimpan riwayat perubahan,
// jadi yang bisa ditampilkan adalah keadaan sekarang + kapan terakhir disentuh.
export function recentActivity(entries: ListEntryWithAnime[], limit = 10) {
  return [...entries].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, limit)
}

// Satu anime acak dari plan-to-watch. `seed` dibuat pemanggil supaya pilihannya tidak berubah
// setiap kali komponen dirender ulang — hanya berubah saat tombol "acak lagi" ditekan.
export function randomPlanToWatch(entries: ListEntryWithAnime[], seed: number): ListEntryWithAnime | null {
  const planned = entries.filter((entry) => entry.status === 'plan_to_watch')
  if (planned.length === 0) return null
  return planned[seed % planned.length]
}
