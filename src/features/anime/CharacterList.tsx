// Daftar karakter + pengisi suara Jepang. Query-nya berat (60+ entri) sehingga dijalankan
// hanya saat tab ini dibuka — lihat prop `enabled`.
import { useQuery } from '@tanstack/react-query'
import { animeCharactersQueryOptions } from './queries'
import type { JikanCharacterEntry } from '@/types/jikan.types'

export function CharacterList({ malId, enabled }: { malId: number; enabled: boolean }) {
  const { data, isPending, isError, refetch } = useQuery({ ...animeCharactersQueryOptions(malId), enabled })

  if (!enabled) return null
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-900" />
        ))}
      </div>
    )
  }
  if (isError) {
    return (
      <button type="button" onClick={() => refetch()} className="text-sm text-blue-400 hover:text-blue-300">
        Gagal memuat karakter. Coba lagi.
      </button>
    )
  }
  if (data.length === 0) return <p className="text-sm text-slate-500">Belum ada data karakter.</p>

  // Karakter utama lebih dulu, lalu urut berdasarkan jumlah favorit
  const sorted = [...data].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'Main' ? -1 : 1
    return b.favorites - a.favorites
  })

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {sorted.map((item) => (
        <CharacterCard key={item.character.mal_id} item={item} />
      ))}
    </div>
  )
}

// Satu kartu: foto karakter di kiri, nama + peran, lalu nama seiyuu di bawahnya
function CharacterCard({ item }: { item: JikanCharacterEntry }) {
  const seiyuu = item.voice_actors.find((va) => va.language === 'Japanese')

  return (
    <div className="flex gap-2 rounded-lg border border-slate-800 bg-slate-900/50 p-2">
      <img
        src={item.character.images.jpg.image_url}
        alt=""
        loading="lazy"
        className="h-16 w-12 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 text-xs">
        <p className="line-clamp-2 font-medium text-slate-100">{item.character.name}</p>
        <p className="text-slate-500">{item.role === 'Main' ? 'Utama' : 'Pendukung'}</p>
        {seiyuu && <p className="mt-1 line-clamp-2 text-slate-400">{seiyuu.person.name}</p>}
      </div>
    </div>
  )
}
