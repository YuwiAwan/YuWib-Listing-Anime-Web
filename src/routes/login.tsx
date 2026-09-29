// Route /login : form email + password dengan mode Masuk / Daftar.
// Berada di luar layout _app, jadi tampil tanpa sidebar. Kalau sudah login, langsung dilempar ke tujuan.
import { useState } from 'react'
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { translateAuthError } from '@/features/auth/authErrors'
import { waitForSession } from '@/features/auth/session'
import { supabase } from '@/lib/supabase'

// Search param:
//   ?redirect=/anime/5114 — diisi guard _auth.tsx supaya setelah login kembali ke halaman semula.
//     Hanya path internal (diawali "/" tapi bukan "//") yang diterima; nilai lain dibuang (.catch) untuk mencegah open redirect.
//   ?mode=signup — dipakai tombol "Register" di top bar supaya form langsung terbuka dalam mode daftar.
const loginSearchSchema = z.object({
  redirect: z.string().regex(/^\/(?!\/)/).optional().catch(undefined),
  mode: z.enum(['signin', 'signup']).optional().catch(undefined),
})

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  // Sudah login? Tidak perlu lihat form — langsung ke tujuan
  beforeLoad: async ({ search }) => {
    const session = await waitForSession()
    if (session) throw redirect({ href: search.redirect ?? '/dashboard' })
  },
  component: LoginPage,
})

// Skema form. Password di sini cukup "wajib diisi": aturan kekuatan password hanya berlaku saat
// DAFTAR (lihat checkNewPassword). Kalau diterapkan saat masuk, akun lama yang dibuat sebelum aturan
// diperketat tidak akan bisa login.
const loginFormSchema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})
type LoginFormValues = z.infer<typeof loginFormSchema>

// Aturan password akun baru — SAMA dengan supabase/config.toml (minimum_password_length = 8,
// password_requirements = "letters_digits"). Server tetap menjadi penentu akhirnya; pengecekan di sini
// hanya supaya user langsung tahu salahnya tanpa menunggu balasan server.
function checkNewPassword(password: string): string | null {
  if (password.length < 8) return 'Password minimal 8 karakter'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Password harus berisi huruf dan angka'
  return null
}

type Mode = 'signin' | 'signup'

function LoginPage() {
  const { redirect: redirectTo, mode: initialMode } = Route.useSearch()
  const navigate = useNavigate()
  // ?mode= hanya menentukan tampilan AWAL; setelahnya tombol "Daftar/Masuk" yang mengatur, tanpa mengubah URL
  const [mode, setMode] = useState<Mode>(initialMode ?? 'signin')
  const [info, setInfo] = useState<string | null>(null)
  // Email yang terakhir gagal masuk karena belum dikonfirmasi — untuk tombol "kirim ulang"
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })
  const { register, handleSubmit, setError, formState } = form
  const { errors, isSubmitting } = formState

  // Submit: panggil Supabase sesuai mode, tampilkan error di form, lalu navigasi kalau sukses
  const onSubmit = handleSubmit(async (values) => {
    setInfo(null)
    setUnconfirmedEmail(null)

    if (mode === 'signup') {
      const problem = checkNewPassword(values.password)
      if (problem) {
        setError('password', { message: problem })
        return
      }
    }

    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword(values)
        : await supabase.auth.signUp({
            ...values,
            // Tautan di email konfirmasi mengarah kembali ke situs ini (lokal maupun setelah deploy).
            // Alamat ini juga harus terdaftar di "Redirect URLs" Supabase, kalau tidak Supabase menolaknya.
            options: { emailRedirectTo: `${window.location.origin}/` },
          })

    if (result.error) {
      if (result.error.code === 'email_not_confirmed') setUnconfirmedEmail(values.email)
      setError('root', { message: translateAuthError(result.error) })
      return
    }

    // Daftar tanpa sesi = wajib konfirmasi email dulu (diaktifkan di supabase/config.toml)
    if (!result.data.session) {
      setInfo(`Akun dibuat. Kami mengirim tautan konfirmasi ke ${values.email}. Buka tautan itu, lalu masuk.`)
      setMode('signin')
      return
    }

    navigate({ href: redirectTo ?? '/dashboard' })
  })

  // Kirim ulang email konfirmasi untuk akun yang belum aktif. Dibatasi server (rate limit email),
  // jadi tombol ini tidak bisa dipakai untuk membanjiri kotak masuk orang.
  async function resendConfirmation() {
    if (!unconfirmedEmail) return
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })
    form.clearErrors('root')
    if (error) setError('root', { message: translateAuthError(error) })
    else setInfo(`Tautan konfirmasi dikirim ulang ke ${unconfirmedEmail}.`)
    setUnconfirmedEmail(null)
  }

  // Ganti mode Masuk ↔ Daftar tanpa mereset isian email
  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setInfo(null)
    form.clearErrors()
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-8">
        <p className="text-center text-2xl font-bold">
          <span className="text-slate-100">Yu</span>
          <span className="text-blue-500">Wib</span>
        </p>
        <p className="mt-1 text-center text-sm text-slate-400">
          {mode === 'signin' ? 'Masuk ke akunmu' : 'Buat akun baru'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="kamu@email.com" {...register('email')} />
            {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              {...register('password')}
            />
            {errors.password ? (
              <p className="text-xs text-rose-400">{errors.password.message}</p>
            ) : (
              mode === 'signup' && <p className="text-xs text-slate-500">Minimal 8 karakter, berisi huruf dan angka.</p>
            )}
          </div>

          {/* Error dari server (email salah, sudah terdaftar, dsb.) ditaruh di errors.root */}
          {errors.root && (
            <div className="space-y-1.5 rounded-md border border-rose-900 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
              <p>{errors.root.message}</p>
              {unconfirmedEmail && (
                <button type="button" onClick={resendConfirmation} className="font-medium text-blue-400 hover:text-blue-300">
                  Kirim ulang email konfirmasi
                </button>
              )}
            </div>
          )}
          {info && (
            <p className="rounded-md border border-blue-900 bg-blue-950/50 px-3 py-2 text-xs text-blue-300">{info}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses…' : mode === 'signin' ? 'Masuk' : 'Daftar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'signin' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
          <button type="button" onClick={switchMode} className="font-medium text-blue-400 hover:text-blue-300">
            {mode === 'signin' ? 'Daftar' : 'Masuk'}
          </button>
        </p>

        {/* Menjelajah anime tidak butuh akun — beri jalan keluar supaya user tidak merasa terkunci */}
        <p className="mt-2 text-center text-sm">
          <Link to="/browse" className="text-slate-500 hover:text-slate-300">
            Lihat-lihat dulu tanpa akun →
          </Link>
        </p>
      </div>
    </div>
  )
}
