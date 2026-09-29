// Navigasi halaman: tombol sebelumnya/berikutnya, nomor halaman (1 … 5 [6] 7 … 42), dan kotak
// "ke halaman" untuk melompat langsung. Nomor yang ditampilkan dihitung paginationRange.ts.
import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paginationRange } from './paginationRange'

type PaginationProps = {
  page: number
  lastPage: number
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, hasNext, onPageChange }: PaginationProps) {
  if (lastPage <= 1 && !hasNext) return null

  const items = paginationRange(page, lastPage)

  return (
    <nav aria-label="Navigasi halaman" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(page - 1)} disabled={page <= 1} label="Halaman sebelumnya">
          <ChevronLeft className="size-4" />
        </PageButton>

        {items.map((item) =>
          typeof item === 'number' ? (
            <PageButton
              key={item}
              onClick={() => onPageChange(item)}
              active={item === page}
              label={`Halaman ${item}`}
            >
              {item}
            </PageButton>
          ) : (
            // "…" hanya penanda, bukan tombol — untuk melompat ke halaman tersembunyi pakai kotak di kanan
            <span key={item} className="w-6 text-center text-sm text-slate-600" aria-hidden>
              …
            </span>
          ),
        )}

        <PageButton onClick={() => onPageChange(page + 1)} disabled={!hasNext} label="Halaman berikutnya">
          <ChevronRight className="size-4" />
        </PageButton>
      </div>

      {/* Kotak lompat hanya berguna kalau ada halaman yang tidak tampil sebagai tombol */}
      {lastPage > 7 && <JumpToPage lastPage={lastPage} onPageChange={onPageChange} />}
    </nav>
  )
}

// Satu tombol halaman. Aktif = latar biru; aria-current memberi tahu pembaca layar posisi saat ini.
function PageButton({
  children,
  onClick,
  label,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || active}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium tabular-nums transition-colors',
        active
          ? 'bg-blue-600 text-slate-50'
          : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-800 hover:text-blue-300 disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-300',
      )}
    >
      {children}
    </button>
  )
}

// Kotak "Ke halaman [__]". Angka di luar jangkauan dijepit ke 1..lastPage, bukan ditolak,
// supaya mengetik 999 di daftar 42 halaman langsung membawa ke halaman terakhir.
function JumpToPage({ lastPage, onPageChange }: { lastPage: number; onPageChange: (page: number) => void }) {
  const [value, setValue] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const target = Number.parseInt(value, 10)
    if (Number.isNaN(target)) return
    onPageChange(Math.min(Math.max(target, 1), lastPage))
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 text-sm text-slate-400">
      <label htmlFor="jump-to-page">Ke halaman</label>
      <input
        id="jump-to-page"
        type="number"
        inputMode="numeric"
        min={1}
        max={lastPage}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`1–${lastPage}`}
        className="h-9 w-20 rounded-lg border border-slate-800 bg-slate-900 px-2 text-center text-slate-100 tabular-nums outline-none placeholder:text-slate-600 focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={!value}
        className="h-9 rounded-lg bg-blue-600 px-3 font-medium text-slate-50 transition-colors hover:bg-blue-500 disabled:opacity-40"
      >
        Buka
      </button>
    </form>
  )
}
