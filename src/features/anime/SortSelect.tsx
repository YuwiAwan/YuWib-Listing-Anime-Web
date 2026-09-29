// Pemilih urutan hasil untuk mode filter (pencarian/genre). <select> native supaya ikut tema gelap
// lewat color-scheme: dark, tanpa menambah komponen.
import { SORT_LABELS, SORT_VALUES, type SortOption } from './queries'

type SortSelectProps = {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      aria-label="Urutkan"
      className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
    >
      {SORT_VALUES.map((option) => (
        <option key={option} value={option}>
          {SORT_LABELS[option]}
        </option>
      ))}
    </select>
  )
}
