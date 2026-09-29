// Pemanggil Edge Function sync-anime dari browser. Ini SATU-SATUNYA cara browser menyimpan
// snapshot anime: browser hanya menyebut ID-nya, server yang mengambil datanya dari API
// lalu menyimpan. Browser tidak lagi punya izin menulis ke tabel `anime` (lihat migration
// 20260930090000_lock_anime_writes.sql), jadi isi judul/poster tidak bisa dipalsukan.
import { supabase } from '@/lib/supabase'

// Harus sama dengan MAX_IDS di supabase/functions/sync-anime/index.ts
export const SYNC_BATCH_SIZE = 25

export type SyncResult = {
  synced: number[] // diambil dari API lalu disimpan
  fresh: number[] // sudah tersimpan dan masih segar
  failed: number[] // tidak ada di MAL, atau semua penyedia gagal
}

export async function syncAnime(malIds: number[]): Promise<SyncResult> {
  const { data, error } = await supabase.functions.invoke<SyncResult>('sync-anime', {
    body: { malIds },
  })
  if (error) {
    // Pesan dari function (mis. "Maksimal 25 ID") ada di body respons, bukan di error.message
    let message = error.message
    try {
      const body = await (error as { context?: Response }).context?.json()
      if (body?.error) message = body.error
    } catch {
      // body bukan JSON — pakai pesan bawaan
    }
    throw new Error(message)
  }
  if (!data) throw new Error('Respons sync-anime kosong')
  return data
}
