// Pembungkus provider global: TanStack Query (dengan persist ke IndexedDB) + devtools saat development.
// Supabase tidak butuh provider — client-nya singleton di src/lib/supabase.ts.
import type { ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { persistOptions, queryClient } from '@/lib/queryClient'

type ProvidersProps = { children: ReactNode }

// Dipasang sekali di main.tsx, membungkus RouterProvider
export function Providers({ children }: ProvidersProps) {
  return (
    // PersistQueryClientProvider = QueryClientProvider + restore cache dari IndexedDB saat mount
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
      {/* Devtools hanya di-render saat `npm run dev`; hilang total di build produksi */}
      {import.meta.env.DEV && <ReactQueryDevtools buttonPosition="bottom-right" />}
    </PersistQueryClientProvider>
  )
}
