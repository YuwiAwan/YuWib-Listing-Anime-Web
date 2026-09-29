// Tab status beserta jumlah anime di tiap status. Jumlahnya dihitung dari SELURUH entri
// (bukan hasil filter), supaya angkanya tidak berubah-ubah saat user mengetik di kotak cari.
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import type { ListEntryWithAnime } from './queries'
import { LIST_STATUSES, LIST_STATUS_META, type ListStatus } from './status'

type ListTabsProps = {
  entries: ListEntryWithAnime[]
  active: ListStatus
}

export function ListTabs({ entries, active }: ListTabsProps) {
  const counts = countByStatus(entries)

  return (
    // Di layar sempit tab digeser horizontal daripada dibuat menumpuk
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <nav className="flex w-max gap-1 border-b border-slate-800 md:w-full">
        {LIST_STATUSES.map((status) => {
          const meta = LIST_STATUS_META[status]
          const isActive = status === active
          return (
            <Link
              key={status}
              to="/list/$status"
              params={{ status: meta.slug }}
              // Filter & urutan sengaja direset saat pindah tab: filter tab lama jarang relevan di tab baru
              search={{}}
              className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-100',
              )}
            >
              {meta.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs tabular-nums',
                  isActive ? 'bg-blue-600/20 text-blue-300' : 'bg-slate-800 text-slate-400',
                )}
              >
                {counts[status]}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// Hitung jumlah entri per status dalam sekali jalan
function countByStatus(entries: ListEntryWithAnime[]): Record<ListStatus, number> {
  const counts = { watching: 0, completed: 0, on_hold: 0, dropped: 0, plan_to_watch: 0 }
  for (const entry of entries) counts[entry.status] += 1
  return counts
}
