// Placeholder halaman selama fitur belum dibuat: judul + deskripsi singkat + nomor urutan build.
// Dihapus satu per satu seiring halaman aslinya jadi.
type PagePlaceholderProps = {
  title: string
  description: string
  buildStep: number // mengacu ke "Urutan Build" di docs/PLAN.md
}

export function PagePlaceholder({ title, description, buildStep }: PagePlaceholderProps) {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">{title}</h1>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-sm text-slate-400">{description}</p>
        <p className="mt-3 inline-flex rounded-md bg-blue-600/15 px-2 py-1 text-xs font-medium text-blue-400">
          Urutan Build ke-{buildStep}
        </p>
      </div>
    </section>
  )
}
