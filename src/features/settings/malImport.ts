// Pembacaan berkas ekspor MyAnimeList (Export My List → animelist_*.xml.gz).
// Modul ini hanya MENGURAI berkas menjadi daftar entri; penyimpanannya ada di useMalImport.
//
// Bentuk berkasnya (machine-generated, datar):
//   <myanimelist>
//     <myinfo>…</myinfo>
//     <anime>
//       <series_animedb_id>52991</series_animedb_id>
//       <series_title><![CDATA[Sousou no Frieren]]></series_title>
//       <my_watched_episodes>28</my_watched_episodes>
//       <my_score>10</my_score>
//       <my_status>Completed</my_status>
//       …
//     </anime>
//   </myanimelist>
import type { ListStatus } from '@/features/list/status'

export type MalEntry = {
  malId: number
  title: string
  status: ListStatus
  episodesWatched: number
  score: number | null
  startDate: string | null
  finishDate: string | null
  rewatchCount: number
  notes: string | null
}

export type ParseResult = {
  entries: MalEntry[]
  skipped: number // baris yang tidak bisa dibaca (tanpa id, atau status tidak dikenal)
}

// MAL menulis status sebagai TEKS di berkas ekspornya, tetapi beberapa pembuat berkas lain
// memakai KODE ANGKA yang dipakai form impor MAL. Keduanya diterima supaya berkas dari mana pun jalan.
const STATUS_BY_TEXT: Record<string, ListStatus> = {
  watching: 'watching',
  completed: 'completed',
  'on-hold': 'on_hold',
  onhold: 'on_hold',
  'on hold': 'on_hold',
  dropped: 'dropped',
  'plan to watch': 'plan_to_watch',
  plantowatch: 'plan_to_watch',
}

const STATUS_BY_CODE: Record<string, ListStatus> = {
  '1': 'watching',
  '2': 'completed',
  '3': 'on_hold',
  '4': 'dropped',
  '6': 'plan_to_watch',
}

export function parseMalStatus(raw: string): ListStatus | null {
  const value = raw.trim()
  return STATUS_BY_CODE[value] ?? STATUS_BY_TEXT[value.toLowerCase()] ?? null
}

// MAL menulis tanggal kosong sebagai "0000-00-00"; kolom DATE Postgres menolak itu
export function parseMalDate(raw: string): string | null {
  const value = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  return value.startsWith('0000') || value.endsWith('-00-00') ? null : value
}

// Skor 0 di MAL berarti "belum dinilai", bukan nilai nol
function parseScore(raw: string): number | null {
  const value = Number(raw.trim())
  return Number.isInteger(value) && value >= 1 && value <= 10 ? value : null
}

function parseCount(raw: string): number {
  const value = Number(raw.trim())
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

// Ubah satu kumpulan field <anime> menjadi MalEntry. Fungsi murni supaya mudah diuji.
// Mengembalikan null kalau barisnya tidak berguna (tanpa id anime atau status tidak dikenal).
export function mapMalEntry(fields: Record<string, string>): MalEntry | null {
  const malId = Number(fields.series_animedb_id?.trim())
  if (!Number.isInteger(malId) || malId <= 0) return null

  const status = parseMalStatus(fields.my_status ?? '')
  if (!status) return null

  const notes = fields.my_comments?.trim()

  return {
    malId,
    title: fields.series_title?.trim() || `Anime #${malId}`,
    status,
    episodesWatched: parseCount(fields.my_watched_episodes ?? ''),
    score: parseScore(fields.my_score ?? ''),
    startDate: parseMalDate(fields.my_start_date ?? ''),
    finishDate: parseMalDate(fields.my_finish_date ?? ''),
    rewatchCount: parseCount(fields.my_times_watched ?? ''),
    notes: notes ? notes : null,
  }
}

// Ambil isi seluruh elemen <anime> beserta field anaknya. Memakai DOMParser bawaan browser
// supaya CDATA dan entitas XML (&amp; dsb.) ditangani dengan benar, bukan ditebak sendiri.
export function extractAnimeFields(xml: string): Record<string, string>[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')

  // parsererror muncul kalau berkasnya rusak atau bukan XML sama sekali
  const failure = doc.querySelector('parsererror')
  if (failure) throw new Error('Berkas tidak bisa dibaca sebagai XML.')

  return [...doc.querySelectorAll('myanimelist > anime')].map((node) => {
    const fields: Record<string, string> = {}
    for (const child of node.children) fields[child.tagName] = child.textContent ?? ''
    return fields
  })
}

export function parseMalXml(xml: string): ParseResult {
  const rows = extractAnimeFields(xml)
  const entries: MalEntry[] = []
  let skipped = 0

  for (const row of rows) {
    const entry = mapMalEntry(row)
    if (entry) entries.push(entry)
    else skipped += 1
  }

  // Berkas berisi anime yang sama dua kali seharusnya tidak terjadi, tapi kalau terjadi:
  // pertahankan kemunculan PERTAMA (baris asli dari MAL) dan hitung sisanya sebagai dilewati.
  // Ini juga mencegah tabrakan dengan batasan unique (user_id, mal_id) saat menyimpan.
  const unique = new Map<number, MalEntry>()
  for (const entry of entries) {
    if (!unique.has(entry.malId)) unique.set(entry.malId, entry)
  }
  return { entries: [...unique.values()], skipped: skipped + (entries.length - unique.size) }
}

// Berkas dari MAL terunduh dalam bentuk .xml.gz. Dibuka memakai DecompressionStream bawaan browser,
// jadi tidak perlu pustaka tambahan. Berkas .xml biasa (sudah diekstrak sendiri) juga diterima.
export async function readMalFile(file: File): Promise<string> {
  const isGzip = file.name.endsWith('.gz') || (await isGzipMagic(file))
  if (!isGzip) return file.text()

  const stream = file.stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

// Dua byte pertama berkas gzip selalu 0x1f 0x8b — dicek supaya berkas .gz yang namanya sudah diubah tetap terbaca
async function isGzipMagic(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  return head[0] === 0x1f && head[1] === 0x8b
}
