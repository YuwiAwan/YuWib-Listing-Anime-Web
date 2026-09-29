// "Tayang minggu ini": anime di list yang masih on-air, dikelompokkan per hari tayang.
// Datanya dari kolom broadcast_day di snapshot, jadi bagian ini tidak memanggil API sama sekali.
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import type { ListEntryWithAnime } from '@/features/list/queries'
import { broadcastDayIndex, broadcastDayLabel, todayIndex } from './broadcast'

export function AiringThisWeek({ entries }: { entries: ListEntryWithAnime[] }) {
  const today = todayIndex()

  // Kelompokkan per hari, urutannya sudah benar karena entri masuk dalam keadaan terurut
  const groups = new Map<number, ListEntryWithAnime[]>()
  for (const entry of entries) {
    const index = broadcastDayIndex(entry.anime.broadcast_day)
    const list = groups.get(index) ?? []
    list.push(entry)
    groups.set(index, list)
  }

  return (
    <ul className="space-y-3">
      {[...groups.entries()].map(([dayIndex, dayEntries]) => (
        <li key={dayIndex}>
          <p className={cn('text-xs font-medium', dayIndex === today ? 'text-blue-400' : 'text-slate-500')}>
            {broadcastDayLabel(dayEntries[0].anime.broadcast_day)}
            {dayIndex === today && ' · hari ini'}
          </p>
          <ul className="mt-1 space-y-1">
            {dayEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  to="/anime/$malId"
                  params={{ malId: entry.anime.mal_id }}
                  className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1 text-sm transition-colors hover:bg-slate-900"
                >
                  <span className="truncate text-slate-200">{entry.anime.title}</span>
                  <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                    ep {entry.episodes_watched}
                    {entry.anime.broadcast_time && ` · ${entry.anime.broadcast_time} JST`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}
