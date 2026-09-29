// Route /settings : pengaturan akun dan pengelolaan data.
// Pengubahan username ada di /profile; halaman ini fokus ke data (impor/ekspor) dan info akun.
import { createFileRoute, Link } from '@tanstack/react-router'
import { useUser } from '@/features/auth/useSession'
import { ExportList } from '@/features/settings/ExportList'
import { ImportMalList } from '@/features/settings/ImportMalList'
import { NsfwToggle } from '@/features/settings/NsfwToggle'

export const Route = createFileRoute('/_app/_auth/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const user = useUser()

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Settings</h1>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-100">Akun</h2>
        <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
        <p className="mt-2 text-xs text-slate-500">
          Username dan profil diatur di{' '}
          <Link to="/profile" className="text-blue-400 hover:text-blue-300">
            halaman Profil
          </Link>
          .
        </p>
      </div>

      <NsfwToggle />
      <ImportMalList />
      <ExportList />

      {/* Tema belum bisa diganti: YuWib sengaja hanya punya satu tema gelap */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="text-sm font-medium text-slate-100">Tampilan</h2>
        <p className="mt-1 text-xs text-slate-500">
          YuWib hanya memakai tema gelap. Belum ada pengaturan yang bisa diubah di sini.
        </p>
      </div>
    </section>
  )
}
