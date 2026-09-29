// Menjalankan impor daftar MAL ke database, dalam dua tahap:
//   1. snapshot anime disimpan SERVER lewat Edge Function sync-anime, per kelompok 25 ID.
//      Server melewati anime yang sudah tersimpan & masih segar, jadi impor ulang hampir tanpa request API.
//   2. entri list disimpan browser ke list_entries (dilindungi RLS: hanya milik user sendiri).
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SYNC_BATCH_SIZE, syncAnime } from '@/features/anime/syncAnime'
import { listEntriesKey } from '@/features/list/queries'
import { supabase } from '@/lib/supabase'
import type { MalEntry } from './malImport'

// Supabase menerima banyak baris sekaligus; 100 per permintaan cukup aman untuk ukuran payload
const ENTRY_CHUNK = 100

export type ImportProgress = {
  phase: 'idle' | 'fetching' | 'saving' | 'done' | 'error'
  processed: number // anime yang sudah diproses server (baik diambil baru maupun sudah ada)
  total: number
  imported: number
  failed: { malId: number; title: string }[]
  message?: string
}

const IDLE: ImportProgress = { phase: 'idle', processed: 0, total: 0, imported: 0, failed: [] }

export function useMalImport() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<ImportProgress>(IDLE)

  function reset() {
    setProgress(IDLE)
  }

  async function run(entries: MalEntry[], userId: string) {
    const update = (patch: Partial<ImportProgress>) => setProgress((prev) => ({ ...prev, ...patch }))
    const titleById = new Map(entries.map((entry) => [entry.malId, entry.title]))

    try {
      // 1. Snapshot lewat server, per kelompok. Kelompok yang gagal total (mis. jaringan putus)
      //    dicatat sebagai gagal semua, tapi tidak menghentikan kelompok berikutnya.
      update({ phase: 'fetching', processed: 0, total: entries.length, imported: 0, failed: [] })
      const failedIds = new Set<number>()
      const ids = entries.map((entry) => entry.malId)

      for (let i = 0; i < ids.length; i += SYNC_BATCH_SIZE) {
        const batch = ids.slice(i, i + SYNC_BATCH_SIZE)
        try {
          const result = await syncAnime(batch)
          result.failed.forEach((id) => failedIds.add(id))
        } catch {
          batch.forEach((id) => failedIds.add(id))
        }
        update({
          processed: Math.min(i + SYNC_BATCH_SIZE, ids.length),
          failed: [...failedIds].map((malId) => ({ malId, title: titleById.get(malId) ?? `#${malId}` })),
        })
      }

      // 2. Entri list — hanya untuk anime yang snapshot-nya berhasil tersimpan,
      //    karena list_entries.mal_id punya foreign key ke anime.mal_id
      update({ phase: 'saving' })
      const rows = entries
        .filter((entry) => !failedIds.has(entry.malId))
        .map((entry) => ({
          user_id: userId,
          mal_id: entry.malId,
          status: entry.status,
          score: entry.score,
          episodes_watched: entry.episodesWatched,
          start_date: entry.startDate,
          finish_date: entry.finishDate,
          rewatch_count: entry.rewatchCount,
          notes: entry.notes,
        }))

      // onConflict user_id,mal_id → impor ulang MEMPERBARUI entri yang sudah ada, bukan menggandakan
      for (let i = 0; i < rows.length; i += ENTRY_CHUNK) {
        const { error } = await supabase
          .from('list_entries')
          .upsert(rows.slice(i, i + ENTRY_CHUNK), { onConflict: 'user_id,mal_id' })
        if (error) throw error
      }

      await queryClient.invalidateQueries({ queryKey: listEntriesKey(userId) })
      update({ phase: 'done', imported: rows.length })
    } catch (error) {
      update({ phase: 'error', message: error instanceof Error ? error.message : 'Impor gagal.' })
    }
  }

  return { progress, run, reset }
}
