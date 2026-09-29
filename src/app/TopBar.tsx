// Top bar: satu-satunya navigasi utama YuWib (menggantikan sidebar vertikal).
// Susunan: [hamburger (mobile)] [logo] [nav horizontal (desktop)] ··· [menu user / tombol login].
import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { UserMenu } from '@/features/auth/UserMenu'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, type NavItem } from './nav'

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 md:px-8">
        <MobileNav />
        <Logo />

        {/* Nav horizontal — hanya desktop. Ingin hamburger di semua ukuran? ganti "hidden md:flex" jadi "hidden". */}
        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <TopBarLink key={item.match} item={item} />
          ))}
        </nav>

        {/* ml-auto mendorong area user ke pojok kanan */}
        <div className="ml-auto">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

// Logo teks "YuWib" — "Wib" diberi warna biru sebagai identitas aksen tema
function Logo() {
  return (
    <Link to="/browse" className="text-xl font-bold tracking-tight">
      <span className="text-slate-100">Yu</span>
      <span className="text-blue-500">Wib</span>
    </Link>
  )
}

// Apakah item nav sedang aktif, berdasarkan prefix pathname
function useIsActive(item: NavItem) {
  const { pathname } = useLocation()
  return pathname === item.match || pathname.startsWith(item.match + '/')
}

// Satu menu di nav horizontal desktop; aktif = latar biru transparan + teks biru
function TopBarLink({ item }: { item: NavItem }) {
  const active = useIsActive(item)
  const { label, icon: _icon, match: _match, ...link } = item
  return (
    <Link
      {...link}
      className={cn(
        'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100',
      )}
    >
      {label}
    </Link>
  )
}

// Hamburger + panel geser dari kiri. Hanya tampil di bawah breakpoint md.
function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Buka menu"
        className="-ml-1 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-100 md:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-64 border-slate-800 bg-slate-950 p-0">
        <SheetHeader className="border-b border-slate-800 px-5 py-4">
          <SheetTitle className="text-left text-lg font-bold tracking-tight">
            <span className="text-slate-100">Yu</span>
            <span className="text-blue-500">Wib</span>
          </SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            // Tutup panel setelah memilih menu, kalau tidak panel akan menutupi halaman tujuan
            <MobileNavLink key={item.match} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

// Satu baris menu di panel mobile: ikon + label
function MobileNavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const active = useIsActive(item)
  const { label, icon: Icon, match: _match, ...link } = item
  return (
    <Link
      {...link}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-blue-600/15 text-blue-400' : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100',
      )}
    >
      <Icon className="size-5 shrink-0" />
      {label}
    </Link>
  )
}
