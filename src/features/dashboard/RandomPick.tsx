// "Bingung mau nonton apa": satu anime acak dari plan-to-watch, bisa diacak ulang.
// Seed disimpan di state supaya pilihannya tidak berubah tiap kali komponen dirender ulang
// (mis. setelah menekan +1 di bagian lain halaman).
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Dices, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ListEntryWithAnime } from '@/features/list/queries'
import { randomPlanToWatch } from './sections'

export function RandomPick({ entries }: { entries: ListEntryWithAnime[] }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000))
  const pick = randomPlanToWatch(entries, seed)

  if (!pick) {
    return <p className="text-sm text-slate-500">Belum ada anime di Plan to Watch.</p>
  }

  return (
    <div className="space-y-3">
      <Link to="/anime/$malId" params={{ malId: pick.anime.mal_id }} className="group flex gap-3">
        <span className="h-24 w-16 shrink-0 overflow-hidden rounded bg-slate-900 ring-1 ring-slate-800">
          {pick.anime.image_url ? (
            <img src={pick.anime.image_url} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-slate-700">
              <ImageOff className="size-5" />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 font-medium text-slate-100 transition-colors group-hover:text-blue-300">
            {pick.anime.title}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {[pick.anime.type, pick.anime.episodes ? `${pick.anime.episodes} eps` : null, pick.anime.year]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </Link>

      <Button variant="outline" size="sm" onClick={() => setSeed((value) => value + 1)}>
        <Dices data-icon="inline-start" />
        Acak lagi
      </Button>
    </div>
  )
}
