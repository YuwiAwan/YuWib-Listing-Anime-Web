// Input pencarian dengan debounce: onChange dipanggil 400 ms setelah user berhenti mengetik,
// bukan setiap ketukan — supaya URL dan request Jikan tidak dibanjiri.
import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

type SearchInputProps = {
  value: string | undefined // nilai dari URL (?q=)
  onChange: (q: string | undefined) => void
  placeholder?: string
}

const DEBOUNCE_MS = 400

export function SearchInput({ value, onChange, placeholder = 'Cari anime…' }: SearchInputProps) {
  const [term, setTerm] = useState(value ?? '')
  // Nilai terakhir yang KITA kirim ke URL. Kalau URL berubah ke nilai lain (tombol back, klik menu Browse),
  // berarti perubahan datang dari luar → sinkronkan isi input. Tanpa ini, ketikan user bisa tertimpa.
  const lastPushed = useRef(value)

  useEffect(() => {
    if (value !== lastPushed.current) {
      lastPushed.current = value
      setTerm(value ?? '')
    }
  }, [value])

  // Debounce: tunggu DEBOUNCE_MS setelah ketikan terakhir, baru kirim
  useEffect(() => {
    const next = term.trim() || undefined
    if (next === lastPushed.current) return
    const timer = setTimeout(() => {
      lastPushed.current = next
      onChange(next)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [term, onChange])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
      <Input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="h-10 bg-slate-900 pr-9 pl-9 text-sm [&::-webkit-search-cancel-button]:hidden"
        autoComplete="off"
      />
      {term && (
        <button
          type="button"
          onClick={() => setTerm('')}
          aria-label="Hapus pencarian"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
