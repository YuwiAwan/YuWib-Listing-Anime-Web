// Grid kartu anime yang responsif (2 → 6 kolom) + state loading (skeleton) dan kosong.
import type { ReactNode } from 'react'
import { AnimeCard, AnimeCardSkeleton } from './AnimeCard'
import type { AnimeSnapshot } from './animeRow'

type AnimeGridProps = {
  items: AnimeSnapshot[]
  isLoading?: boolean // belum ada data sama sekali → tampilkan skeleton
  isFetching?: boolean // sedang ambil data baru tapi data lama masih ada → redupkan sedikit
  empty?: ReactNode // ditampilkan kalau items kosong dan tidak loading
}

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'

export function AnimeGrid({ items, isLoading, isFetching, empty }: AnimeGridProps) {
  if (isLoading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 12 }, (_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-800 px-6 py-16 text-center text-sm text-slate-500">
        {empty ?? 'Tidak ada anime.'}
      </div>
    )
  }

  return (
    <div className={`${GRID} transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
      {items.map((anime) => (
        <AnimeCard key={anime.mal_id} anime={anime} />
      ))}
    </div>
  )
}
