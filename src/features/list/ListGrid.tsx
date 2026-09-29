// Tampilan grid My List: memakai AnimeCard yang SAMA dengan halaman Browse, ditambah baris progress
// di bawahnya. Inilah gunanya menyeragamkan bentuk data ke AnimeSnapshot — kartunya tidak perlu diubah.
import { AnimeCard } from '@/features/anime/AnimeCard'
import { ProgressStepper } from './ProgressStepper'
import type { ListEntryWithAnime } from './queries'

export function ListGrid({ entries }: { entries: ListEntryWithAnime[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2">
          <AnimeCard anime={entry.anime} />
          <div className="flex items-center justify-between gap-2">
            <ProgressStepper entry={entry} size="sm" />
            {entry.score != null && (
              <span className="text-xs font-medium text-blue-300 tabular-nums">{entry.score}/10</span>
            )}
          </div>
          {/* Bar progress tipis sebagai gambaran cepat seberapa jauh tontonan */}
          <ProgressBar watched={entry.episodes_watched} total={entry.anime.episodes} />
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ watched, total }: { watched: number; total: number | null }) {
  // Tanpa jumlah episode (anime masih tayang) persentase tidak bisa dihitung — bar disembunyikan
  if (!total) return null
  const percent = Math.min(100, Math.round((watched / total) * 100))
  return (
    <div className="h-1 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}
