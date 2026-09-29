// Query & mutation untuk data personal (tabel list_entries) dan snapshot anime (tabel anime).
// Strategi: SATU query mengambil seluruh entri list milik user, lalu komponen memilih yang dibutuhkan
// lewat `select`. Alasannya, halaman Browse menampilkan 24 kartu sekaligus — kalau tiap kartu bertanya
// sendiri ke database, jadi 24 request. List pribadi ukurannya kecil (ratusan baris), jadi sekali ambil lebih murah.
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/features/auth/useSession'
import type { AnimeSnapshot } from '@/features/anime/animeRow'
import { syncAnime } from '@/features/anime/syncAnime'
import type { Database } from '@/types/database.types'
import { buildEntryPatch, today, type EntryChanges } from './entryPatch'
import type { ListStatus } from './status'

export type ListEntry = Database['public']['Tables']['list_entries']['Row']
type AnimeRow = Database['public']['Tables']['anime']['Row']

// Entri list beserta snapshot animenya. Halaman My List, Dashboard, dan Stats semuanya butuh keduanya,
// jadi query-nya sekalian mengambil relasi lewat foreign key list_entries.mal_id → anime.mal_id.
export type ListEntryWithAnime = ListEntry & { anime: AnimeRow }

// Kunci cache untuk seluruh entri milik satu user. Semua mutation membatalkan kunci ini.
export function listEntriesKey(userId: string) {
  return ['list-entries', userId] as const
}

// Semua entri list milik user, diurutkan dari yang terakhir diubah.
// Tidak dipersist ke IndexedDB (prefix-nya bukan 'anime-api') — data personal selalu diambil segar dari DB.
export function listEntriesQueryOptions(userId: string) {
  return queryOptions({
    queryKey: listEntriesKey(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_entries')
        .select('*, anime(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
      if (error) throw error
      return data as ListEntryWithAnime[]
    },
  })
}

// Entri untuk SATU anime, diambil dari hasil query di atas (tanpa request tambahan).
// Mengembalikan undefined kalau anime belum ada di list, atau kalau user belum login.
export function useMyEntry(malId: number) {
  const user = useUser()
  return useQuery({
    ...listEntriesQueryOptions(user?.id ?? ''),
    enabled: !!user,
    select: (entries) => entries.find((entry) => entry.mal_id === malId),
  })
}

// Tambahkan anime ke list. Dua langkah dalam satu mutation:
//   1. minta server menyimpan snapshot anime (Edge Function sync-anime) — supaya halaman List &
//      Dashboard tidak perlu memanggil API. Browser tidak boleh menulis tabel `anime` langsung.
//   2. insert baris `list_entries` — data personal (status, progress, skor)
// Langkah 1 wajib lebih dulu karena list_entries.mal_id punya foreign key ke anime.mal_id.
// `snapshot` tetap dikirim ke mutation ini karena jumlah episodenya dipakai saat status = completed.
export function useAddToList() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ snapshot, status }: { snapshot: AnimeSnapshot; status: ListStatus }) => {
      if (!user) throw new Error('Harus login untuk menambah ke list')

      const sync = await syncAnime([snapshot.mal_id])
      if (sync.failed.includes(snapshot.mal_id)) throw new Error('Data anime tidak bisa diambil. Coba lagi nanti.')

      const { data, error } = await supabase
        .from('list_entries')
        .insert({
          user_id: user.id,
          mal_id: snapshot.mal_id,
          status,
          // Mulai menonton → tanggal mulai diisi otomatis hari ini
          start_date: status === 'watching' ? today() : null,
          // Langsung ditandai selesai → progress dianggap penuh dan tanggal selesai diisi
          episodes_watched: status === 'completed' ? (snapshot.episodes ?? 0) : 0,
          finish_date: status === 'completed' ? today() : null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateEntries(queryClient, user?.id),
  })
}

type UpdateArgs = {
  entry: ListEntryWithAnime
  changes: EntryChanges
}

// Ubah entri yang SUDAH ada di list (status, skor, progress episode).
// Memakai pembaruan optimis: tampilan berubah seketika, lalu dikembalikan kalau server menolak.
// Ini penting karena tombol +1 episode adalah aksi yang paling sering ditekan.
export function useUpdateEntry() {
  const user = useUser()
  const queryClient = useQueryClient()
  const key = listEntriesKey(user?.id ?? '')

  return useMutation({
    mutationFn: async ({ entry, changes }: UpdateArgs) => {
      const { data, error } = await supabase
        .from('list_entries')
        .update(buildEntryPatch(entry, changes))
        .eq('id', entry.id)
        .select()
        .single()
      if (error) throw error
      return data
    },

    // Sebelum request dikirim: tulis dulu hasilnya ke cache supaya UI langsung merespons
    onMutate: async ({ entry, changes }) => {
      // Hentikan refetch yang sedang berjalan, kalau tidak hasilnya bisa menimpa perubahan optimis kita
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<ListEntryWithAnime[]>(key)
      const patch = buildEntryPatch(entry, changes)
      queryClient.setQueryData<ListEntryWithAnime[]>(key, (entries) =>
        entries?.map((item) => (item.id === entry.id ? { ...item, ...patch } : item)),
      )
      return { previous }
    },

    // Gagal → kembalikan cache ke keadaan sebelum perubahan
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },

    // Berhasil atau gagal, ambil ulang dari database supaya nilai turunan dari server (updated_at) ikut segar
    onSettled: () => invalidateEntries(queryClient, user?.id),
  })
}

// Hapus anime dari list. Snapshot di tabel `anime` sengaja TIDAK ikut dihapus:
// datanya dipakai bersama dan berguna kalau anime yang sama ditambahkan lagi nanti.
export function useRemoveFromList() {
  const user = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from('list_entries').delete().eq('id', entryId)
      if (error) throw error
    },
    onSuccess: () => invalidateEntries(queryClient, user?.id),
  })
}

// Setelah menulis, tandai cache entri sebagai basi supaya semua kartu & halaman ikut menyesuaikan
function invalidateEntries(queryClient: ReturnType<typeof useQueryClient>, userId: string | undefined) {
  if (userId) queryClient.invalidateQueries({ queryKey: listEntriesKey(userId) })
}
