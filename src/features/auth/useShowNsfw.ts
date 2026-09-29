// Preferensi "tampilkan konten dewasa" milik user yang sedang login.
// Pengunjung anonim SELALU mendapat false: halaman Browse dan detail bersifat publik,
// jadi tanpa akun tidak ada yang bisa menyalakannya.
import { useProfile } from './useProfile'

export function useShowNsfw(): boolean {
  const { data: profile } = useProfile()
  // Selagi profil belum termuat, anggap false — lebih baik terlanjur menyaring daripada terlanjur menampilkan
  return profile?.show_nsfw ?? false
}
