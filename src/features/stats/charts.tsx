// Komponen grafik halaman Stats. Dibuat sendiri dari elemen HTML biasa, bukan memakai pustaka chart:
// semua grafik di sini keluarga batang (tanpa sumbu, kurva, atau skala rumit), jadi versi buatan sendiri
// lebih kecil dan warnanya bisa dipastikan lolos uji keterbacaan. Warnanya ada di chartColors.ts.
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ListStatus } from '@/features/list/status'
import { SERIES_COLOR, STATUS_FILL } from './chartColors'

// Kartu angka utama (total anime, episode, hari, skor rata-rata). Bukan grafik:
// satu nilai tunggal lebih jelas dibaca sebagai angka besar daripada sebagai batang tunggal.
export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div>
        <h2 className="text-sm font-medium text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

type Datum = { label: string; value: number }

// Grafik kolom (batang vertikal) — dipakai sebaran skor dan jumlah selesai per bulan.
// Ujung atas batang dibulatkan 4px dan menempel di garis dasar, sesuai panduan visualisasi data.
export function ColumnChart({ data, valueSuffix = '' }: { data: Datum[]; valueSuffix?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((datum) => (
        <div key={datum.label} className="group relative flex h-full flex-1 flex-col justify-end gap-1.5">
          {/* Tooltip muncul saat kursor di atas kolom; nilai tidak dicetak di setiap batang supaya tidak ramai */}
          <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs whitespace-nowrap text-slate-100 opacity-0 transition-opacity group-hover:opacity-100">
            {datum.label}: {datum.value}
            {valueSuffix}
          </span>
          <div
            className={cn('w-full rounded-t-[4px] transition-colors', datum.value > 0 ? SERIES_COLOR : 'bg-slate-800')}
            style={{ height: `${Math.max((datum.value / max) * 100, datum.value > 0 ? 4 : 2)}%` }}
          />
          <span className="text-center text-[11px] text-slate-500">{datum.label}</span>
        </div>
      ))}
    </div>
  )
}

// Grafik batang horizontal — dipakai daftar genre, karena nama kategorinya panjang
// dan arah horizontal memberi ruang untuk label tanpa memiringkan teks.
export function BarList({ data, total }: { data: Datum[]; total: number }) {
  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <ul className="space-y-2">
      {data.map((datum) => (
        <li key={datum.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-slate-300">{datum.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-slate-800">
            <span
              className={cn('block h-full rounded-full', SERIES_COLOR)}
              style={{ width: `${(datum.value / max) * 100}%` }}
            />
          </span>
          <span className="text-xs text-slate-400 tabular-nums">
            {datum.value}
            <span className="text-slate-600"> ({Math.round((datum.value / total) * 100)}%)</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// Bar bertumpuk satu baris untuk komposisi status, dengan legenda berlabel di bawahnya.
// Identitas tidak pernah hanya mengandalkan warna — setiap segmen punya label dan angka di legenda.
export function StackedBar({
  segments,
}: {
  segments: { key: ListStatus; label: string; value: number }[]
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const visible = segments.filter((segment) => segment.value > 0)

  return (
    <div className="space-y-3">
      {/* gap-0.5 memberi jarak 2px antar segmen supaya batas warna tetap terbaca */}
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {visible.map((segment) => (
          <div
            key={segment.key}
            title={`${segment.label}: ${segment.value}`}
            className={cn('h-full first:rounded-l-full last:rounded-r-full', STATUS_FILL[segment.key])}
            style={{ width: `${(segment.value / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.key} className="flex items-center gap-2 text-xs">
            <span className={cn('size-2.5 shrink-0 rounded-sm', STATUS_FILL[segment.key])} />
            <span className="truncate text-slate-400">{segment.label}</span>
            <span className="ml-auto font-medium text-slate-200 tabular-nums">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
