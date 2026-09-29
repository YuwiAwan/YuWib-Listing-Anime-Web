// Layout route (pathless, diawali underscore): membungkus semua halaman di src/routes/_app/** dengan AppShell.
// URL-nya tidak mengandung "_app" — /_app/browse.tsx tetap menjadi /browse.
// TIDAK ada guard auth di sini: /browse dan /anime/$malId sengaja bisa dibuka tanpa login.
// Halaman yang butuh login berada satu tingkat lebih dalam, di bawah _auth.tsx.
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/app/AppShell'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
