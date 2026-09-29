// Menyegarkan snapshot anime di database saat halaman detail dibuka.
// Tanpa ini, anime yang masih tayang akan selamanya menampilkan jumlah episode lama di halaman
// My List dan Dashboard, karena kedua halaman itu sengaja tidak pernah memanggil API.
//
// Penyegarannya dilakukan SERVER (Edge Function sync-anime), bukan browser: browser tidak lagi
// punya izin menulis tabel `anime`. Pemeriksaan "sudah basi atau belum" di sini hanya supaya
// tidak memanggil function tanpa perlu — server tetap memeriksa ulang dan menjadi penentu akhirnya.
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncAnime } from '@/features/anime/syncAnime'
import { useUser } from '@/features/auth/useSession'
import { listEntriesKey, useMyEntry } from './queries'

const DAY_MS = 24 * 60 * 60 * 1000
const STALE_FINISHED = 7 * DAY_MS // anime tamat: datanya nyaris tidak berubah
const STALE_AIRING = 1 * DAY_MS // anime masih tayang: jumlah episode bertambah tiap minggu

export function useRefreshSnapshot(malId: number) {
  const user = useUser()
  const queryClient = useQueryClient()
  const { data: entry } = useMyEntry(malId)
  // Tandai anime yang sudah diminta pada sesi ini, supaya render ulang tidak memanggil berkali-kali
  const requested = useRef<number | null>(null)

  useEffect(() => {
    // Hanya untuk anime yang ada di list user — kalau tidak, tidak ada halaman pribadi yang terbantu
    if (!user || !entry || requested.current === malId) return

    const age = Date.now() - new Date(entry.anime.cached_at).getTime()
    const limit = entry.anime.airing_status === 'Currently Airing' ? STALE_AIRING : STALE_FINISHED
    if (age < limit) return

    requested.current = malId
    // Berjalan di latar belakang: kalau gagal, data lama tetap bisa dipakai tanpa mengganggu halaman
    syncAnime([malId])
      .then((result) => {
        if (result.synced.includes(malId)) queryClient.invalidateQueries({ queryKey: listEntriesKey(user.id) })
      })
      .catch(() => {})
  }, [malId, entry, user, queryClient])
}
