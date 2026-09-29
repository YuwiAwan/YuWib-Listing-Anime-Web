// Pengurutan hari tayang. API menuliskannya dalam bahasa Inggris bentuk jamak ("Fridays"),
// jadi di sini sekalian dipetakan ke label Indonesia dan ke urutan minggu.
const DAYS = [
  { match: 'monday', label: 'Senin' },
  { match: 'tuesday', label: 'Selasa' },
  { match: 'wednesday', label: 'Rabu' },
  { match: 'thursday', label: 'Kamis' },
  { match: 'friday', label: 'Jumat' },
  { match: 'saturday', label: 'Sabtu' },
  { match: 'sunday', label: 'Minggu' },
]

// Indeks 0–6 (Senin–Minggu), atau 7 untuk yang tidak terjadwal supaya jatuh di urutan terakhir
export function broadcastDayIndex(day: string | null): number {
  if (!day) return 7
  const needle = day.toLowerCase()
  const index = DAYS.findIndex((entry) => needle.includes(entry.match))
  return index === -1 ? 7 : index
}

export function broadcastDayLabel(day: string | null): string {
  const index = broadcastDayIndex(day)
  return index === 7 ? 'Jadwal tidak diketahui' : DAYS[index].label
}

// Hari ini dalam indeks yang sama (JS: 0 = Minggu), untuk menandai "tayang hari ini"
export function todayIndex(now = new Date()): number {
  return (now.getDay() + 6) % 7
}
