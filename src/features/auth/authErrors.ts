// Terjemahkan error Supabase Auth ke pesan singkat berbahasa Indonesia untuk ditampilkan di form.
// Dicocokkan lewat KODE error (mis. "weak_password"), bukan teks pesannya: teks bahasa Inggris
// bisa berubah antar versi Supabase, sedangkan kodenya stabil. Kode-kode ini sudah diuji langsung
// terhadap server Supabase lokal.
import type { AuthError } from '@supabase/supabase-js'

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email atau password salah.',
  user_already_exists: 'Email ini sudah terdaftar. Coba masuk.',
  email_not_confirmed: 'Email belum dikonfirmasi. Buka tautan yang kami kirim ke emailmu.',
  weak_password: 'Password minimal 8 karakter dan harus berisi huruf serta angka.',
  validation_failed: 'Format email tidak valid.',
  over_request_rate_limit: 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.',
  over_email_send_rate_limit: 'Terlalu banyak email terkirim. Tunggu sebentar sebelum mencoba lagi.',
  signup_disabled: 'Pendaftaran akun baru sedang ditutup.',
}

// Fallback ke pesan asli kalau kodenya belum dikenal, supaya masih bisa di-debug
export function translateAuthError(error: Pick<AuthError, 'code' | 'message'>): string {
  return (error.code && MESSAGES[error.code]) || error.message
}
