// Trailer YouTube. Iframe baru dipasang setelah user menekan tombol putar — sebelum itu hanya
// thumbnail, supaya halaman tidak memuat player (dan skrip YouTube) untuk video yang mungkin tak ditonton.
import { useState } from 'react'
import { Play } from 'lucide-react'

export function TrailerEmbed({ embedUrl, title }: { embedUrl: string | null; title: string }) {
  const [playing, setPlaying] = useState(false)
  if (!embedUrl) return null

  // API mengembalikan URL dengan autoplay=1. Saat dipasang setelah klik, autoplay justru diinginkan;
  // yang dibuang hanya enablejsapi agar YouTube tidak perlu memuat skrip API tambahan.
  const src = embedUrl.replace('&enablejsapi=1', '').replace('?enablejsapi=1&', '?')

  // ID video diambil dari URL embed untuk mengambil thumbnail statis
  const videoId = embedUrl.match(/embed\/([\w-]+)/)?.[1]

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-slate-100">Trailer</h2>
      <div className="aspect-video overflow-hidden rounded-xl bg-slate-900 ring-1 ring-slate-800">
        {playing ? (
          <iframe
            src={src}
            title={`Trailer ${title}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Putar trailer ${title}`}
            className="group relative size-full"
          >
            {videoId && (
              <img
                src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="size-full object-cover opacity-70 transition-opacity group-hover:opacity-90"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-blue-600/90 text-slate-50 transition-transform group-hover:scale-110">
                <Play className="size-6 fill-current" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
