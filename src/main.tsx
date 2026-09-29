// Entry point React: mount aplikasi dengan Providers (TanStack Query) dan RouterProvider (TanStack Router).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { getSession, subscribeSession } from '@/features/auth/session'
import '@/index.css'

// Saat user berganti (login/logout — termasuk dari tab lain), jalankan ulang guard route supaya redirect terjadi.
// Dicek per user id supaya refresh token rutin (user sama) tidak memicu reload yang tidak perlu.
let lastUserId = getSession()?.user.id
subscribeSession(() => {
  const userId = getSession()?.user.id
  if (userId !== lastUserId) {
    lastUserId = userId
    router.invalidate()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>,
)
