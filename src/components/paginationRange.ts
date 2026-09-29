// Menentukan nomor halaman mana yang ditampilkan di Pagination.
// Contoh (siblings = 1, halaman 6 dari 42):   1 … 5 [6] 7 … 42
//
// Jumlah tombol dibuat SELALU SAMA (siblings*2 + 5) di tengah maupun di ujung, supaya tombol
// tidak bergeser posisinya setiap kali pindah halaman — kursor tetap di atas tombol yang sama.
export type PageItem = number | 'start-ellipsis' | 'end-ellipsis'

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

export function paginationRange(current: number, last: number, siblings = 1): PageItem[] {
  if (last <= 1) return [1]

  // Halaman pertama + terakhir + halaman aktif + tetangga kiri-kanan + dua tanda "…"
  const slots = siblings * 2 + 5
  if (last <= slots) return range(1, last)

  const left = Math.max(current - siblings, 1)
  const right = Math.min(current + siblings, last)
  // "…" hanya muncul kalau ada lebih dari satu halaman yang disembunyikan;
  // kalau cuma satu, lebih baik tampilkan nomornya langsung daripada "…" yang mewakili satu angka
  const showStartEllipsis = left > 3
  const showEndEllipsis = right < last - 2

  if (!showStartEllipsis && showEndEllipsis) {
    return [...range(1, slots - 2), 'end-ellipsis', last]
  }
  if (showStartEllipsis && !showEndEllipsis) {
    return [1, 'start-ellipsis', ...range(last - (slots - 3), last)]
  }
  return [1, 'start-ellipsis', ...range(left, right), 'end-ellipsis', last]
}
