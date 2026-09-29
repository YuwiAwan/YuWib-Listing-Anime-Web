// Perhitungan statistik My List. Fungsi MURNI tanpa akses database — datanya sudah ada di memori
// (listEntriesQueryOptions mengambil semua entri sekaligus), jadi tidak perlu query agregasi ke server.
import type { ListEntryWithAnime } from '@/features/list/queries'
import { LIST_STATUSES, type ListStatus } from '@/features/list/status'

const MINUTES_PER_DAY = 60 * 24

export type Summary = {
  totalAnime: number
  totalEpisodes: number
  days: number
  meanScore: number | null
  scoredCount: number
}

// Empat angka utama di baris atas halaman
export function summarize(entries: ListEntryWithAnime[]): Summary {
  let totalEpisodes = 0
  let totalMinutes = 0
  let scoreSum = 0
  let scoredCount = 0

  for (const entry of entries) {
    totalEpisodes += entry.episodes_watched
    // Durasi per episode tidak selalu diketahui; anggap 24 menit (rata-rata episode TV) supaya
    // angka "hari terpakai" tetap masuk akal alih-alih jadi terlalu kecil
    totalMinutes += entry.episodes_watched * (entry.anime.duration_min ?? 24)
    if (entry.score != null) {
      scoreSum += entry.score
      scoredCount += 1
    }
  }

  return {
    totalAnime: entries.length,
    totalEpisodes,
    days: totalMinutes / MINUTES_PER_DAY,
    meanScore: scoredCount > 0 ? scoreSum / scoredCount : null,
    scoredCount,
  }
}

// Jumlah anime per status. Urutannya sengaja completed → watching → on_hold → plan → dropped:
// urutan ini yang lolos uji pemisahan warna buta warna untuk bar bertumpuk (lihat statusChartColors).
export const STATUS_CHART_ORDER: ListStatus[] = ['completed', 'watching', 'on_hold', 'plan_to_watch', 'dropped']

export function countByStatus(entries: ListEntryWithAnime[]): { status: ListStatus; count: number }[] {
  const counts = Object.fromEntries(LIST_STATUSES.map((status) => [status, 0])) as Record<ListStatus, number>
  for (const entry of entries) counts[entry.status] += 1
  return STATUS_CHART_ORDER.map((status) => ({ status, count: counts[status] }))
}

// Sebaran skor 1–10. Selalu mengembalikan 10 batang walau sebagian bernilai 0,
// supaya sumbu tidak melompat-lompat saat skor baru ditambahkan.
export function scoreDistribution(entries: ListEntryWithAnime[]): { label: string; value: number }[] {
  const buckets = new Array(10).fill(0) as number[]
  for (const entry of entries) {
    if (entry.score != null) buckets[entry.score - 1] += 1
  }
  return buckets.map((value, index) => ({ label: String(index + 1), value }))
}

// Genre terbanyak. Satu anime menyumbang ke semua genrenya.
export function topGenres(entries: ListEntryWithAnime[], limit = 10): { label: string; value: number }[] {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    for (const genre of entry.anime.genres) counts.set(genre, (counts.get(genre) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

// Jumlah anime yang diselesaikan per bulan, 12 bulan terakhir.
// Sumbernya finish_date — entri lama tanpa tanggal (mis. hasil impor) otomatis terlewat.
export function completedPerMonth(
  entries: ListEntryWithAnime[],
  now = new Date(),
): { label: string; value: number; key: string }[] {
  const months: { label: string; value: number; key: string }[] = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('id-ID', { month: 'short' }),
      value: 0,
    })
  }

  const index = new Map(months.map((month, i) => [month.key, i]))
  for (const entry of entries) {
    if (!entry.finish_date) continue
    const position = index.get(entry.finish_date.slice(0, 7))
    if (position !== undefined) months[position].value += 1
  }
  return months
}
