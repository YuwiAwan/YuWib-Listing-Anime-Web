// Route "/" : tidak punya halaman sendiri, langsung mengarahkan ke tujuan yang masuk akal.
// Sudah login → /dashboard (ringkasan pribadi). Belum login → /browse, karena menjelajah anime bersifat publik.
import { createFileRoute, redirect } from '@tanstack/react-router'
import { waitForSession } from '@/features/auth/session'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await waitForSession()
    throw redirect({ to: session ? '/dashboard' : '/browse' })
  },
})
