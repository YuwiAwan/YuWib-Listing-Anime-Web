/// <reference types="vite/client" />

// Deklarasi tipe untuk variabel env (VITE_*) supaya import.meta.env ter-autocomplete dan bertipe string
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
