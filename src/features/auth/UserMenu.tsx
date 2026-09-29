// Area user di pojok kanan atas top bar. Dua keadaan:
//   - Sudah login  : avatar bulat → dropdown (Check Profile, Settings, Logout)
//   - Belum login  : tautan "Login | Register"
// Keadaan kedua bisa muncul karena /browse dan /anime/$malId memang publik (lihat src/routes/_app.tsx).
import { Link, useRouter } from '@tanstack/react-router'
import { LogOut, Settings, UserRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { queryClient } from '@/lib/queryClient'
import { supabase } from '@/lib/supabase'
import { useProfile } from './useProfile'
import { useUser } from './useSession'

export function UserMenu() {
  const user = useUser()
  const { data: profile } = useProfile()
  const router = useRouter()

  // Belum login → tawarkan masuk atau daftar
  if (!user) return <AuthLinks />

  const username = profile?.username ?? '…'
  const initial = (profile?.username ?? user.email ?? '?').charAt(0).toUpperCase()

  // Logout: hapus sesi di Supabase, buang cache data personal, lalu kembali ke halaman publik
  async function handleLogout() {
    await supabase.auth.signOut()
    queryClient.clear()
    router.navigate({ to: '/browse' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu user"
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-blue-500/50"
      >
        <Avatar initial={initial} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-slate-100">{username}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">
            <UserRound />
            Check Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Tautan untuk pengunjung anonim. Register memakai ?mode=signup supaya form langsung terbuka di mode daftar.
function AuthLinks() {
  return (
    <div className="flex items-center gap-1 text-sm font-medium">
      <Link to="/login" search={{ mode: 'signin', redirect: undefined }} className="rounded-lg px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-900 hover:text-slate-100">
        Login
      </Link>
      <span className="text-slate-700" aria-hidden>
        |
      </span>
      <Link
        to="/login"
        search={{ mode: 'signup', redirect: undefined }}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-slate-50 transition-colors hover:bg-blue-500"
      >
        Register
      </Link>
    </div>
  )
}

// Lingkaran biru berisi huruf pertama username
function Avatar({ initial }: { initial: string }) {
  return (
    <span className="flex size-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-slate-50 transition-colors hover:bg-blue-500">
      {initial}
    </span>
  )
}
