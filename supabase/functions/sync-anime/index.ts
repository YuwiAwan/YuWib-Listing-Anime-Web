// Edge Function sync-anime: SATU-SATUNYA jalan untuk menulis ke tabel `anime`.
//
// Kenapa ada: tabel `anime` dibaca bersama oleh semua user. Dulu browser boleh menulis langsung,
// artinya user mana pun bisa mengirim judul/poster palsu untuk anime apa saja. Sekarang browser
// hanya menyebut ID anime yang ingin disimpan; datanya diambil server ini sendiri dari API,
// jadi isinya tidak bisa diatur oleh pemanggil. Policy tulis untuk user sudah dihapus
// (migration 20260930090000_lock_anime_writes.sql).
//
// Permintaan : POST { "malIds": [52991, 5114] }   — maksimal 25 ID, wajib login
// Jawaban    : { synced: [...], fresh: [...], failed: [...] }
//   synced = diambil dari API lalu disimpan
//   fresh  = sudah ada dan masih segar, tidak diambil ulang
//   failed = tidak ada di MAL atau semua penyedia gagal
import '@supabase/functions-js/edge-runtime.d.ts'
import { withSupabase } from '@supabase/server'
import { toSnapshot, type ApiAnime } from './snapshot.ts'

// Urutan = prioritas; sama dengan src/features/anime/api.ts di sisi browser
const HOSTS = ['https://api.tenrai.org/v1', 'https://api.jikan.moe/v4']

// Batas per permintaan. Membatasi seberapa banyak kerja yang bisa dipicu satu panggilan,
// dan menjaga function selesai jauh sebelum batas waktu eksekusi.
const MAX_IDS = 25
const GAP_MS = 350 // jeda antar request ke API, di bawah batas Jikan 3 req/detik

const DAY_MS = 24 * 60 * 60 * 1000
const STALE_AIRING = 1 * DAY_MS // anime yang masih tayang: jumlah episodenya bertambah tiap minggu
const STALE_FINISHED = 7 * DAY_MS // anime tamat: datanya nyaris tidak berubah

type SyncResult = { synced: number[]; fresh: number[]; failed: number[] }

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Ambil satu anime. null = anime memang tidak ada (404); error = semua penyedia bermasalah.
async function fetchAnime(malId: number): Promise<ApiAnime | null> {
  for (const host of HOSTS) {
    try {
      const res = await fetch(`${host}/anime/${malId}`)
      if (res.ok) return ((await res.json()) as { data: ApiAnime }).data
      if (res.status === 404) return null
      // 429 / 5xx → coba penyedia berikutnya
    } catch {
      // gangguan jaringan → coba penyedia berikutnya
    }
  }
  throw new Error(`Semua penyedia gagal untuk anime ${malId}`)
}

// Validasi isi permintaan: array ID bulat positif, tanpa duplikat, maksimal MAX_IDS
function parseIds(body: unknown): number[] | string {
  const raw = (body as { malIds?: unknown } | null)?.malIds
  if (!Array.isArray(raw) || raw.length === 0) return 'malIds harus berupa array berisi ID anime'
  if (raw.length > MAX_IDS) return `Maksimal ${MAX_IDS} ID per permintaan`
  if (!raw.every((id) => Number.isInteger(id) && id > 0)) return 'Setiap ID harus bilangan bulat positif'
  return [...new Set(raw as number[])]
}

export default {
  // auth: 'user' → hanya user yang login (JWT valid) yang bisa memanggil; pengunjung anonim ditolak
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') return Response.json({ error: 'Gunakan POST' }, { status: 405 })

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Body harus JSON' }, { status: 400 })
    }

    const ids = parseIds(body)
    if (typeof ids === 'string') return Response.json({ error: ids }, { status: 400 })

    // supabaseAdmin melewati RLS — hanya dipakai di sini, di server, dengan data yang diambil server sendiri
    const db = ctx.supabaseAdmin

    // Anime yang sudah tersimpan dan masih segar tidak perlu diambil ulang dari API
    const { data: existing, error: readError } = await db
      .from('anime')
      .select('mal_id, cached_at, airing_status')
      .in('mal_id', ids)
    if (readError) return Response.json({ error: readError.message }, { status: 500 })

    const now = Date.now()
    const freshIds = new Set(
      (existing ?? [])
        .filter((row) => {
          const limit = row.airing_status === 'Currently Airing' ? STALE_AIRING : STALE_FINISHED
          return now - new Date(row.cached_at).getTime() < limit
        })
        .map((row) => row.mal_id),
    )

    const result: SyncResult = { synced: [], fresh: [...freshIds], failed: [] }
    const rows = []

    for (const malId of ids.filter((id) => !freshIds.has(id))) {
      if (rows.length + result.failed.length > 0) await sleep(GAP_MS)
      try {
        const anime = await fetchAnime(malId)
        if (anime) {
          rows.push({ ...toSnapshot(anime), cached_at: new Date().toISOString() })
          result.synced.push(malId)
        } else {
          result.failed.push(malId)
        }
      } catch {
        result.failed.push(malId)
      }
    }

    if (rows.length > 0) {
      const { error: writeError } = await db.from('anime').upsert(rows, { onConflict: 'mal_id' })
      if (writeError) return Response.json({ error: writeError.message }, { status: 500 })
    }

    return Response.json(result)
  }),
}
