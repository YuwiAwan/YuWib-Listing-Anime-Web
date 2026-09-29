// Setup TanStack Query: QueryClient global + persister IndexedDB untuk cache Jikan.
// Strategi (lihat docs/PLAN.md §2): data anime dari API eksternal di-cache 24 jam dan disimpan
// ke IndexedDB supaya buka ulang app tidak menghabiskan rate limit penyedia.
import { QueryClient } from '@tanstack/react-query'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'

const ONE_DAY = 24 * 60 * 60 * 1000

// Prefix queryKey untuk semua query ke API anime eksternal (Tenrai/Jikan), mis. ['anime-api', 'anime', 5114].
// Dipakai untuk (1) default staleTime 24 jam dan (2) memilih query mana yang dipersist.
export const ANIME_API_KEY = 'anime-api' as const

// QueryClient dengan default yang masuk akal untuk app single-user
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // data Supabase dianggap segar 5 menit
      gcTime: ONE_DAY, // harus >= maxAge persister, kalau tidak cache Jikan dibuang sebelum sempat disimpan
      retry: 1,
      refetchOnWindowFocus: false, // tracker pribadi: tidak perlu refetch tiap ganti tab
    },
  },
})

// Semua query berprefix 'anime-api' otomatis segar 24 jam — tiap queryOptions tidak perlu mengulang opsi ini.
// retry: false karena apiFetch() sudah mencoba ulang sendiri dan berpindah host (Tenrai → Jikan).
queryClient.setQueryDefaults([ANIME_API_KEY], { staleTime: ONE_DAY, retry: false })

const IDB_KEY = 'yuwib-query-cache'

// Persister berbasis idb-keyval: menyimpan snapshot cache ke IndexedDB (kapasitas jauh lebih besar dari localStorage)
export const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => set(IDB_KEY, client),
  restoreClient: () => get<PersistedClient>(IDB_KEY),
  removeClient: () => del(IDB_KEY),
}

// Opsi persist yang dipakai PersistQueryClientProvider (di src/app/providers.tsx)
export const persistOptions = {
  persister: idbPersister,
  maxAge: ONE_DAY, // cache lebih tua dari 24 jam dibuang saat restore
  buster: 'v2', // naikkan kalau bentuk data yang disimpan berubah, supaya cache lama diabaikan (v2: prefix key jikan → anime-api)
  dehydrateOptions: {
    // Hanya simpan query API anime yang sukses. Data Supabase (list pribadi) tidak dipersist:
    // selalu diambil segar dari DB supaya tidak ada state basi antar device.
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) =>
      query.queryKey[0] === ANIME_API_KEY && query.state.status === 'success',
  },
}
