// Bagian atas halaman detail: poster, judul (romaji/Inggris/Jepang), badge info, skor & peringkat MAL,
// studio, dan genre. Semua datanya global (dari API), bukan data pribadi.
import { ExternalLink, ImageOff, Star, Users } from 'lucide-react'
import type { JikanAnime } from '@/types/jikan.types'

export function AnimeHero({ anime }: { anime: JikanAnime }) {
  // Baris info ringkas di bawah judul; nilai kosong dibuang supaya tidak muncul pemisah menggantung
  const facts = [
    anime.type,
    anime.episodes ? `${anime.episodes} episode` : null,
    anime.duration,
    anime.status,
    anime.season && anime.year ? `${capitalize(anime.season)} ${anime.year}` : anime.year?.toString(),
    anime.rating,
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-5 sm:flex-row">
      <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-48">
        <div className="aspect-2/3 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
          {anime.images.jpg.large_image_url ? (
            <img src={anime.images.jpg.large_image_url} alt={anime.title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-700">
              <ImageOff className="size-8" />
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{anime.title}</h1>
          {anime.title_english && anime.title_english !== anime.title && (
            <p className="mt-0.5 text-sm text-slate-400">{anime.title_english}</p>
          )}
          {anime.title_japanese && <p className="text-sm text-slate-500">{anime.title_japanese}</p>}
        </div>

        {/* Skor & jumlah anggota dari MAL — konteks untuk menilai apakah anime ini layak ditonton */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          {anime.score != null && (
            <span className="inline-flex items-center gap-1.5 text-blue-300">
              <Star className="size-4 fill-current" />
              <span className="text-lg font-semibold">{anime.score.toFixed(2)}</span>
              {anime.scored_by && (
                <span className="text-xs text-slate-500">({anime.scored_by.toLocaleString('id-ID')} suara)</span>
              )}
            </span>
          )}
          {anime.rank != null && <span className="text-slate-400">Peringkat #{anime.rank}</span>}
          {anime.members != null && (
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Users className="size-3.5" />
              {anime.members.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-400">{facts.join(' · ')}</p>

        {anime.studios.length > 0 && (
          <p className="text-sm text-slate-400">
            Studio: <span className="text-slate-200">{anime.studios.map((s) => s.name).join(', ')}</span>
          </p>
        )}

        {/* Genre + tema: klik untuk melompat ke halaman Browse dengan filter genre itu */}
        <div className="flex flex-wrap gap-1.5">
          {[...anime.genres, ...anime.themes].map((genre) => (
            <a
              key={genre.mal_id}
              href={`/browse?genres=${genre.mal_id}`}
              className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-0.5 text-xs text-slate-300 transition-colors hover:border-blue-800 hover:text-blue-300"
            >
              {genre.name}
            </a>
          ))}
        </div>

        <a
          href={anime.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-blue-400"
        >
          Lihat di MyAnimeList
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
