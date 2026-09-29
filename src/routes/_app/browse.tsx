// Route /browse : halaman publik (tanpa login) untuk menjelajah anime. Tiga mode, semuanya dari URL:
//   1. Musim     /browse                    → endpoint /seasons  (default: musim berjalan)
//   2. Filter    /browse?genres=1,10        → endpoint /anime    (genre, bisa multi)
//   3. Pencarian /browse?q=frieren          → endpoint /anime    (boleh digabung dengan genre)
// Mode filter dan pencarian memakai endpoint yang sama, jadi kata kunci + genre bisa dipakai bersamaan.
// Mode musim terpisah karena endpoint /seasons mengabaikan parameter genre (sudah diuji).
import { useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { ErrorBox } from '@/components/ErrorBox'
import { Pagination } from '@/components/Pagination'
import { describeApiError } from '@/features/anime/api'
import { AnimeGrid } from '@/features/anime/AnimeGrid'
import { useShowNsfw } from '@/features/auth/useShowNsfw'
import { GenreFilter } from '@/features/anime/GenreFilter'
import { formatGenreParam, parseGenreParam } from '@/features/anime/genres'
import { browseQueryOptions, SORT_VALUES } from '@/features/anime/queries'
import { SearchInput } from '@/features/anime/SearchInput'
import { SEASON_LABEL, SEASONS, currentSeason, type Season } from '@/features/anime/season'
import { SeasonPicker } from '@/features/anime/SeasonPicker'
import { SortSelect } from '@/features/anime/SortSelect'
import { jikanToSnapshot } from '@/features/anime/animeRow'

// Skema search params. .catch(undefined) = nilai tidak valid diabaikan (kembali ke default), bukan error.
// genres disimpan sebagai string "1,10" supaya URL tetap enak dibaca (bukan JSON ter-encode).
const browseSearchSchema = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  genres: z.string().regex(/^\d+(,\d+)*$/).optional().catch(undefined),
  sort: z.enum(SORT_VALUES).optional().catch(undefined),
  page: z.number().int().min(1).optional().catch(undefined),
  year: z.number().int().min(1960).max(2100).optional().catch(undefined),
  season: z.enum(SEASONS).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/browse')({
  validateSearch: browseSearchSchema,
  component: BrowsePage,
})

function BrowsePage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  // Preferensi per akun; pengunjung anonim selalu false
  const showNsfw = useShowNsfw()

  const genreIds = parseGenreParam(search.genres)
  const sort = search.sort ?? 'score'
  const page = search.page ?? 1
  const fallback = currentSeason()
  const year = search.year ?? fallback.year
  const season = search.season ?? fallback.season

  // Ada kata kunci atau genre terpilih → mode filter; kalau tidak → mode musim
  const isFiltering = Boolean(search.q) || genreIds.length > 0

  // Satu query untuk semua mode; buildBrowseRequest di queries.ts yang memilih endpointnya
  const query = useQuery(browseQueryOptions({ q: search.q, genreIds, sort, page, year, season, showNsfw }))

  // Setiap perubahan filter mengembalikan halaman ke 1 — kalau tidak, user bisa mendarat di halaman kosong
  const handleSearch = useCallback(
    (q: string | undefined) => navigate({ search: (prev) => ({ ...prev, q, page: undefined }), replace: true }),
    [navigate],
  )

  function handleGenres(ids: number[]) {
    navigate({ search: (prev) => ({ ...prev, genres: formatGenreParam(ids), page: undefined }) })
  }

  function handleSeason(next: { year: number; season: Season }) {
    navigate({ search: (prev) => ({ ...prev, ...next, page: undefined }) })
  }

  function handlePage(nextPage: number) {
    navigate({ search: (prev) => ({ ...prev, page: nextPage === 1 ? undefined : nextPage }) })
    window.scrollTo({ top: 0 })
  }

  const items = query.data?.data.map(jikanToSnapshot) ?? []
  const pagination = query.data?.pagination
  const total = pagination?.items.total

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Browse</h1>

      {/* Panel filter: pencarian, genre, lalu musim (musim hanya relevan saat tidak memfilter) */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <SearchInput value={search.q} onChange={handleSearch} />
        <GenreFilter selected={genreIds} onChange={handleGenres} showNsfw={showNsfw} />
        {!isFiltering && (
          <div className="border-t border-slate-800 pt-4">
            <SeasonPicker year={year} season={season} onChange={handleSeason} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-medium text-slate-100">
            <BrowseHeading q={search.q} genreCount={genreIds.length} season={season} year={year} />
          </h2>
          {total != null && <span className="text-sm text-slate-500">{total.toLocaleString('id-ID')} judul</span>}
        </div>
        {/* Urutan hanya bisa diatur di mode filter; endpoint musim tidak menerima order_by */}
        {isFiltering && (
          <SortSelect
            value={sort}
            onChange={(value) => navigate({ search: (prev) => ({ ...prev, sort: value, page: undefined }) })}
          />
        )}
      </div>

      {query.isError ? (
        <ErrorBox message={describeApiError(query.error)} onRetry={() => query.refetch()} />
      ) : (
        <AnimeGrid
          items={items}
          isLoading={query.isPending}
          isFetching={query.isFetching}
          empty={isFiltering ? 'Tidak ada anime yang cocok dengan filter ini.' : 'Belum ada anime untuk musim ini.'}
        />
      )}

      {pagination && (
        <Pagination
          page={page}
          lastPage={pagination.last_visible_page}
          hasNext={pagination.has_next_page}
          onPageChange={handlePage}
        />
      )}
    </section>
  )
}

// Judul daftar menyesuaikan mode yang sedang aktif
function BrowseHeading({
  q,
  genreCount,
  season,
  year,
}: {
  q: string | undefined
  genreCount: number
  season: Season
  year: number
}) {
  if (q && genreCount > 0) return <>“{q}” · {genreCount} genre</>
  if (q) return <>Hasil untuk “{q}”</>
  if (genreCount > 0) return <>Filter {genreCount} genre</>
  return <>{SEASON_LABEL[season]} {year}</>
}
