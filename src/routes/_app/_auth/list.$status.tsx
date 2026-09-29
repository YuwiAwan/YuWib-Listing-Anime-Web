// Route /list/$status : daftar anime pribadi per status. Halaman privat (berada di bawah _auth).
// Seluruh data dibaca dari Supabase — halaman ini TIDAK pernah memanggil API anime eksternal,
// karena snapshot judul & poster sudah tersimpan saat anime ditambahkan ke list (lihat docs/PLAN.md §2).
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { ErrorBox } from '@/components/ErrorBox'
import { PageSpinner } from '@/components/PageSpinner'
import { useUser } from '@/features/auth/useSession'
import { applyListFilters, collectFilterOptions, LIST_SORTS, type ListFilters } from '@/features/list/filters'
import { ListGrid } from '@/features/list/ListGrid'
import { ListTable } from '@/features/list/ListTable'
import { ListTabs } from '@/features/list/ListTabs'
import { ListToolbar, type ListView } from '@/features/list/ListToolbar'
import { listEntriesQueryOptions } from '@/features/list/queries'
import { LIST_STATUS_META, slugToStatus } from '@/features/list/status'

// Semua kontrol halaman disimpan di URL supaya bisa di-bookmark dan tombol back berfungsi.
// .catch(undefined) = nilai tidak valid diabaikan (kembali ke default), bukan memunculkan error.
const listSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  genre: z.string().trim().min(1).optional().catch(undefined),
  type: z.string().trim().min(1).optional().catch(undefined),
  year: z.number().int().optional().catch(undefined),
  sort: z.enum(LIST_SORTS).optional().catch(undefined),
  order: z.enum(['asc', 'desc']).optional().catch(undefined),
  view: z.enum(['grid', 'table']).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/_auth/list/$status')({
  validateSearch: listSearchSchema,
  // Validasi slug sebelum halaman dimuat; hasilnya diteruskan ke component lewat context
  beforeLoad: ({ params }) => {
    const status = slugToStatus(params.status)
    if (!status) throw notFound()
    return { status }
  },
  component: ListPage,
})

function ListPage() {
  // status di sini sudah bertipe ListStatus (bukan string mentah dari URL) berkat return beforeLoad
  const { status } = Route.useRouteContext()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const user = useUser()

  const query = useQuery({ ...listEntriesQueryOptions(user?.id ?? ''), enabled: !!user })

  // Default: yang terakhir diubah lebih dulu — paling berguna untuk tab Watching
  const filters: ListFilters = {
    q: search.q,
    genre: search.genre,
    type: search.type,
    year: search.year,
    sort: search.sort ?? 'updated',
    order: search.order ?? 'desc',
  }
  const view: ListView = search.view ?? 'grid'

  // Tulis perubahan kontrol ke URL. Nilai default dibuang (undefined) supaya URL tetap pendek.
  function patchSearch(changes: Partial<ListFilters>) {
    navigate({
      search: (prev) => ({
        ...prev,
        ...changes,
        sort: (changes.sort ?? filters.sort) === 'updated' ? undefined : (changes.sort ?? filters.sort),
        order: (changes.order ?? filters.order) === 'desc' ? undefined : (changes.order ?? filters.order),
      }),
      replace: true,
    })
  }

  if (query.isPending) return <PageSpinner />
  if (query.isError) return <ErrorBox message="Gagal memuat list dari database." onRetry={() => query.refetch()} />

  const all = query.data
  const inStatus = all.filter((entry) => entry.status === status)
  const options = collectFilterOptions(inStatus)
  const visible = applyListFilters(inStatus, filters)
  const meta = LIST_STATUS_META[status]

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-100">My List</h1>
        <span className="text-sm text-slate-500">{all.length} judul total</span>
      </div>

      <ListTabs entries={all} active={status} />

      {/* List kosong sama sekali di tab ini → tidak perlu menampilkan kontrol filter */}
      {inStatus.length === 0 ? (
        <EmptyTab label={meta.label} />
      ) : (
        <>
          <ListToolbar
            filters={filters}
            options={options}
            view={view}
            onFiltersChange={patchSearch}
            onViewChange={(next) =>
              navigate({ search: (prev) => ({ ...prev, view: next === 'grid' ? undefined : next }), replace: true })
            }
            onReset={() =>
              navigate({ search: (prev) => ({ ...prev, q: undefined, genre: undefined, type: undefined, year: undefined }), replace: true })
            }
          />

          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center text-sm text-slate-500">
              Tidak ada anime yang cocok dengan filter ini.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                Menampilkan {visible.length} dari {inStatus.length} judul
              </p>
              {view === 'table' ? <ListTable entries={visible} /> : <ListGrid entries={visible} />}
            </>
          )}
        </>
      )}
    </section>
  )
}

// Ajakan ke halaman Browse saat sebuah tab masih kosong
function EmptyTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-800 px-6 py-16 text-center">
      <p className="text-sm text-slate-400">Belum ada anime berstatus “{label}”.</p>
      <Button asChild>
        <Link to="/browse">Cari anime di Browse</Link>
      </Button>
    </div>
  )
}
