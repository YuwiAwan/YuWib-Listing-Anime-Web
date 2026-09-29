// Root route: pembungkus paling luar untuk SEMUA halaman (termasuk /login).
// Tidak me-render AppShell — itu tugas layout route _app.tsx supaya /login tampil tanpa sidebar.
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

// Context router: queryClient disuntikkan dari router.tsx supaya loader route bisa prefetch data
type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

// Hanya merender child route + devtools router saat development
function RootLayout() {
  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-left" />}
    </>
  )
}

// Halaman 404 global — juga dipicu saat throw notFound() dari route mana pun (mis. /list/status-ngawur)
function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-center text-slate-100">
      <p className="text-6xl font-bold text-blue-500">404</p>
      <p className="text-slate-400">Halaman tidak ditemukan.</p>
      <Link to="/dashboard" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-blue-500">
        Kembali ke Dashboard
      </Link>
    </div>
  )
}
