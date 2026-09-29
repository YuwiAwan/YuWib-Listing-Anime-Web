// Baris kontrol My List: cari dalam list, filter (genre/tipe/tahun), urutan + arah, dan pilihan tampilan.
// Semua nilainya datang dari URL dan dikembalikan lewat onChange — halaman yang menuliskannya ke URL.
import { LayoutGrid, List as ListIcon, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LIST_SORTS, LIST_SORT_LABELS, type ListFilters, type ListSort } from './filters'

export type ListView = 'grid' | 'table'

type ListToolbarProps = {
  filters: ListFilters
  options: { genres: string[]; types: string[]; years: number[] }
  view: ListView
  onFiltersChange: (changes: Partial<ListFilters>) => void
  onViewChange: (view: ListView) => void
  onReset: () => void
}

export function ListToolbar({ filters, options, view, onFiltersChange, onViewChange, onReset }: ListToolbarProps) {
  // Apakah ada filter aktif? menentukan munculnya tombol reset
  const hasFilters = Boolean(filters.q || filters.genre || filters.type || filters.year)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Cari dalam list — tanpa debounce karena penyaringannya di browser, tidak ada request */}
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={filters.q ?? ''}
          onChange={(e) => onFiltersChange({ q: e.target.value || undefined })}
          placeholder="Cari di list ini…"
          className="h-9 w-full rounded-lg border border-slate-800 bg-slate-900 pr-3 pl-9 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
        />
      </div>

      <Dropdown value={filters.genre ?? ''} onChange={(v) => onFiltersChange({ genre: v || undefined })} label="Genre">
        {options.genres.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </Dropdown>

      <Dropdown value={filters.type ?? ''} onChange={(v) => onFiltersChange({ type: v || undefined })} label="Tipe">
        {options.types.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </Dropdown>

      <Dropdown
        value={filters.year ? String(filters.year) : ''}
        onChange={(v) => onFiltersChange({ year: v ? Number(v) : undefined })}
        label="Tahun"
      >
        {options.years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </Dropdown>

      <select
        value={filters.sort}
        onChange={(e) => onFiltersChange({ sort: e.target.value as ListSort })}
        aria-label="Urutkan"
        className={SELECT}
      >
        {LIST_SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {LIST_SORT_LABELS[sort]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onFiltersChange({ order: filters.order === 'asc' ? 'desc' : 'asc' })}
        title={filters.order === 'asc' ? 'Naik (A→Z, kecil→besar)' : 'Turun (Z→A, besar→kecil)'}
        className={cn(SELECT, 'px-2.5 tabular-nums')}
      >
        {filters.order === 'asc' ? '↑' : '↓'}
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs text-slate-400 transition-colors hover:text-rose-400"
        >
          <X className="size-3" />
          Reset
        </button>
      )}

      {/* Pilihan tampilan: grid poster atau tabel padat */}
      <div className="ml-auto inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5">
        <ViewButton active={view === 'grid'} onClick={() => onViewChange('grid')} label="Tampilan grid">
          <LayoutGrid className="size-4" />
        </ViewButton>
        <ViewButton active={view === 'table'} onClick={() => onViewChange('table')} label="Tampilan tabel">
          <ListIcon className="size-4" />
        </ViewButton>
      </div>
    </div>
  )
}

const SELECT =
  'h-9 rounded-lg border border-slate-800 bg-slate-900 px-2 text-sm text-slate-100 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50'

// <select> dengan opsi kosong "semua" di paling atas
function Dropdown({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={SELECT}>
      <option value="">{label}: semua</option>
      {children}
    </select>
  )
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'rounded-md p-1.5 transition-colors',
        active ? 'bg-blue-600 text-slate-50' : 'text-slate-400 hover:text-slate-100',
      )}
    >
      {children}
    </button>
  )
}
