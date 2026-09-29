// Footer situs: logo, tagline, tautan media sosial, dan nama pembuat.
// Satu baris mendatar di layar lebar supaya tidak memakan tinggi; di HP menumpuk karena lebarnya tidak cukup.
// Semua isinya diatur dari src/app/siteInfo.ts.
import { SocialIcon } from '@/components/SocialIcon'
import { SITE_INFO, SOCIAL_LINKS } from './siteInfo'

export function SiteFooter() {
  // Tautan yang belum diisi tidak ditampilkan, supaya tidak ada ikon yang mengarah ke mana-mana
  const links = SOCIAL_LINKS.filter((link) => link.href)

  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8">
        {/* Kiri: logo + tagline berdampingan; min-w-0 supaya tagline bisa terpotong, bukan mendorong isi kanan */}
        <div className="flex min-w-0 items-baseline gap-3">
          <p className="shrink-0 text-lg font-bold tracking-tight">
            <span className="text-slate-100">Yu</span>
            <span className="text-blue-500">Wib</span>
          </p>
          <p className="truncate text-sm text-slate-500" title={SITE_INFO.tagline}>
            {SITE_INFO.tagline}
          </p>
        </div>

        {/* Kanan: ikon sosial lalu kredit pembuat, sebaris */}
        <div className="flex shrink-0 items-center gap-4">
          {links.length > 0 && (
            <ul className="flex items-center gap-3">
              {links.map((link) => (
                <li key={link.platform}>
                  <a
                    href={link.href}
                    target="_blank"
                    // noopener: halaman tujuan tidak bisa mengakses tab YuWib lewat window.opener
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    title={link.label}
                    className="block text-slate-500 transition-colors hover:text-blue-400"
                  >
                    <SocialIcon platform={link.platform} className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs whitespace-nowrap text-slate-600">
            © {new Date().getFullYear()} {SITE_INFO.name} · Dibuat oleh{' '}
            <span className="text-slate-400">{SITE_INFO.creator}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
