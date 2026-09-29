// Konfigurasi Vite: plugin TanStack Router (file-based routing), React, Tailwind v4, dan alias "@/" → "src/"
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    // Harus sebelum react(): membaca src/routes/** dan men-generate src/routeTree.gen.ts
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Alias supaya import bisa ditulis "@/lib/supabase" alih-alih "../../lib/supabase"
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // Chunk utama ~600 kB (170 kB gzip) karena supabase-js (auth + realtime + postgrest) ikut di dalamnya.
    // Wajar untuk app di balik login; batas dinaikkan supaya warning tidak muncul di setiap build.
    chunkSizeWarningLimit: 700,
  },
})
