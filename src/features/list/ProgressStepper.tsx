// Pengatur progress episode: tombol −, teks "12 / 28", tombol +.
// Aksi paling sering dipakai di YuWib, jadi sengaja cuma satu klik dan hasilnya langsung terlihat
// (mutation-nya memakai pembaruan optimis).
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUpdateEntry, type ListEntryWithAnime } from './queries'

type ProgressStepperProps = {
  entry: ListEntryWithAnime
  size?: 'sm' | 'md'
}

export function ProgressStepper({ entry, size = 'md' }: ProgressStepperProps) {
  const update = useUpdateEntry()
  const total = entry.anime?.episodes ?? null
  const watched = entry.episodes_watched

  // Batas: tidak boleh di bawah 0, dan tidak melebihi total episode (kalau totalnya diketahui)
  const canDecrease = watched > 0
  const canIncrease = total == null || watched < total

  function step(delta: number) {
    update.mutate({ entry, changes: { episodes_watched: watched + delta } })
  }

  const buttonSize = size === 'sm' ? 'size-6' : 'size-7'

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={!canDecrease}
        aria-label="Kurangi satu episode"
        className={cn(BUTTON, buttonSize)}
      >
        <Minus className="size-3.5" />
      </button>

      <span className={cn('tabular-nums text-slate-300', size === 'sm' ? 'text-xs' : 'text-sm')}>
        <span className="font-medium text-slate-100">{watched}</span>
        <span className="text-slate-500"> / {total ?? '?'}</span>
      </span>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={!canIncrease}
        aria-label="Tambah satu episode"
        className={cn(BUTTON, buttonSize, canIncrease && 'hover:bg-blue-600 hover:text-slate-50')}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

const BUTTON =
  'inline-flex items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:text-slate-100 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-300'
