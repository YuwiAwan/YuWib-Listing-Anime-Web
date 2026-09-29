// Daftar menu navigasi utama. Dipakai nav horizontal (desktop) dan panel hamburger (mobile) di TopBar.
// Browse ditaruh paling depan karena halaman itu publik dan menjadi tempat mendarat pengunjung anonim.
// Profile TIDAK ada di sini — aksesnya lewat dropdown avatar di kanan atas.
// linkOptions() membuat `to`/`params` tervalidasi terhadap route yang ada — salah ketik path = error TypeScript.
// Properti tambahan (label, icon, match) ikut lewat dan tetap bertipe.
import { linkOptions } from '@tanstack/react-router'
import { ChartColumn, LayoutDashboard, ListVideo, Search } from 'lucide-react'

export const NAV_ITEMS = [
  linkOptions({ to: '/browse', label: 'Browse', icon: Search, match: '/browse' }),
  linkOptions({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, match: '/dashboard' }),
  // Tab default saat membuka My List adalah "watching"
  linkOptions({ to: '/list/$status', params: { status: 'watching' }, label: 'My List', icon: ListVideo, match: '/list' }),
  linkOptions({ to: '/stats', label: 'Stats', icon: ChartColumn, match: '/stats' }),
]

// `match` = prefix pathname untuk menandai item aktif (mis. '/list' aktif di /list/watching maupun /list/completed)
export type NavItem = (typeof NAV_ITEMS)[number]
