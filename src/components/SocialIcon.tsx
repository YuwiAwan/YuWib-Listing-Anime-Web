// Ikon media sosial (GitHub, Instagram, X, dst.). Warnanya mengikuti `currentColor`,
// jadi cukup atur warna teks pembungkusnya (mis. text-slate-400 hover:text-blue-400).
import { SOCIAL_ICON_PATHS, type SocialPlatform } from './socialIconPaths'

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  return (
    // aria-hidden: nama platform sudah dibacakan lewat aria-label pada tautan pembungkusnya
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d={SOCIAL_ICON_PATHS[platform]} />
    </svg>
  )
}
