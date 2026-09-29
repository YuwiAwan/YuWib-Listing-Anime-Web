// Pemilih status untuk edit cepat di tabel My List.
import { useUpdateEntry, type ListEntryWithAnime } from './queries'
import { LIST_STATUSES, LIST_STATUS_META, type ListStatus } from './status'

export function StatusSelect({ entry }: { entry: ListEntryWithAnime }) {
  const update = useUpdateEntry()

  return (
    <select
      value={entry.status}
      onChange={(e) => update.mutate({ entry, changes: { status: e.target.value as ListStatus } })}
      aria-label="Status"
      className="h-7 rounded-md border border-slate-800 bg-slate-900 px-1.5 text-sm text-slate-100 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
    >
      {LIST_STATUSES.map((status) => (
        <option key={status} value={status}>
          {LIST_STATUS_META[status].label}
        </option>
      ))}
    </select>
  )
}
