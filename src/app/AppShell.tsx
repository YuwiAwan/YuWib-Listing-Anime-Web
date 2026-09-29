// Komponen pembungkus layout utama: top bar di atas, konten di tengah, footer di bawah.
// Sidebar vertikal dan bottom nav sudah dihapus (perombakan 2026-09-29) — navigasi kini ada di TopBar,
// sehingga konten mendapat lebar penuh; penting untuk tabel My List dan grid Browse.
import type { ReactNode } from 'react'
import { SiteFooter } from './SiteFooter'
import { TopBar } from './TopBar'

type AppShellProps = { children: ReactNode }

// Dipakai layout route src/routes/_app.tsx, jadi halaman /login tampil tanpa shell ini
export function AppShell({ children }: AppShellProps) {
  return (
    // flex kolom + flex-1 pada <main>: footer tetap menempel di dasar layar walau isi halaman pendek
    <div className="flex min-h-dvh flex-col bg-slate-950 text-slate-100">
      <TopBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8">{children}</main>
      <SiteFooter />
    </div>
  )
}
