// Info pembuat YuWib yang tampil di footer. UBAH DI SINI SAJA — footer membaca semuanya dari berkas ini.
//
// Tautan sosial yang `href`-nya dikosongkan ('') tidak ditampilkan, jadi cukup isi yang kamu punya.
// Platform yang tersedia: github, instagram, x, youtube, tiktok, discord, facebook, threads, bluesky
// (lihat src/components/socialIconPaths.ts).
import type { SocialPlatform } from '@/components/socialIconPaths'

export const SITE_INFO = {
  name: 'YuWib',
  tagline: 'Catat anime yang sudah, sedang, dan akan kamu tonton — sekaligus temukan tontonan berikutnya.',
  creator: 'YuwiAwan',
}

export const SOCIAL_LINKS: { platform: SocialPlatform; label: string; href: string }[] = [
  { platform: 'github', label: 'GitHub', href: 'https://github.com/YuwiAwan' },
  { platform: 'instagram', label: 'Instagram', href: '' },
  { platform: 'x', label: 'X (Twitter)', href: '' },
  { platform: 'tiktok', label: 'TikTok', href: '' },
  { platform: 'youtube', label: 'YouTube', href: '' },
  { platform: 'discord', label: 'Discord', href: '' },
]
