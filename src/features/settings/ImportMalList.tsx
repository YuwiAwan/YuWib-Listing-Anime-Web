// Kartu impor daftar MyAnimeList. Alurnya tiga langkah: pilih berkas → tinjau isinya → jalankan impor.
// Peninjauan sengaja dipisah supaya user melihat apa yang akan disimpan sebelum menyentuh database.
import { useState } from 'react'
import { CircleAlert, FileUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/features/auth/useSession'
import { LIST_STATUS_META, type ListStatus } from '@/features/list/status'
import { parseMalXml, readMalFile, type MalEntry } from './malImport'
import { useMalImport } from './useMalImport'

export function ImportMalList() {
  const user = useUser()
  const { progress, run, reset } = useMalImport()
  const [preview, setPreview] = useState<{ entries: MalEntry[]; skipped: number; fileName: string } | null>(null)
  const [readError, setReadError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setReadError(null)
    reset()
    try {
      const xml = await readMalFile(file)
      const result = parseMalXml(xml)
      if (result.entries.length === 0) {
        setReadError('Tidak ada entri anime yang terbaca di berkas ini.')
        setPreview(null)
        return
      }
      setPreview({ ...result, fileName: file.name })
    } catch (error) {
      setPreview(null)
      setReadError(error instanceof Error ? error.message : 'Berkas tidak bisa dibaca.')
    }
  }

  const busy = progress.phase === 'fetching' || progress.phase === 'saving'

  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div>
        <h2 className="text-sm font-medium text-slate-100">Impor dari MyAnimeList</h2>
        <p className="mt-1 text-xs text-slate-500">
          Ambil berkasnya di MAL → Export My List → Anime List. Berkas <code className="text-slate-400">.xml.gz</code>{' '}
          bisa langsung dipakai tanpa diekstrak. Anime yang sudah ada di listmu akan diperbarui, bukan diduplikasi.
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-sm text-slate-400 transition-colors hover:border-blue-700 hover:text-blue-300">
        <FileUp className="size-4" />
        Pilih berkas .xml atau .xml.gz
        <input
          type="file"
          accept=".xml,.gz,application/xml,text/xml,application/gzip"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = '' // reset supaya berkas yang sama bisa dipilih ulang
          }}
        />
      </label>

      {readError && (
        <p className="inline-flex items-center gap-1.5 text-xs text-rose-400">
          <CircleAlert className="size-3.5" />
          {readError}
        </p>
      )}

      {preview && progress.phase === 'idle' && (
        <Preview
          preview={preview}
          onImport={() => user && run(preview.entries, user.id)}
          onCancel={() => setPreview(null)}
        />
      )}

      {progress.phase !== 'idle' && <Progress progress={progress} onDone={() => { setPreview(null); reset() }} />}
    </section>
  )
}

// Ringkasan isi berkas sebelum disimpan
function Preview({
  preview,
  onImport,
  onCancel,
}: {
  preview: { entries: MalEntry[]; skipped: number; fileName: string }
  onImport: () => void
  onCancel: () => void
}) {
  // Hitung jumlah per status untuk ditampilkan sebagai rincian
  const counts = preview.entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.status] = (acc[entry.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm text-slate-200">
        <span className="font-medium text-blue-300">{preview.entries.length}</span> anime terbaca dari{' '}
        <span className="text-slate-400">{preview.fileName}</span>
        {preview.skipped > 0 && <span className="text-slate-500"> · {preview.skipped} baris dilewati</span>}
      </p>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {Object.entries(counts).map(([status, count]) => (
          <li key={status} className="flex justify-between gap-2">
            <span className="text-slate-400">{LIST_STATUS_META[status as ListStatus].label}</span>
            <span className="font-medium text-slate-200 tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">
        Server mengambil data judul & poster untuk anime yang belum tersimpan, 25 anime per kelompok.
        Karena batas laju API, prosesnya sekitar 3 anime per detik — biarkan halaman ini terbuka sampai selesai.
      </p>

      <div className="flex gap-2">
        <Button onClick={onImport}>Mulai impor</Button>
        <Button variant="ghost" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  )
}

// Tampilan progres + hasil akhir
function Progress({
  progress,
  onDone,
}: {
  progress: ReturnType<typeof useMalImport>['progress']
  onDone: () => void
}) {
  const percent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0

  if (progress.phase === 'error') {
    return (
      <div className="space-y-2 rounded-lg border border-rose-900/60 bg-rose-950/30 p-4">
        <p className="text-sm text-rose-200">{progress.message}</p>
        <Button variant="outline" size="sm" onClick={onDone}>
          Tutup
        </Button>
      </div>
    )
  }

  if (progress.phase === 'done') {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-900/60 bg-emerald-950/20 p-4">
        <p className="text-sm text-emerald-200">{progress.imported} anime berhasil diimpor.</p>
        {progress.failed.length > 0 && (
          <details className="text-xs text-slate-400">
            <summary className="cursor-pointer">{progress.failed.length} anime gagal diambil datanya</summary>
            <ul className="mt-1 space-y-0.5">
              {progress.failed.map((item) => (
                <li key={item.malId}>
                  #{item.malId} {item.title}
                </li>
              ))}
            </ul>
          </details>
        )}
        <Button variant="outline" size="sm" onClick={onDone}>
          Selesai
        </Button>
      </div>
    )
  }

  const label =
    progress.phase === 'fetching'
      ? `Menyiapkan data anime ${progress.processed} dari ${progress.total}…`
      : 'Menyimpan ke database…'

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <p className="inline-flex items-center gap-2 text-sm text-slate-300">
        <Loader2 className="size-4 animate-spin text-blue-400" />
        {label}
      </p>
      {progress.phase === 'fetching' && progress.total > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  )
}
