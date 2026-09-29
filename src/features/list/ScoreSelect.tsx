// Pemilih skor 1–10 (atau kosong). <select> native supaya ikut tema gelap lewat color-scheme: dark.
import { useUpdateEntry, type ListEntryWithAnime } from './queries'

export function ScoreSelect({ entry }: { entry: ListEntryWithAnime }) {
  const update = useUpdateEntry()

  return (
    <select
      value={entry.score ?? ''}
      onChange={(e) => update.mutate({ entry, changes: { score: e.target.value ? Number(e.target.value) : null } })}
      aria-label="Skor"
      className="h-7 rounded-md border border-slate-800 bg-slate-900 px-1.5 text-sm text-slate-100 tabular-nums outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
    >
      <option value="">—</option>
      {Array.from({ length: 10 }, (_, i) => 10 - i).map((score) => (
        <option key={score} value={score}>
          {score}
        </option>
      ))}
    </select>
  )
}
