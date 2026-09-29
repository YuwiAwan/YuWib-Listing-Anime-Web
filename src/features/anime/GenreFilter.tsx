// Filter genre berupa chip yang bisa dipilih lebih dari satu (AND: hasil harus punya semua genre terpilih).
// Menampilkan 16 genre pilihan lebih dulu; sisanya muncul setelah menekan "Lihat semua".
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { genresQueryOptions } from './queries'
import { splitGenres, type Genre } from './genres'

type GenreFilterProps = {
  selected: number[]
  onChange: (ids: number[]) => void
  // Genre dewasa hanya ikut ditampilkan kalau preferensi akun menyalakannya
  showNsfw?: boolean
}

export function GenreFilter({ selected, onChange, showNsfw = false }: GenreFilterProps) {
  const { data, isPending, isError } = useQuery(genresQueryOptions())
  const [showAll, setShowAll] = useState(false)

  // Daftar genre gagal dimuat bukan alasan merusak halaman — cukup sembunyikan filternya
  if (isError) return null

  if (isPending) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-slate-800" />
        ))}
      </div>
    )
  }

  const { featured, rest } = splitGenres(data, showNsfw)
  const visible = showAll ? [...featured, ...rest] : featured
  const selectedSet = new Set(selected)

  // Klik chip: tambah kalau belum terpilih, buang kalau sudah
  function toggle(id: number) {
    onChange(selectedSet.has(id) ? selected.filter((item) => item !== id) : [...selected, id])
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {visible.map((genre) => (
          <GenreChip key={genre.mal_id} genre={genre} active={selectedSet.has(genre.mal_id)} onClick={() => toggle(genre.mal_id)} />
        ))}

        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-blue-400"
        >
          {showAll ? (
            <>
              Ringkas <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Lihat semua ({rest.length}) <ChevronDown className="size-3" />
            </>
          )}
        </button>
      </div>

      {/* Ringkasan pilihan + tombol reset, hanya muncul kalau ada genre terpilih */}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="inline-flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-rose-400"
        >
          <X className="size-3" />
          Hapus {selected.length} filter genre
        </button>
      )}
    </div>
  )
}

// Satu chip genre. Aktif = biru penuh; tidak aktif = garis tepi slate.
function GenreChip({ genre, active, onClick }: { genre: Genre; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={`${genre.count.toLocaleString('id-ID')} anime`}
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'bg-blue-600 text-slate-50 hover:bg-blue-500'
          : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-800 hover:text-blue-300',
      )}
    >
      {genre.name}
    </button>
  )
}
