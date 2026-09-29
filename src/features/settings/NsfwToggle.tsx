// Preferensi "tampilkan konten dewasa" di halaman Settings.
// Menyalakan dibuat DUA LANGKAH (konfirmasi dulu), mematikan cukup satu klik — supaya tidak
// pernah menyala karena salah pencet, tapi selalu bisa dimatikan dengan cepat.
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/features/auth/useProfile'
import { useUser } from '@/features/auth/useSession'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export function NsfwToggle() {
  const user = useUser()
  const queryClient = useQueryClient()
  const { data: profile } = useProfile()
  const [confirming, setConfirming] = useState(false)

  const mutation = useMutation({
    mutationFn: async (showNsfw: boolean) => {
      if (!user) throw new Error('Belum login')
      const { data, error } = await supabase
        .from('profiles')
        .update({ show_nsfw: showNsfw })
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Tulis langsung ke cache supaya halaman Browse yang sedang terbuka ikut menyesuaikan.
      // Cache hasil API sendiri tidak perlu dibuang: nilai sfw ikut masuk queryKey,
      // jadi preferensi baru otomatis memakai entri cache yang berbeda.
      queryClient.setQueryData(['profile', user!.id], data)
      setConfirming(false)
    },
  })

  const enabled = profile?.show_nsfw ?? false

  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-100">Konten dewasa</h2>
          <p className="mt-1 text-xs text-slate-500">
            Kalau dimatikan, hasil pencarian dan penjelajahan disaring lewat filter{' '}
            <code className="text-slate-400">sfw</code> di API, dan genre Hentai serta Erotica
            disembunyikan dari daftar filter.
          </p>
        </div>

        {/* Saklar tampil sebagai status sekaligus tombol mematikan */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Tampilkan konten dewasa"
          disabled={mutation.isPending}
          onClick={() => (enabled ? mutation.mutate(false) : setConfirming(true))}
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60',
            enabled ? 'bg-blue-600' : 'bg-slate-700',
          )}
        >
          {/* left-0.5 wajib eksplisit: tanpa nilai kiri, elemen absolut memakai posisi statisnya,
              dan <button> meratakan isi ke tengah — knob jadi mulai dari tengah lalu meleset keluar track. */}
          <span
            className={cn(
              'absolute top-0.5 left-0.5 size-5 rounded-full bg-slate-100 transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {confirming && !enabled && (
        <div className="space-y-3 rounded-lg border border-amber-900/60 bg-amber-950/20 p-4">
          <p className="flex gap-2 text-xs text-amber-200">
            <TriangleAlert className="size-4 shrink-0" />
            <span>
              Menyalakan ini menampilkan anime berkategori dewasa (Hentai, Erotica, Ecchi eksplisit) di
              hasil pencarian, penjelajahan genre, dan daftar musiman.{' '}
              <strong className="font-medium">Hanya nyalakan kalau usiamu 18 tahun ke atas.</strong>
            </span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => mutation.mutate(true)} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Saya 18+, nyalakan
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}

      {mutation.isError && <p className="text-xs text-rose-400">Gagal menyimpan preferensi. Coba lagi.</p>}

      {enabled && !confirming && (
        <p className="text-xs text-amber-300/80">
          Konten dewasa sedang ditampilkan. Preferensi ini tersimpan di akunmu, bukan di browser ini saja.
        </p>
      )}
    </section>
  )
}
