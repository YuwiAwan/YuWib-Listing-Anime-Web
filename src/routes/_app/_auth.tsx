// Layout route pathless berisi GUARD AUTH. Semua halaman di src/routes/_app/_auth/**
// (dashboard, list, stats, settings, profile) hanya bisa dibuka setelah login.
// Halaman publik (browse, detail anime) berada di luar folder ini.
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { waitForSession } from '@/features/auth/session'

export const Route = createFileRoute('/_app/_auth')({
  beforeLoad: async ({ location }) => {
    const session = await waitForSession()
    // Belum login → ke /login, sambil mengingat halaman yang tadi dituju
    if (!session) throw redirect({ to: '/login', search: { redirect: location.href, mode: undefined } })
    // Tersedia untuk child route lewat Route.useRouteContext()
    return { session }
  },
  component: () => <Outlet />,
})
