// Membuat instance TanStack Router dari route tree yang di-generate plugin Vite (src/routeTree.gen.ts).
import { createRouter } from '@tanstack/react-router'
import { PageSpinner } from '@/components/PageSpinner'
import { queryClient } from '@/lib/queryClient'
import { routeTree } from '@/routeTree.gen'

export const router = createRouter({
  routeTree,
  // Tersedia di setiap route lewat beforeLoad/loader ({ context }) — untuk prefetch dengan queryClient.ensureQueryData
  context: { queryClient },
  // Mulai memuat halaman saat kursor hover/fokus ke Link, bukan saat klik → navigasi terasa instan
  defaultPreload: 'intent',
  // Kembalikan posisi scroll saat tombol back
  scrollRestoration: true,
  // Ditampilkan kalau beforeLoad/loader suatu route memakan waktu > defaultPendingMs
  defaultPendingComponent: PageSpinner,
  defaultPendingMs: 300,
})

// Registrasi tipe router: setelah ini, <Link to="..."> dan useParams() tahu semua route yang ada
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
