// Route /anime/$malId : halaman detail anime. PUBLIK — bisa dibuka tanpa login (lihat src/routes/_app.tsx).
// Dua zona: data global dari API di kiri, panel data pribadi (EntryEditor) menempel di kanan.
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import type { JikanAnime } from '@/types/jikan.types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ErrorBox } from '@/components/ErrorBox'
import { PageSpinner } from '@/components/PageSpinner'
import { AnimeHero } from '@/features/anime/AnimeHero'
import { describeApiError } from '@/features/anime/api'
import { CharacterList } from '@/features/anime/CharacterList'
import { animeQueryOptions } from '@/features/anime/queries'
import { RecommendationList } from '@/features/anime/RecommendationList'
import { RelationsList } from '@/features/anime/RelationsList'
import { Synopsis } from '@/features/anime/Synopsis'
import { TrailerEmbed } from '@/features/anime/TrailerEmbed'
import { EntryEditor } from '@/features/list/EntryEditor'
import { useRefreshSnapshot } from '@/features/list/useRefreshSnapshot'

// Tab aktif disimpan di URL supaya bisa di-bookmark dan tombol back berfungsi antar tab
const detailSearchSchema = z.object({
  tab: z.enum(['overview', 'characters', 'recommendations']).optional().catch(undefined),
})

export const Route = createFileRoute('/_app/anime/$malId')({
  // Ubah param string → number sekali di sini, supaya komponen dan loader menerima malId bertipe number
  params: {
    parse: ({ malId }) => ({ malId: Number(malId) }),
    stringify: ({ malId }) => ({ malId: String(malId) }),
  },
  validateSearch: detailSearchSchema,
  // Mulai mengambil detail sebelum komponen dirender (dan saat kursor hover di kartu, berkat defaultPreload)
  loader: ({ context, params }) => context.queryClient.ensureQueryData(animeQueryOptions(params.malId)),
  component: AnimeDetailPage,
})

function AnimeDetailPage() {
  const { malId } = Route.useParams()
  const { tab = 'overview' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const query = useQuery(animeQueryOptions(malId))

  if (query.isPending) return <PageSpinner />
  if (query.isError) return <ErrorBox message={describeApiError(query.error)} onRetry={() => query.refetch()} />

  const anime = query.data

  return (
    // Panel pribadi di kolom kanan pada layar lebar; menumpuk di bawah konten pada layar sempit
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0 space-y-6">
        <AnimeHero anime={anime} />

        <Tabs value={tab} onValueChange={(value) => navigate({ search: { tab: value === 'overview' ? undefined : (value as 'characters' | 'recommendations') } })}>
          <TabsList>
            <TabsTrigger value="overview">Ikhtisar</TabsTrigger>
            <TabsTrigger value="characters">Karakter</TabsTrigger>
            <TabsTrigger value="recommendations">Rekomendasi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="space-y-2">
              <h2 className="text-sm font-medium text-slate-100">Sinopsis</h2>
              <Synopsis text={anime.synopsis} />
            </div>
            <RelationsList malId={malId} />
            <TrailerEmbed embedUrl={anime.trailer.embed_url} title={anime.title} />
          </TabsContent>

          {/* enabled: query karakter & rekomendasi baru berjalan saat tabnya benar-benar dibuka */}
          <TabsContent value="characters" className="pt-4">
            <CharacterList malId={malId} enabled={tab === 'characters'} />
          </TabsContent>

          <TabsContent value="recommendations" className="pt-4">
            <RecommendationList malId={malId} enabled={tab === 'recommendations'} />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="lg:w-80">
        <PersonalPanel anime={anime} />
      </aside>
    </div>
  )
}

// Pembungkus panel pribadi. Dipisah jadi komponen sendiri karena useRefreshSnapshot adalah hook,
// sedangkan komponen halaman punya early-return untuk keadaan loading/error — hook tidak boleh
// dipanggil setelah itu.
function PersonalPanel({ anime }: { anime: JikanAnime }) {
  // Sekalian segarkan snapshot di database dengan data yang baru saja diambil halaman ini
  useRefreshSnapshot(anime)
  return <EntryEditor anime={anime} />
}
