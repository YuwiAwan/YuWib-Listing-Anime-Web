// Indikator loading halaman: ditampilkan router saat beforeLoad/loader berjalan lebih lama dari ambang pending.
export function PageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Memuat">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
    </div>
  )
}
