// Rekomendasi dari komunitas MAL: "kalau suka ini, coba ini". Dimuat saat tabnya dibuka.
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { animeRecommendationsQueryOptions } from './queries'

const MAX_SHOWN = 24 // daftarnya bisa 80+; sisanya jarang dilihat

export function RecommendationList({ malId, enabled }: { malId: number; enabled: boolean }) {
  const { data, isPending, isError, refetch } = useQuery({ ...animeRecommendationsQueryOptions(malId), enabled })

  if (!enabled) return null
  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="aspect-2/3 animate-pulse rounded-lg bg-slate-900" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <button type="button" onClick={() => refetch()} className="text-sm text-blue-400 hover:text-blue-300">
        Gagal memuat rekomendasi. Coba lagi.
      </button>
    )
  }
  if (data.length === 0) return <p className="text-sm text-slate-500">Belum ada rekomendasi.</p>

  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
      {data.slice(0, MAX_SHOWN).map((item) => (
        <Link key={item.entry.mal_id} to="/anime/$malId" params={{ malId: item.entry.mal_id }} className="group block">
          <div className="aspect-2/3 overflow-hidden rounded-lg bg-slate-900 ring-1 ring-slate-800 transition group-hover:ring-blue-500">
            <img
              src={item.entry.images.jpg.large_image_url}
              alt={item.entry.title}
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <p className="mt-1.5 line-clamp-2 text-xs font-medium text-slate-200 transition-colors group-hover:text-blue-300">
            {item.entry.title}
          </p>
          <p className="text-[11px] text-slate-500">{item.votes} suara</p>
        </Link>
      ))}
    </div>
  )
}
