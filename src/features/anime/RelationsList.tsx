// Daftar relasi: prequel, sequel, side story, adaptasi manga, dsb.
// Entri bertipe "anime" bisa diklik ke halaman detailnya di YuWib; entri manga hanya ditampilkan
// sebagai teks karena YuWib tidak melacak manga.
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { animeRelationsQueryOptions } from './queries'

export function RelationsList({ malId }: { malId: number }) {
  const { data, isPending, isError } = useQuery(animeRelationsQueryOptions(malId))

  if (isPending) return <div className="h-16 animate-pulse rounded-lg bg-slate-900" />
  // Relasi hanyalah pelengkap — kalau gagal dimuat, halaman tetap berguna tanpa menampilkan error
  if (isError || data.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-slate-100">Relasi</h2>
      <dl className="space-y-2">
        {data.map((relation) => (
          <div key={relation.relation} className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
            <dt className="shrink-0 text-slate-500">{relation.relation}:</dt>
            <dd className="flex flex-wrap gap-x-2">
              {relation.entry.map((entry) =>
                entry.type === 'anime' ? (
                  <Link
                    key={entry.mal_id}
                    to="/anime/$malId"
                    params={{ malId: entry.mal_id }}
                    className="text-blue-400 transition-colors hover:text-blue-300 hover:underline"
                  >
                    {entry.name}
                  </Link>
                ) : (
                  <span key={entry.mal_id} className="text-slate-400">
                    {entry.name} <span className="text-xs text-slate-600">({entry.type})</span>
                  </span>
                ),
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
