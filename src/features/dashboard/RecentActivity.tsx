// "Aktivitas terbaru": sepuluh entri yang terakhir diubah.
// YuWib tidak menyimpan riwayat perubahan, jadi yang ditampilkan adalah keadaan SEKARANG
// beserta kapan terakhir disentuh — bukan "apa yang berubah".
import { Link } from '@tanstack/react-router'
import { StatusBadge } from '@/features/list/StatusBadge'
import type { ListEntryWithAnime } from '@/features/list/queries'

export function RecentActivity({ entries }: { entries: ListEntryWithAnime[] }) {
  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            to="/anime/$malId"
            params={{ malId: entry.anime.mal_id }}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-900"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{entry.anime.title}</span>
            <span className="shrink-0 text-xs text-slate-500 tabular-nums">
              {entry.episodes_watched}
              {entry.anime.episodes ? `/${entry.anime.episodes}` : ''}
            </span>
            <StatusBadge status={entry.status} />
            <span className="hidden shrink-0 text-xs text-slate-600 sm:block">{relativeTime(entry.updated_at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Waktu relatif singkat ("3 jam lalu"). Intl.RelativeTimeFormat sudah ada di browser, tanpa pustaka tambahan.
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const formatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 365 * 24 * 60 * 60 * 1000],
    ['month', 30 * 24 * 60 * 60 * 1000],
    ['day', 24 * 60 * 60 * 1000],
    ['hour', 60 * 60 * 1000],
    ['minute', 60 * 1000],
  ]
  for (const [unit, ms] of units) {
    if (diffMs >= ms) return formatter.format(-Math.floor(diffMs / ms), unit)
  }
  return 'baru saja'
}
