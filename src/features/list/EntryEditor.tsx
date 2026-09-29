// Panel data pribadi di halaman detail anime. Tiga keadaan, sama seperti AddToListButton:
//   - Belum login       : ajakan masuk (halaman detail memang publik)
//   - Belum ada di list : tombol tambah dengan pilihan status
//   - Sudah ada di list : editor lengkap (status, skor, progress, tanggal, rewatch, favorit, catatan)
import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Check, Heart, Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@/features/auth/useSession'
import { jikanToSnapshot } from '@/features/anime/animeRow'
import { cn } from '@/lib/utils'
import type { JikanAnime } from '@/types/jikan.types'
import { ProgressStepper } from './ProgressStepper'
import { ScoreSelect } from './ScoreSelect'
import { StatusSelect } from './StatusSelect'
import { useAddToList, useMyEntry, useRemoveFromList, useUpdateEntry, type ListEntryWithAnime } from './queries'
import { LIST_STATUSES, LIST_STATUS_META } from './status'

export function EntryEditor({ anime }: { anime: JikanAnime }) {
  const user = useUser()
  const location = useLocation()
  const { data: entry } = useMyEntry(anime.mal_id)

  if (!user) {
    return (
      <Panel>
        <p className="text-sm text-slate-400">Masuk untuk mencatat anime ini ke listmu.</p>
        <Button asChild className="w-full">
          <Link to="/login" search={{ redirect: location.href, mode: undefined }}>
            Login
          </Link>
        </Button>
      </Panel>
    )
  }

  return entry ? <ExistingEntry entry={entry} /> : <AddPanel anime={anime} />
}

// Belum ada di list: lima tombol status, sekali klik langsung tersimpan
function AddPanel({ anime }: { anime: JikanAnime }) {
  const add = useAddToList()
  const snapshot = jikanToSnapshot(anime)

  return (
    <Panel>
      <p className="text-sm font-medium text-slate-100">Tambah ke list</p>
      <div className="grid gap-1.5">
        {LIST_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            disabled={add.isPending}
            onClick={() => add.mutate({ snapshot, status })}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-blue-800 hover:bg-blue-600/10 hover:text-blue-300 disabled:opacity-60"
          >
            <span className={cn('size-2 rounded-full bg-current', LIST_STATUS_META[status].color)} />
            {LIST_STATUS_META[status].label}
          </button>
        ))}
      </div>
      {add.isPending && (
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-400">
          <Loader2 className="size-3 animate-spin" />
          Menyimpan…
        </p>
      )}
      {add.isError && <p className="text-xs text-rose-400">Gagal menyimpan. Coba lagi.</p>}
    </Panel>
  )
}

// Sudah ada di list: editor lengkap
function ExistingEntry({ entry }: { entry: ListEntryWithAnime }) {
  const update = useUpdateEntry()
  const remove = useRemoveFromList()
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <Panel>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-100">Catatanku</p>
        {/* Favorit disimpan seketika, tanpa tombol simpan terpisah */}
        <button
          type="button"
          onClick={() => update.mutate({ entry, changes: { is_favorite: !entry.is_favorite } })}
          aria-pressed={entry.is_favorite}
          aria-label="Tandai favorit"
          className={cn(
            'rounded-md p-1.5 transition-colors',
            entry.is_favorite ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400',
          )}
        >
          <Heart className={cn('size-4', entry.is_favorite && 'fill-current')} />
        </button>
      </div>

      <Field label="Status">
        <StatusSelect entry={entry} />
      </Field>

      <Field label="Progress episode">
        <ProgressStepper entry={entry} />
      </Field>

      <Field label="Skor">
        <ScoreSelect entry={entry} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <DateField
          label="Mulai"
          value={entry.start_date}
          onChange={(start_date) => update.mutate({ entry, changes: { start_date } })}
        />
        <DateField
          label="Selesai"
          value={entry.finish_date}
          onChange={(finish_date) => update.mutate({ entry, changes: { finish_date } })}
        />
      </div>

      <Field label="Rewatch">
        <Counter
          value={entry.rewatch_count}
          onChange={(rewatch_count) => update.mutate({ entry, changes: { rewatch_count } })}
        />
      </Field>

      <NotesField entry={entry} />

      <div className="border-t border-slate-800 pt-3">
        {confirmRemove ? (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => remove.mutate(entry.id)}>
              Yakin hapus
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirmRemove(false)}>
              Batal
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-rose-400"
          >
            <Trash2 className="size-3" />
            Hapus dari list
          </button>
        )}
      </div>
    </Panel>
  )
}

// Catatan pribadi: disimpan lewat tombol, bukan tiap ketikan — menulis catatan panjang
// tidak perlu memicu puluhan request.
function NotesField({ entry }: { entry: ListEntryWithAnime }) {
  const update = useUpdateEntry()
  const [draft, setDraft] = useState(entry.notes ?? '')

  // Catatan berubah dari luar (tersimpan, atau diedit di perangkat lain) → samakan draf.
  // Memakai pola "menyesuaikan state saat render" dari dokumentasi React, bukan useEffect:
  // effect akan merender dua kali (sekali dengan nilai lama), sedangkan cara ini langsung benar.
  const [syncedNotes, setSyncedNotes] = useState(entry.notes)
  if (entry.notes !== syncedNotes) {
    setSyncedNotes(entry.notes)
    setDraft(entry.notes ?? '')
  }

  const isDirty = draft !== (entry.notes ?? '')

  return (
    <div className="space-y-1.5">
      <Label htmlFor="notes" className="text-xs text-slate-400">
        Catatan
      </Label>
      <Textarea
        id="notes"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder="Kesan, alasan drop, catatan rewatch…"
        className="resize-y bg-slate-900 text-sm"
      />
      {isDirty && (
        <div className="flex gap-2">
          <Button size="xs" onClick={() => update.mutate({ entry, changes: { notes: draft || null } })}>
            <Check data-icon="inline-start" />
            Simpan catatan
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setDraft(entry.notes ?? '')}>
            Batal
          </Button>
        </div>
      )}
    </div>
  )
}

// Tanggal memakai <input type="date"> native; ikut tema gelap berkat color-scheme: dark
function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (value: string | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-slate-400">{label}</Label>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="h-8 w-full rounded-md border border-slate-800 bg-slate-900 px-2 text-sm text-slate-100 outline-none focus-visible:border-blue-500 focus-visible:ring-3 focus-visible:ring-blue-500/50"
      />
    </div>
  )
}

// Penghitung sederhana (dipakai jumlah rewatch)
function Counter({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 0}
        aria-label="Kurangi"
        className={COUNTER_BUTTON}
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-medium text-slate-100 tabular-nums">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Tambah" className={COUNTER_BUTTON}>
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

const COUNTER_BUTTON =
  'inline-flex size-7 items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-300 transition-colors hover:text-slate-100 disabled:opacity-40'

// Baris label + kontrol
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">{label}</span>
      {children}
    </div>
  )
}

// Kotak panel; di desktop menempel saat halaman digulir
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 lg:sticky lg:top-20">
      {children}
    </div>
  )
}
