// Route /stats : ringkasan statistik tontonan. Halaman privat, seluruh datanya dihitung di browser
// dari entri yang sudah diambil listEntriesQueryOptions — tidak ada query agregasi tambahan ke database.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { ErrorBox } from '@/components/ErrorBox'
import { PageSpinner } from '@/components/PageSpinner'
import { useUser } from '@/features/auth/useSession'
import { listEntriesQueryOptions } from '@/features/list/queries'
import { LIST_STATUS_META } from '@/features/list/status'
import { BarList, ChartCard, ColumnChart, StackedBar, StatTile } from '@/features/stats/charts'
import { completedPerMonth, countByStatus, scoreDistribution, summarize, topGenres } from '@/features/stats/computeStats'

export const Route = createFileRoute('/_app/_auth/stats')({
  component: StatsPage,
})

function StatsPage() {
  const user = useUser()
  const query = useQuery({ ...listEntriesQueryOptions(user?.id ?? ''), enabled: !!user })

  if (query.isPending) return <PageSpinner />
  if (query.isError) return <ErrorBox message="Gagal memuat data list." onRetry={() => query.refetch()} />

  const entries = query.data
  if (entries.length === 0) return <EmptyStats />

  const summary = summarize(entries)
  const statuses = countByStatus(entries)
  const scores = scoreDistribution(entries)
  const genres = topGenres(entries)
  const months = completedPerMonth(entries)

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Stats</h1>

      {/* Baris angka utama: satu nilai tunggal lebih baik dibaca sebagai angka, bukan grafik */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total anime" value={summary.totalAnime.toLocaleString('id-ID')} />
        <StatTile label="Episode ditonton" value={summary.totalEpisodes.toLocaleString('id-ID')} />
        <StatTile
          label="Waktu tonton"
          value={`${summary.days.toFixed(1)} hari`}
          hint={`± ${Math.round(summary.days * 24).toLocaleString('id-ID')} jam`}
        />
        <StatTile
          label="Skor rata-rata"
          value={summary.meanScore ? summary.meanScore.toFixed(2) : '—'}
          hint={summary.scoredCount > 0 ? `dari ${summary.scoredCount} anime dinilai` : 'belum ada yang dinilai'}
        />
      </div>

      <ChartCard title="Komposisi status" subtitle={`${summary.totalAnime} anime di list`}>
        <StackedBar
          segments={statuses.map(({ status, count }) => ({
            key: status,
            label: LIST_STATUS_META[status].label,
            value: count,
          }))}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Sebaran skor"
          subtitle={summary.scoredCount > 0 ? `${summary.scoredCount} anime dinilai` : 'belum ada penilaian'}
        >
          <ColumnChart data={scores} />
        </ChartCard>

        <ChartCard title="Selesai per bulan" subtitle="12 bulan terakhir, berdasarkan tanggal selesai">
          <ColumnChart data={months} />
        </ChartCard>
      </div>

      <ChartCard title="Genre terbanyak" subtitle="jumlah anime di list yang punya genre tersebut">
        {genres.length > 0 ? (
          <BarList data={genres} total={summary.totalAnime} />
        ) : (
          <p className="text-sm text-slate-500">Belum ada data genre.</p>
        )}
      </ChartCard>
    </section>
  )
}

// List masih kosong: grafik apa pun tidak berarti, jadi arahkan ke Browse
function EmptyStats() {
  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Stats</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-800 px-6 py-16 text-center">
        <p className="text-sm text-slate-400">Statistik muncul setelah ada anime di listmu.</p>
        <Button asChild>
          <Link to="/browse">Cari anime di Browse</Link>
        </Button>
      </div>
    </section>
  )
}
