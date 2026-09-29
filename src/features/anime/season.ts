// Helper musim anime (mengikuti pembagian MAL): winter Jan–Mar, spring Apr–Jun, summer Jul–Sep, fall Okt–Des.
import type { JikanSeason } from '@/types/jikan.types'

export const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const satisfies readonly JikanSeason[]
export type Season = (typeof SEASONS)[number]

export const SEASON_LABEL: Record<Season, string> = {
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
}

// Musim yang sedang berjalan sekarang — default halaman /browse
export function currentSeason(date = new Date()): { year: number; season: Season } {
  const month = date.getMonth() // 0 = Januari
  const season: Season = month <= 2 ? 'winter' : month <= 5 ? 'spring' : month <= 8 ? 'summer' : 'fall'
  return { year: date.getFullYear(), season }
}

// Daftar tahun untuk dropdown: tahun depan (anime yang diumumkan) sampai 1960
export function yearOptions(): number[] {
  const max = new Date().getFullYear() + 1
  const years: number[] = []
  for (let y = max; y >= 1960; y--) years.push(y)
  return years
}
