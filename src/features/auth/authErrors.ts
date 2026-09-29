// Terjemahkan pesan error Supabase Auth (bahasa Inggris, teknis) ke pesan singkat untuk ditampilkan di form.
const MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email atau password salah.',
  'User already registered': 'Email ini sudah terdaftar. Coba masuk.',
  'Email not confirmed': 'Email belum dikonfirmasi. Cek kotak masuk.',
  'Signup requires a valid password': 'Password tidak valid.',
}

// Fallback ke pesan aslinya kalau belum ada terjemahan, supaya tetap bisa di-debug
export function translateAuthError(message: string) {
  return MESSAGES[message] ?? message
}
