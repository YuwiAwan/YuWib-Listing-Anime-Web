// Menyegarkan snapshot anime di database memakai data yang BARU SAJA diambil halaman detail.
// Tanpa ini, anime yang masih tayang akan selamanya menampilkan jumlah episode lama di halaman
// My List dan Dashboard, karena kedua halaman itu sengaja tidak pernah memanggil API.
//
// Penyegaran hanya dilakukan kalau anime ada di list user (kalau tidak, tidak ada yang terbantu)
// dan snapshot-nya memang sudah layak disegarkan.
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { jikanToSnapshot } from '@/features/anime/animeRow'
import { useUser } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'
import type { JikanAnime } from '@/types/jikan.types'
import { listEntriesKey, useMyEntry } from './queries'

const DAY_MS = 24 * 60 * 60 * 1000
const STALE_FINISHED = 7 * DAY_MS // anime tamat: datanya nyaris tidak berubah
const STALE_AIRING = 1 * DAY_MS // anime masih tayang: jumlah episode bertambah tiap minggu

export function useRefreshSnapshot(anime: JikanAnime) {
  const user = useUser()
  const queryClient = useQueryClient()
  const { data: entry } = useMyEntry(anime.mal_id)
  // Tandai anime yang sudah disegarkan pada sesi ini, supaya render ulang tidak menulis berkali-kali
  const done = useRef<number | null>(null)

  useEffect(() => {
    if (!user || !entry || done.current === anime.mal_id) return

    const age = Date.now() - new Date(entry.anime.cached_at).getTime()
    const limit = entry.anime.airing_status === 'Currently Airing' ? STALE_AIRING : STALE_FINISHED
    if (age < limit) return

    done.current = anime.mal_id
    // Menulis di latar belakang: kegagalan tidak perlu mengganggu halaman, data lama tetap bisa dipakai
    void supabase
      .from('anime')
      .upsert({ ...jikanToSnapshot(anime), cached_at: new Date().toISOString() }, { onConflict: 'mal_id' })
      .then(({ error }) => {
        if (!error) queryClient.invalidateQueries({ queryKey: listEntriesKey(user.id) })
      })
  }, [anime, entry, user, queryClient])
}
