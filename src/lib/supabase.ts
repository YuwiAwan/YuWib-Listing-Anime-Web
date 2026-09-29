// Supabase client tunggal untuk seluruh app (auth + query ke Postgres lewat RLS).
// Diakses langsung dari browser — aman karena anon key hanya bisa melakukan apa yang diizinkan RLS.
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY // anon key lama atau "publishable key" baru, keduanya bisa

// Gagal cepat saat startup kalau .env belum diisi — lebih jelas daripada error aneh saat query pertama
if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY belum diset. Salin .env.example ke .env lalu isi.')
}

// Generic <Database> membuat supabase.from('list_entries') mengenal nama tabel & kolom setelah tipe di-generate
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
