// Client HTTP untuk data anime. Dua penyedia mengimplementasikan skema yang SAMA (Jikan v4),
// jadi keduanya bisa saling menggantikan tanpa mengubah tipe atau komponen:
//   1. Tenrai (primer)   — sejak Sep 2026 dipakai karena search/seasons Jikan bermasalah
//   2. Jikan  (cadangan) — otomatis dipakai kalau Tenrai gagal
// Tugas file ini: pilih host, jaga jarak antar request (rate limit), retry, dan bungkus error.

// Urutan = prioritas. minGapMs: jeda minimum antar request ke host itu.
// Jikan resmi membatasi 3 req/detik; Tenrai jauh lebih longgar (8 request beruntun tidak kena 429).
type ApiHost = { name: string; baseUrl: string; minGapMs: number }

const HOSTS: ApiHost[] = [
  { name: 'Tenrai', baseUrl: 'https://api.tenrai.org/v1', minGapMs: 150 },
  { name: 'Jikan', baseUrl: 'https://api.jikan.moe/v4', minGapMs: 400 },
]

const MAX_RETRY = 1 // percobaan ulang per host sebelum pindah ke host berikutnya
const COOLDOWN_MS = 60_000 // host yang gagal dilewati selama 1 menit, supaya tidak menunggu timeout tiap request

type QueryParams = Record<string, string | number | boolean | undefined>

// Error dari penyedia data, membawa HTTP status + nama host untuk pesan UI yang jelas
export class AnimeApiError extends Error {
  readonly status: number
  readonly host: string

  constructor(status: number, host: string, message: string) {
    super(message)
    this.name = 'AnimeApiError'
    this.status = status
    this.host = host
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Kapan request terakhir dikirim ke tiap host, dan sampai kapan sebuah host dianggap bermasalah
const lastRequestAt = new Map<string, number>()
const unhealthyUntil = new Map<string, number>()

// Antrean global: request berikutnya menunggu yang sebelumnya selesai + jeda minimum host.
// Rantai promise sengaja tidak pernah putus (catch → undefined) supaya satu kegagalan tidak menghentikan antrean.
let queue: Promise<unknown> = Promise.resolve()

function enqueue<T>(host: ApiHost, task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = (lastRequestAt.get(host.name) ?? 0) + host.minGapMs - Date.now()
    if (wait > 0) await sleep(wait)
    lastRequestAt.set(host.name, Date.now())
    return task()
  })
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

// Ambil data dari SATU host, dengan retry untuk 429 (rate limit) dan 5xx (server bermasalah)
async function fetchFromHost<T>(
  host: ApiHost,
  path: string,
  params: QueryParams,
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(host.baseUrl + path)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  for (let attempt = 0; ; attempt++) {
    const res = await enqueue(host, () => {
      if (signal?.aborted) throw new DOMException('Request dibatalkan', 'AbortError')
      return fetch(url, { signal })
    })

    if (res.ok) return (await res.json()) as T

    const retryable = res.status === 429 || res.status >= 500
    if (retryable && attempt < MAX_RETRY) {
      await sleep(1000 * (attempt + 1))
      continue
    }

    let message = res.statusText
    try {
      message = ((await res.json()) as { message?: string }).message ?? message
    } catch {
      // body bukan JSON — pakai statusText
    }
    throw new AnimeApiError(res.status, host.name, message)
  }
}

// Titik masuk tunggal untuk semua request data anime.
// Mencoba host sesuai prioritas; host yang gagal ditandai bermasalah dan dilewati sementara.
// `signal` datang dari TanStack Query: request yang tidak relevan lagi (user lanjut mengetik) dibatalkan.
export async function apiFetch<T>(path: string, params: QueryParams = {}, signal?: AbortSignal): Promise<T> {
  const now = Date.now()
  const healthy = HOSTS.filter((host) => (unhealthyUntil.get(host.name) ?? 0) <= now)
  // Kalau semua host sedang dalam masa cooldown, tetap coba semuanya — lebih baik lambat daripada mati total
  const candidates = healthy.length > 0 ? healthy : HOSTS

  let lastError: unknown
  for (const host of candidates) {
    try {
      const data = await fetchFromHost<T>(host, path, params, signal)
      unhealthyUntil.delete(host.name) // host pulih
      return data
    } catch (error) {
      // Dibatalkan user/Query — bukan kegagalan host, jangan pindah host
      if (error instanceof DOMException && error.name === 'AbortError') throw error

      // 4xx selain 429 adalah jawaban sah (mis. 404 = anime memang tidak ada) → host lain akan menjawab sama
      if (error instanceof AnimeApiError && error.status < 500 && error.status !== 429) throw error

      unhealthyUntil.set(host.name, Date.now() + COOLDOWN_MS)
      lastError = error
    }
  }

  throw lastError
}

// Pesan ramah untuk ditampilkan di UI berdasarkan jenis error
export function describeApiError(error: unknown): string {
  if (error instanceof AnimeApiError) {
    if (error.status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'
    if (error.status >= 500) return 'Semua sumber data anime sedang bermasalah. Coba lagi beberapa saat.'
    if (error.status === 404) return 'Data tidak ditemukan di MyAnimeList.'
    return `${error.host} mengembalikan error ${error.status}: ${error.message}`
  }
  if (error instanceof TypeError) return 'Tidak bisa terhubung ke sumber data. Periksa koneksi internet.'
  return 'Terjadi kesalahan saat mengambil data.'
}
