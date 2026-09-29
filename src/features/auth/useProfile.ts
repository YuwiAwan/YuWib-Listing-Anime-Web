// Query ke tabel profiles untuk user yang sedang login (username, dsb.).
// Contoh pertama query Supabase bertipe: hasil select() otomatis bertipe Row dari database.types.ts.
import { queryOptions, useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUser } from './useSession'

// Opsi query dipisah supaya bisa dipakai juga oleh loader route (prefetch) nanti
export function profileQueryOptions(userId: string) {
  return queryOptions({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return data
    },
  })
}

// Profil user yang sedang login. Query tidak jalan (enabled: false) kalau belum ada user.
export function useProfile() {
  const user = useUser()
  return useQuery({
    ...profileQueryOptions(user?.id ?? ''),
    enabled: !!user,
  })
}
