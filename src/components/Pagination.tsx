// Navigasi halaman sederhana: Sebelumnya / "Halaman X dari Y" / Berikutnya.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PaginationProps = {
  page: number
  lastPage: number
  hasNext: boolean
  onPageChange: (page: number) => void
}

export function Pagination({ page, lastPage, hasNext, onPageChange }: PaginationProps) {
  if (lastPage <= 1 && !hasNext) return null
  return (
    <div className="flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft data-icon="inline-start" />
        Sebelumnya
      </Button>
      <span className="text-sm text-slate-400">
        Halaman <span className="font-medium text-slate-100">{page}</span> dari {lastPage}
      </span>
      <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
        Berikutnya
        <ChevronRight data-icon="inline-end" />
      </Button>
    </div>
  )
}
