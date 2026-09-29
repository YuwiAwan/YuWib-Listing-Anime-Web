// Sinopsis dengan pemendekan: teks panjang dipotong sampai tombol "Selengkapnya" ditekan,
// supaya bagian penting halaman (relasi, panel edit) tidak terdorong jauh ke bawah.
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function Synopsis({ text }: { text: string | null }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <p className="text-sm text-slate-500">Belum ada sinopsis.</p>

  // MAL menutup sinopsis dengan baris sumber penulisan; tidak berguna untuk dibaca
  const clean = text.replace(/\s*\[Written by MAL Rewrite\]\s*$/, '').trim()
  const isLong = clean.length > 420

  return (
    <div className="space-y-2">
      <p className={`text-sm leading-relaxed whitespace-pre-line text-slate-300 ${!expanded && isLong ? 'line-clamp-5' : ''}`}>
        {clean}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
        >
          {expanded ? (
            <>
              Ringkas <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              Selengkapnya <ChevronDown className="size-3" />
            </>
          )}
        </button>
      )}
    </div>
  )
}
