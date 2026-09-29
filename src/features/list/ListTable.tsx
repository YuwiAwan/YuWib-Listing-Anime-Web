// Tampilan tabel My List: padat, satu baris per anime, semua kontrol edit langsung di barisnya.
// Cocok untuk list panjang (ratusan judul) karena satu layar memuat jauh lebih banyak daripada grid poster.
import { Link } from '@tanstack/react-router'
import { ImageOff } from 'lucide-react'
import { ProgressStepper } from './ProgressStepper'
import { ScoreSelect } from './ScoreSelect'
import { StatusSelect } from './StatusSelect'
import type { ListEntryWithAnime } from './queries'

export function ListTable({ entries }: { entries: ListEntryWithAnime[] }) {
  return (
    // Tabel adalah satu-satunya elemen yang boleh lebih lebar dari layar — dibungkus scroll horizontal sendiri
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs text-slate-400">
            <th className="px-3 py-2 font-medium">Anime</th>
            <th className="px-3 py-2 font-medium">Progress</th>
            <th className="px-3 py-2 font-medium">Skor</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium whitespace-nowrap">Diubah</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <ListTableRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListTableRow({ entry }: { entry: ListEntryWithAnime }) {
  const anime = entry.anime
  const meta = [anime.type, anime.year].filter(Boolean).join(' · ')

  return (
    <tr className="border-b border-slate-800/60 transition-colors last:border-0 hover:bg-slate-900/40">
      <td className="px-3 py-2">
        <Link to="/anime/$malId" params={{ malId: anime.mal_id }} className="group flex items-center gap-3">
          <span className="h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-900 ring-1 ring-slate-800">
            {anime.image_url ? (
              <img src={anime.image_url} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-slate-700">
                <ImageOff className="size-4" />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className="line-clamp-2 font-medium text-slate-100 transition-colors group-hover:text-blue-300">
              {anime.title}
            </span>
            {meta && <span className="mt-0.5 block text-xs text-slate-500">{meta}</span>}
          </span>
        </Link>
      </td>
      <td className="px-3 py-2">
        <ProgressStepper entry={entry} size="sm" />
      </td>
      <td className="px-3 py-2">
        <ScoreSelect entry={entry} />
      </td>
      <td className="px-3 py-2">
        <StatusSelect entry={entry} />
      </td>
      <td className="px-3 py-2 text-xs whitespace-nowrap text-slate-500">
        {new Date(entry.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
    </tr>
  )
}
