// Menjalankan impor daftar MAL ke database. Bagian yang lambat adalah mengambil snapshot anime
// dari API satu per satu (dibatasi rate limit), jadi prosesnya melaporkan progres dan
// MELEWATI anime yang snapshot-nya sudah ada di tabel `anime`.
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { jikanToSnapshot, type AnimeSnapshot } from '@/features/anime/animeRow'
import { apiFetch } from '@/features/anime/api'
import { listEntriesKey } from '@/features/list/queries'
import { supabase } from '@/lib/supabase'
import type { JikanAnime, JikanResponse } from '@/types/jikan.types'
import type { MalEntry } from './malImport'

// Supabase menerima banyak baris sekaligus; 100 per permintaan cukup aman untuk ukuran payload
const CHUNK = 100

export type ImportProgress = {
  phase: 'idle' | 'checking' | 'fetching' | 'saving' | 'done' | 'error'
  fetched: number // snapshot yang sudah diambil dari API
  toFetch: number // snapshot yang perlu diambil (yang sudah ada di DB tidak dihitung)
  imported: number
  failed: { malId: number; title: string }[]
  message?: string
}

const IDLE: ImportProgress = { phase: 'idle', fetched: 0, toFetch: 0, imported: 0, failed: [] }

export function useMalImport() {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<ImportProgress>(IDLE)

  function reset() {
    setProgress(IDLE)
  }

  async function run(entries: MalEntry[], userId: string) {
    const update = (patch: Partial<ImportProgress>) => setProgress((prev) => ({ ...prev, ...patch }))

    try {
      // 1. Cari anime yang snapshot-nya SUDAH ada, supaya tidak diambil ulang dari API.
      //    Untuk impor kedua kalinya, langkah ini bisa memangkas hampir semua request.
      update({ phase: 'checking', fetched: 0, toFetch: 0, imported: 0, failed: [] })
      const malIds = entries.map((entry) => entry.malId)
      const existing = new Set<number>()
      for (let i = 0; i < malIds.length; i += CHUNK) {
        const { data, error } = await supabase
          .from('anime')
          .select('mal_id')
          .in('mal_id', malIds.slice(i, i + CHUNK))
        if (error) throw error
        for (const row of data) existing.add(row.mal_id)
      }

      const missing = entries.filter((entry) => !existing.has(entry.malId))
      update({ phase: 'fetching', toFetch: missing.length })

      // 2. Ambil snapshot yang belum ada. apiFetch sudah mengantre sendiri sesuai rate limit,
      //    jadi perulangan ini aman dijalankan berurutan tanpa penundaan manual.
      const snapshots: AnimeSnapshot[] = []
      const failed: ImportProgress['failed'] = []
      for (const [index, entry] of missing.entries()) {
        try {
          const res = await apiFetch<JikanResponse<JikanAnime>>(`/anime/${entry.malId}`)
          snapshots.push(jikanToSnapshot(res.data))
        } catch {
          // Anime yang sudah dihapus dari MAL tidak boleh menggagalkan seluruh impor
          failed.push({ malId: entry.malId, title: entry.title })
        }
        update({ fetched: index + 1, failed: [...failed] })
      }

      // 3. Simpan snapshot, lalu entri list. Urutannya wajib: list_entries.mal_id
      //    punya foreign key ke anime.mal_id.
      update({ phase: 'saving' })
      for (let i = 0; i < snapshots.length; i += CHUNK) {
        const { error } = await supabase
          .from('anime')
          .upsert(snapshots.slice(i, i + CHUNK), { onConflict: 'mal_id' })
        if (error) throw error
      }

      const failedIds = new Set(failed.map((item) => item.malId))
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
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await supabase
          .from('list_entries')
          .upsert(rows.slice(i, i + CHUNK), { onConflict: 'user_id,mal_id' })
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
