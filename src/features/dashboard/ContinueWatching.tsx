// "Lanjut nonton": deretan anime berstatus watching dengan tombol +1 episode.
// Ini aksi yang paling sering dilakukan, jadi ditaruh paling atas dan cukup satu klik.
import { Link } from '@tanstack/react-router'
import { ImageOff } from 'lucide-react'
import { ProgressStepper } from '@/features/list/ProgressStepper'
import type { ListEntryWithAnime } from '@/features/list/queries'

export function ContinueWatching({ entries }: { entries: ListEntryWithAnime[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2">
          <Link to="/anime/$malId" params={{ malId: entry.anime.mal_id }} className="group flex gap-2">
            <span className="h-20 w-14 shrink-0 overflow-hidden rounded bg-slate-900 ring-1 ring-slate-800">
              {entry.anime.image_url ? (
                <img src={entry.anime.image_url} alt="" loading="lazy" className="size-full object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-slate-700">
                  <ImageOff className="size-4" />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-3 text-sm leading-snug font-medium text-slate-100 transition-colors group-hover:text-blue-300">
                {entry.anime.title}
              </span>
            </span>
          </Link>

          <ProgressBar watched={entry.episodes_watched} total={entry.anime.episodes} />
          <div className="flex justify-center">
            <ProgressStepper entry={entry} size="sm" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProgressBar({ watched, total }: { watched: number; total: number | null }) {
  // Anime yang masih tayang belum punya jumlah episode final — persentase tidak bisa dihitung
  if (!total) return null
  const percent = Math.min(100, Math.round((watched / total) * 100))
  return (
    <div className="h-1 overflow-hidden rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}
