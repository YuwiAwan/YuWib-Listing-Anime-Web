// Tombol tambah/ubah status anime di list pribadi. Tiga keadaan:
//   - Belum login        : ikon "+" → mengarah ke /login (halaman Browse memang publik)
//   - Belum ada di list  : ikon "+" → dropdown pilih status
//   - Sudah ada di list  : ikon centang berwarna sesuai status → dropdown ubah status / hapus
import { Link, useLocation } from '@tanstack/react-router'
import { Check, Loader2, Plus, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUser } from '@/features/auth/useSession'
import type { AnimeSnapshot } from '@/features/anime/animeRow'
import { cn } from '@/lib/utils'
import { useAddToList, useMyEntry, useRemoveFromList, useUpdateEntry } from './queries'
import { LIST_STATUSES, LIST_STATUS_META, type ListStatus } from './status'

type AddToListButtonProps = { anime: AnimeSnapshot }

export function AddToListButton({ anime }: AddToListButtonProps) {
  const user = useUser()
  const location = useLocation()
  const { data: entry } = useMyEntry(anime.mal_id)

  const add = useAddToList()
  const update = useUpdateEntry()
  const remove = useRemoveFromList()
  const isBusy = add.isPending || update.isPending || remove.isPending

  // Belum login: jangan sembunyikan tombolnya — ajak login sambil mengingat halaman ini
  if (!user) {
    return (
      <Link
        to="/login"
        search={{ redirect: location.href, mode: undefined }}
        aria-label="Login untuk menambah ke list"
        title="Login untuk menambah ke list"
        className={cn(BUTTON_BASE, HIDE_UNTIL_HOVER, 'bg-slate-950/80 text-slate-300 hover:bg-blue-600 hover:text-slate-50')}
      >
        <Plus className="size-4" />
      </Link>
    )
  }

  function handleSelect(status: ListStatus) {
    if (entry) update.mutate({ entry, changes: { status } })
    else add.mutate({ snapshot: anime, status })
  }

  const meta = entry ? LIST_STATUS_META[entry.status] : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isBusy}
        aria-label={entry ? `Di list: ${meta?.label}` : 'Tambah ke list'}
        title={entry ? `Di list: ${meta?.label}` : 'Tambah ke list'}
        className={cn(
          BUTTON_BASE,
          // Sudah ada di list → penanda status harus selalu terlihat, jangan disembunyikan
          entry
            ? `bg-slate-950/90 ${meta?.color}`
            : `${HIDE_UNTIL_HOVER} bg-slate-950/80 text-slate-300 hover:bg-blue-600 hover:text-slate-50`,
        )}
      >
        {isBusy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : entry ? (
          <Check className="size-4" />
        ) : (
          <Plus className="size-4" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel className="text-xs font-normal text-slate-500">
          {entry ? 'Ubah status' : 'Tambah ke list'}
        </DropdownMenuLabel>

        {LIST_STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => handleSelect(status)}
            className={cn(entry?.status === status && 'bg-blue-600/15')}
          >
            {/* Titik berwarna sebagai penanda status, warnanya sama dengan yang dipakai badge di halaman List */}
            <span className={cn('size-2 rounded-full bg-current', LIST_STATUS_META[status].color)} />
            {LIST_STATUS_META[status].label}
          </DropdownMenuItem>
        ))}

        {entry && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => remove.mutate(entry.id)}>
              <Trash2 />
              Hapus dari list
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Bentuk tombol bulat kecil yang dipakai ketiga keadaan di atas
const BUTTON_BASE =
  'inline-flex size-8 items-center justify-center rounded-full backdrop-blur transition outline-none focus-visible:ring-3 focus-visible:ring-blue-500/50 disabled:opacity-70'

// Tombol "+" tidak perlu selalu terlihat di desktop: cukup muncul saat kursor berada di atas kartu
// (kartu memasang class "group") atau saat tombolnya mendapat fokus keyboard.
// Di layar sentuh tidak ada hover, jadi di bawah breakpoint md tombol selalu tampak.
const HIDE_UNTIL_HOVER = 'md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
