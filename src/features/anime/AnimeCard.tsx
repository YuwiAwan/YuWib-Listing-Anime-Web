// Kartu anime: poster 2:3, tombol tambah-ke-list, badge skor, judul, dan baris info (tipe · episode · tahun).
// Menerima AnimeSnapshot — bentuk baris tabel `anime` — supaya kartu yang sama dipakai di halaman Browse
// (data dari API) maupun My List & Dashboard (data dari database).
import { Link } from '@tanstack/react-router'
import { ImageOff, Star } from 'lucide-react'
import { AddToListButton } from '@/features/list/AddToListButton'
import type { AnimeSnapshot } from './animeRow'

type AnimeCardProps = { anime: AnimeSnapshot }

export function AnimeCard({ anime }: AnimeCardProps) {
  const meta = [anime.type, anime.episodes ? `${anime.episodes} eps` : null, anime.year].filter(Boolean).join(' · ')

  return (
    // Pembungkus relative: tombol tambah diposisikan absolut DI LUAR <Link>.
    // Tombol tidak boleh berada di dalam <a> — selain HTML tidak sah, kliknya akan ikut membuka halaman detail.
    <div className="group relative">
      <Link to="/anime/$malId" params={{ malId: anime.mal_id }} className="block">
        <div className="relative aspect-2/3 overflow-hidden rounded-lg bg-slate-900 ring-1 ring-slate-800 transition group-hover:ring-blue-500">
          {anime.image_url ? (
            <img
              src={anime.image_url}
              alt={anime.title}
              loading="lazy"
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-slate-700">
              <ImageOff className="size-8" />
            </div>
          )}

          {anime.mal_score != null && (
            <span className="absolute right-1.5 bottom-1.5 inline-flex items-center gap-1 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-xs font-semibold text-blue-300 backdrop-blur">
              <Star className="size-3 fill-current" />
              {anime.mal_score.toFixed(2)}
            </span>
          )}
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium text-slate-100 transition-colors group-hover:text-blue-300">
          {anime.title}
        </p>
        {meta && <p className="mt-0.5 text-xs text-slate-500">{meta}</p>}
      </Link>

      {/* Visibilitas tombol diatur di dalam AddToListButton sendiri, karena hanya komponen itu
          yang tahu apakah anime sudah ada di list (kalau sudah, penandanya harus selalu terlihat). */}
      <div className="absolute top-1.5 left-1.5">
        <AddToListButton anime={anime} />
      </div>
    </div>
  )
}

// Versi placeholder saat data belum ada — bentuknya sama supaya layout tidak melompat
export function AnimeCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-2/3 rounded-lg bg-slate-800" />
      <div className="mt-2 h-4 w-4/5 rounded bg-slate-800" />
      <div className="mt-1.5 h-3 w-2/5 rounded bg-slate-800" />
    </div>
  )
}
