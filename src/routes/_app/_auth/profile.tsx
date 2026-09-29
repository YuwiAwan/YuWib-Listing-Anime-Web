// Route /profile : profil user yang sedang login — username (bisa diubah), email, tanggal bergabung,
// dan ringkasan tontonan. Halaman ini yang nanti menjadi profil publik /u/$username di versi publik.
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorBox } from '@/components/ErrorBox'
import { PageSpinner } from '@/components/PageSpinner'
import { useProfile } from '@/features/auth/useProfile'
import { useUser } from '@/features/auth/useSession'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_app/_auth/profile')({
  component: ProfilePage,
})

// Aturan username disamakan PERSIS dengan CHECK constraint di migration: ^[a-z0-9_]{3,20}$
const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Minimal 3 karakter')
    .max(20, 'Maksimal 20 karakter')
    .regex(/^[a-z0-9_]+$/, 'Hanya huruf kecil, angka, dan garis bawah'),
})
type UsernameValues = z.infer<typeof usernameSchema>

function ProfilePage() {
  const user = useUser()
  const { data: profile, isPending, isError, refetch } = useProfile()

  if (isPending) return <PageSpinner />
  if (isError || !profile || !user) return <ErrorBox message="Gagal memuat profil." onRetry={() => refetch()} />

  const joined = new Date(profile.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Profil</h1>

      {/* Kartu identitas: avatar besar + username + email */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-2xl font-semibold text-slate-50">
          {profile.username.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-100">{profile.username}</p>
          <p className="truncate text-sm text-slate-400">{user.email}</p>
          <p className="mt-1 text-xs text-slate-500">Bergabung {joined}</p>
        </div>
      </div>

      <UsernameForm currentUsername={profile.username} userId={user.id} />

      {/* Ringkasan tontonan — angkanya diisi setelah halaman List & Stats jadi (Urutan Build ke-5 & ke-8) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="text-sm font-medium text-slate-100">Ringkasan tontonan</h2>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {['Total anime', 'Episode', 'Mean score'].map((label) => (
            <div key={label}>
              <p className="text-2xl font-semibold text-slate-700">—</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">Terisi setelah halaman My List dan Stats selesai dibuat.</p>
      </div>
    </section>
  )
}

// Form ubah username. Menulis ke tabel profiles lewat RLS "profiles: update own".
function UsernameForm({ currentUsername, userId }: { currentUsername: string; userId: string }) {
  const queryClient = useQueryClient()

  const form = useForm<UsernameValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: { username: currentUsername },
  })
  const { register, handleSubmit, setError, formState } = form
  const { errors, isSubmitting, isSubmitSuccessful, isDirty } = formState

  const mutation = useMutation({
    mutationFn: async (values: UsernameValues) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: values.username })
        .eq('id', userId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    // Tulis hasilnya langsung ke cache supaya avatar & nama di top bar ikut berubah tanpa refetch
    onSuccess: (data) => queryClient.setQueryData(['profile', userId], data),
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values)
      form.reset(values) // nilai baru jadi acuan "belum diubah"
    } catch (error) {
      // 23505 = unique violation pada kolom username
      const code = (error as { code?: string }).code
      setError('username', {
        message: code === '23505' ? 'Username ini sudah dipakai.' : 'Gagal menyimpan. Coba lagi.',
      })
    }
  })

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-800 bg-slate-900 p-6" noValidate>
      <Label htmlFor="username">Username</Label>
      <p className="mt-1 text-xs text-slate-500">
        Huruf kecil, angka, dan garis bawah. 3–20 karakter. Nanti dipakai sebagai alamat profil publikmu.
      </p>
      <div className="mt-3 flex items-start gap-2">
        <div className="flex-1">
          <Input id="username" autoComplete="off" spellCheck={false} {...register('username')} />
          {errors.username && <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>}
        </div>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? 'Menyimpan…' : 'Simpan'}
          {!isSubmitting && <Pencil data-icon="inline-end" />}
        </Button>
      </div>
      {isSubmitSuccessful && !isDirty && (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400">
          <Check className="size-3" />
          Tersimpan.
        </p>
      )}
    </form>
  )
}
