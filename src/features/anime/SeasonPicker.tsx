// Pemilih musim: dropdown tahun + 4 tombol musim (segmented control) dengan aksen biru untuk yang aktif.
import { cn } from '@/lib/utils'
import { SEASON_LABEL, SEASONS, yearOptions, type Season } from './season'

type SeasonPickerProps = {
  year: number
  season: Season
  onChange: (next: { year: number; season: Season }) => void
}

export function SeasonPicker({ year, season, onChange }: SeasonPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* <select> native: mengikuti color-scheme: dark, jadi dropdown-nya ikut gelap tanpa komponen tambahan */}
      <select
        value={year}
        onChange={(e) => onChange({ year: Number(e.target.value), season })}
        aria-label="Tahun"
        className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
      >
        {yearOptions().map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
        {SEASONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ year, season: s })}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              s === season ? 'bg-blue-600 text-slate-50' : 'text-slate-400 hover:text-slate-100',
            )}
          >
            {SEASON_LABEL[s]}
          </button>
        ))}
      </div>
    </div>
  )
}
