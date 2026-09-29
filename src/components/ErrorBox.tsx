// Kotak pesan error dengan tombol coba lagi. Dipakai untuk kegagalan Jikan/Supabase di berbagai halaman.
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ErrorBoxProps = {
  message: string
  onRetry?: () => void
}

export function ErrorBox({ message, onRetry }: ErrorBoxProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-900/60 bg-rose-950/30 px-6 py-10 text-center">
      <TriangleAlert className="size-8 text-rose-400" />
      <p className="text-sm text-rose-200">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" />
          Coba lagi
        </Button>
      )}
    </div>
  )
}
