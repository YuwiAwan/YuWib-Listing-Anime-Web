// Warna isian grafik halaman Stats.
//
// Tingkat warnanya sengaja LEBIH GELAP daripada badge status di halaman lain. Alasannya teknis:
// teks di atas latar gelap butuh warna terang (Tailwind *-400), sedangkan BIDANG ISIAN butuh
// lightness OKLCH 0,48–0,67 supaya tetap terbedakan oleh pembaca dengan buta warna.
//
// Urutan status pada bar bertumpuk (completed → watching → on_hold → plan → dropped) juga bukan
// pilihan bebas: urutan itu yang lolos uji pemisahan warna, dengan jarak pasangan bersebelahan
// terburuk ΔE 24,7 di bawah simulasi protanopia/deuteranopia (target ≥ 8). Menukar urutannya
// bisa mendekatkan amber dan rose yang hanya berjarak ΔE 5,5 — di bawah ambang.
import type { ListStatus } from '@/features/list/status'

// Satu warna aksen untuk semua grafik berseri tunggal — identitas tidak perlu dikodekan dengan warna
// saat cuma ada satu deret; panjang batang sudah menyampaikan besarannya.
export const SERIES_COLOR = 'bg-blue-500'

export const STATUS_FILL: Record<ListStatus, string> = {
  completed: 'bg-emerald-600',
  watching: 'bg-blue-500',
  on_hold: 'bg-amber-600',
  plan_to_watch: 'bg-violet-500',
  dropped: 'bg-rose-500',
}
