// Pil status berwarna (Watching, Completed, dsb.). Warnanya dari LIST_STATUS_META supaya seragam di seluruh app.
import { cn } from '@/lib/utils'
import { LIST_STATUS_META, type ListStatus } from './status'

export function StatusBadge({ status }: { status: ListStatus }) {
  const meta = LIST_STATUS_META[status]
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap', meta.badge)}>
      {meta.label}
    </span>
  )
}
