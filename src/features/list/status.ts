// Sumber kebenaran tunggal untuk status list: nilai enum di DB, slug di URL, dan label di UI.
// DB memakai underscore ('plan_to_watch'), URL memakai hyphen ('/list/plan-to-watch') — file ini yang memetakan keduanya.

export const LIST_STATUSES = ['watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch'] as const

// Union type: 'watching' | 'completed' | 'on_hold' | 'dropped' | 'plan_to_watch' — sama dengan enum list_status di Postgres
export type ListStatus = (typeof LIST_STATUSES)[number]

// Metadata per status:
//   slug  → potongan URL (/list/plan-to-watch)
//   label → teks di tab, badge, dan dropdown
//   color → warna teks/ikon (dipakai tombol tambah-ke-list dan titik penanda)
//   badge → kelas lengkap untuk pil status di tabel & kartu
export const LIST_STATUS_META: Record<ListStatus, { slug: string; label: string; color: string; badge: string }> = {
  watching: {
    slug: 'watching',
    label: 'Watching',
    color: 'text-blue-400',
    badge: 'bg-blue-600/15 text-blue-300 border-blue-900',
  },
  completed: {
    slug: 'completed',
    label: 'Completed',
    color: 'text-emerald-400',
    badge: 'bg-emerald-600/15 text-emerald-300 border-emerald-900',
  },
  on_hold: {
    slug: 'on-hold',
    label: 'On Hold',
    color: 'text-amber-400',
    badge: 'bg-amber-600/15 text-amber-300 border-amber-900',
  },
  dropped: {
    slug: 'dropped',
    label: 'Dropped',
    color: 'text-rose-400',
    badge: 'bg-rose-600/15 text-rose-300 border-rose-900',
  },
  plan_to_watch: {
    slug: 'plan-to-watch',
    label: 'Plan to Watch',
    color: 'text-slate-400',
    badge: 'bg-slate-700/40 text-slate-300 border-slate-700',
  },
}

// Slug URL → status DB. Mengembalikan undefined kalau slug tidak dikenal (dipakai route untuk melempar 404)
export function slugToStatus(slug: string): ListStatus | undefined {
  return LIST_STATUSES.find((status) => LIST_STATUS_META[status].slug === slug)
}

// Status DB → slug URL, dipakai saat membangun <Link to="/list/$status">
export function statusToSlug(status: ListStatus): string {
  return LIST_STATUS_META[status].slug
}
