// Ekspor list pribadi ke berkas JSON. Berguna sebagai cadangan sebelum mencoba impor,
// dan supaya datamu tidak terkunci di dalam aplikasi ini.
import { Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useUser } from '@/features/auth/useSession'
import { listEntriesQueryOptions } from '@/features/list/queries'

export function ExportList() {
  const user = useUser()
  const { data: entries } = useQuery({ ...listEntriesQueryOptions(user?.id ?? ''), enabled: !!user })

  function handleExport() {
    if (!entries) return

    // Bentuk ekspor sengaja datar dan memakai mal_id: mudah dibaca ulang, dan bisa dicocokkan
    // dengan layanan lain yang juga memakai ID MyAnimeList.
    const payload = {
      exported_at: new Date().toISOString(),
      total: entries.length,
      entries: entries.map((entry) => ({
        mal_id: entry.mal_id,
        title: entry.anime.title,
        status: entry.status,
        score: entry.score,
        episodes_watched: entry.episodes_watched,
        start_date: entry.start_date,
        finish_date: entry.finish_date,
        rewatch_count: entry.rewatch_count,
        is_favorite: entry.is_favorite,
        notes: entry.notes,
      })),
    }

    // Berkas dibuat di browser lalu diunduh lewat tautan sementara — tidak ada data yang dikirim ke mana pun
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `yuwib-list-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div>
        <h2 className="text-sm font-medium text-slate-100">Ekspor list</h2>
        <p className="mt-1 text-xs text-slate-500">
          Simpan seluruh listmu sebagai berkas JSON. Disarankan dilakukan sebelum mengimpor.
        </p>
      </div>
      <Button variant="outline" onClick={handleExport} disabled={!entries || entries.length === 0}>
        <Download data-icon="inline-start" />
        Unduh {entries ? `${entries.length} entri` : '…'}
      </Button>
    </section>
  )
}
