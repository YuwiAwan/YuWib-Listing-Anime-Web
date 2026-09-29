// Route /dashboard : halaman pertama setelah login. Menjawab satu pertanyaan — "mau nonton apa sekarang?"
// Semua bagian pribadi dihitung dari SATU query yang sudah ada (listEntriesQueryOptions);
// hanya bagian "Musim ini" yang memanggil API, dan itu pun cache-nya dipakai bersama halaman Browse.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ErrorBox } from '@/components/ErrorBox'
import { PageSpinner } from '@/components/PageSpinner'
import { jikanToSnapshot } from '@/features/anime/animeRow'
import { AnimeGrid } from '@/features/anime/AnimeGrid'
import { seasonQueryOptions } from '@/features/anime/queries'
import { currentSeason, SEASON_LABEL } from '@/features/anime/season'
import { useProfile } from '@/features/auth/useProfile'
import { useUser } from '@/features/auth/useSession'
import { useShowNsfw } from '@/features/auth/useShowNsfw'
import { AiringThisWeek } from '@/features/dashboard/AiringThisWeek'
import { ContinueWatching } from '@/features/dashboard/ContinueWatching'
import { RandomPick } from '@/features/dashboard/RandomPick'
import { RecentActivity } from '@/features/dashboard/RecentActivity'
import { airingThisWeek, continueWatching, recentActivity } from '@/features/dashboard/sections'
import { listEntriesQueryOptions } from '@/features/list/queries'
import { StatTile } from '@/features/stats/charts'
import { summarize } from '@/features/stats/computeStats'

export const Route = createFileRoute('/_app/_auth/dashboard')({
  component: DashboardPage,
})

const SEASON_PREVIEW = 12 // cukup untuk dua baris grid; selebihnya lihat di Browse

function DashboardPage() {
  const user = useUser()
  const { data: profile } = useProfile()
  const query = useQuery({ ...listEntriesQueryOptions(user?.id ?? ''), enabled: !!user })

  const { year, season } = currentSeason()
  const showNsfw = useShowNsfw()
  const seasonQuery = useQuery(seasonQueryOptions(year, season, 1, showNsfw))

  if (query.isPending) return <PageSpinner />
  if (query.isError) return <ErrorBox message="Gagal memuat list dari database." onRetry={() => query.refetch()} />

  const entries = query.data
  const summary = summarize(entries)
  const watching = continueWatching(entries)
  const airing = airingThisWeek(entries)
  const recent = recentActivity(entries)
  const seasonItems = seasonQuery.data?.data.slice(0, SEASON_PREVIEW).map(jikanToSnapshot) ?? []

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
        Halo, <span className="text-blue-400">{profile?.username ?? '…'}</span>
      </h1>

      {entries.length === 0 ? (
        <EmptyDashboard />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Total anime" value={summary.totalAnime.toLocaleString('id-ID')} />
            <StatTile label="Episode ditonton" value={summary.totalEpisodes.toLocaleString('id-ID')} />
            <StatTile label="Waktu tonton" value={`${summary.days.toFixed(1)} hari`} />
            <StatTile
              label="Skor rata-rata"
              value={summary.meanScore ? summary.meanScore.toFixed(2) : '—'}
              hint={summary.scoredCount > 0 ? `dari ${summary.scoredCount} anime` : undefined}
            />
          </div>

          {watching.length > 0 && (
            <Card title="Lanjut nonton" action={{ label: 'Semua', to: '/list/$status', params: { status: 'watching' } }}>
              <ContinueWatching entries={watching} />
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {airing.length > 0 && (
              <Card title="Tayang minggu ini" subtitle="anime di listmu yang masih on-air">
                <AiringThisWeek entries={airing} />
              </Card>
            )}

            <Card title="Bingung mau nonton apa?" subtitle="diambil acak dari Plan to Watch">
              <RandomPick entries={entries} />
            </Card>
          </div>

          <Card title="Aktivitas terbaru" subtitle="sepuluh entri yang terakhir diubah">
            <RecentActivity entries={recent} />
          </Card>
        </>
      )}

      {/* Bagian penemuan: anime musim berjalan, cache-nya sama dengan yang dipakai halaman Browse */}
      <Card
        title={`Musim ${SEASON_LABEL[season]} ${year}`}
        subtitle="anime yang sedang tayang musim ini"
        action={{ label: 'Jelajahi', to: '/browse' }}
      >
        {seasonQuery.isError ? (
          <p className="text-sm text-slate-500">Data musim sedang tidak bisa diambil.</p>
        ) : (
          <AnimeGrid items={seasonItems} isLoading={seasonQuery.isPending} isFetching={seasonQuery.isFetching} />
        )}
      </Card>
    </section>
  )
}

type CardAction = { label: string } & (
  | { to: '/browse'; params?: never }
  | { to: '/list/$status'; params: { status: string } }
)

// Kotak bagian dengan judul dan tautan opsional di kanan atas
function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: CardAction
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action &&
          (action.to === '/browse' ? (
            <Link to="/browse" className={ACTION_LINK}>
              {action.label} <ArrowRight className="size-3" />
            </Link>
          ) : (
            <Link to="/list/$status" params={action.params} className={ACTION_LINK}>
              {action.label} <ArrowRight className="size-3" />
            </Link>
          ))}
      </div>
      {children}
    </section>
  )
}

const ACTION_LINK =
  'inline-flex shrink-0 items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300'

// List masih kosong: dashboard tidak punya apa pun untuk ditampilkan selain ajakan mulai
function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-800 px-6 py-12 text-center">
      <p className="text-sm text-slate-400">Listmu masih kosong. Mulai dari menambahkan anime yang pernah kamu tonton.</p>
      <Button asChild>
        <Link to="/browse">Cari anime di Browse</Link>
      </Button>
    </div>
  )
}
