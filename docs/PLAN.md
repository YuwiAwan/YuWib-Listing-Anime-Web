# YuWib — Rencana Proyek (versi personal)

> Personal anime tracker (bukan streaming). Catat anime yang sudah / sedang /
> rencana ditonton, dengan skor, progress episode, dan catatan pribadi.
> Single-user dulu; fitur publik ditambah setelah versi ini selesai
> (lihat bagian "Catatan untuk versi publik" di bawah).

---

## 1. Tech Stack

| Layer          | Pilihan                                   | Alasan singkat                                                  |
|----------------|-------------------------------------------|-----------------------------------------------------------------|
| App            | Vite + React + TypeScript (SPA)           | Tidak butuh SSR/SEO, semua halaman di balik login               |
| Styling        | Tailwind v4 + shadcn/ui                   | Primitif siap pakai tanpa mengunci desain                       |
| Routing        | TanStack Router                           | File-based, typed search params untuk filter/sort di URL        |
| Data fetching  | TanStack Query (+ persist ke IndexedDB)   | Cache Jikan 24 jam, dedup request, optimistic update            |
| DB + Auth      | Supabase (Postgres + RLS)                 | Data relasional, stats = SQL, browser akses langsung tanpa backend |
| Form           | react-hook-form + Zod                     | Untuk `EntryEditor`                                             |
| Lainnya        | TanStack Virtual (list panjang), Recharts (stats) |                                                         |
| Deploy         | Cloudflare Pages / Vercel (static)        | Gratis                                                          |
| Dev lokal      | Supabase CLI + Docker                     | Data di mesin sendiri dulu; `supabase db push` ke cloud saat siap online |

**Kenapa bukan Next.js:** tidak ada yang perlu dijalankan di server. Jikan
lebih aman dipanggil dari browser (rate limit per IP user, bukan per IP server).
Kalau nanti butuh SSR, jalurnya TanStack Start (router sama, tidak perlu
tulis ulang route).

**Kenapa Supabase, bukan Firebase:** data relasional (`anime` ↔ `list_entries`,
`unique(user_id, mal_id)`), halaman stats adalah query agregasi, dan RLS
membuat SPA bisa bicara langsung ke DB. Firestore menyulitkan di halaman stats.

---

## 2. Strategi Data — hybrid "cache-on-write"

```
Browser
├─ TanStack Query ──► API anime (search, detail, seasonal)   — data global
│                     ├─ Tenrai (primer)
│                     └─ Jikan  (cadangan otomatis)
└─ Supabase client ─► Postgres
                       ├─ anime         — snapshot anime yang pernah masuk list
                       └─ list_entries  — data personal
```

- **Search / browse / detail** → API anime langsung dari browser.
  Cache 24 jam di TanStack Query, persist ke IndexedDB supaya revisit tidak hit API lagi.
- **Saat "tambah ke list"** → simpan snapshot (judul, poster, episode, tipe,
  tahun, genre) ke tabel `anime`.
- **Halaman list & dashboard** → hanya baca Supabase. Nol request Jikan.
- **Halaman detail** → Jikan (segar) + overlay `list_entries`. Refresh snapshot
  kalau `cached_at` > 7 hari atau anime masih airing (jumlah episode berubah).

**Kenapa bukan Jikan murni:** list 200 item = 200 request → kena limit dalam
20 detik. Jikan juga sesekali down.
**Kenapa bukan mirror penuh MAL:** ~30 ribu entri yang terus berubah; hanya
butuh data untuk anime yang ada di list.

### Sumber data alternatif (catatan)

| Sumber            | Auth                  | Rate limit           | Catatan                                              |
|-------------------|-----------------------|----------------------|------------------------------------------------------|
| **Tenrai (primer)** | Tidak perlu        | Longgar (opsional server key) | Skema identik Jikan v4 (sudah dibandingkan field-per-field), CORS oke, edge Singapura |
| Jikan v4 (cadangan) | Tidak perlu        | 3/s, 60/min per IP   | REST, CORS oke; per Sep 2026 search & seasons 504, detail masih jalan |
| MAL API resmi v2  | Client ID + OAuth PKCE | Tidak dipublikasi   | Bisa baca/tulis list MAL (two-way sync)              |
| AniList GraphQL   | Tidak perlu           | ~90/min              | `nextAiringEpisode`, banner image; punya field `idMal` |

Karena kita menyimpan `mal_id`, pindah/menambah sumber tidak butuh migrasi data.

**Keputusan 2026-09-29:** Jikan `search`/`seasons` down sejak ~pertengahan Sep 2026.
Pindah ke **Tenrai** sebagai penyedia primer, Jikan tetap terpasang sebagai cadangan otomatis.
Implementasinya di `src/features/anime/api.ts`: satu daftar host berurutan prioritas; host yang
gagal (5xx/429/jaringan) ditandai bermasalah selama 60 detik dan dilewati, lalu host berikutnya
dicoba. Error 4xx selain 429 (mis. 404) tidak memicu pindah host karena itu jawaban sah.
Keduanya memakai skema Jikan v4 dan `mal_id` yang sama, jadi tipe, komponen, dan skema DB tidak berubah.

---

## 3. Skema Database

```sql
-- Snapshot anime (data publik, dibaca bersama)
create table anime (
  mal_id        int primary key,
  title         text not null,
  title_english text,
  image_url     text,
  type          text,           -- TV / Movie / OVA / ...
  episodes      int,            -- null kalau belum diketahui
  duration_min  int,            -- durasi per episode, untuk "hari terpakai" di /stats
  airing_status text,           -- Currently Airing / Finished Airing
  season        text,
  year          int,
  genres        text[],
  mal_score     numeric(4,2),
  cached_at     timestamptz default now()
);

create type list_status as enum
  ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch');

-- Data personal
create table list_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  mal_id           int  not null references anime,
  status           list_status not null default 'plan_to_watch',
  score            smallint check (score between 1 and 10),
  episodes_watched int not null default 0,
  start_date       date,
  finish_date      date,
  rewatch_count    int not null default 0,
  is_favorite      boolean not null default false,
  notes            text,        -- privat
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  unique (user_id, mal_id)
);

-- Profil minimal (disiapkan sejak awal, lihat bagian 8)
create table profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz default now()
);
```

### RLS

```sql
alter table anime        enable row level security;
alter table list_entries enable row level security;
alter table profiles     enable row level security;

-- anime: bebas dibaca; ditulis dari browser (boleh selama single-user)
create policy "anime readable" on anime for select using (true);
create policy "anime writable" on anime for insert with check (auth.role() = 'authenticated');
create policy "anime updatable" on anime for update using (auth.role() = 'authenticated');

-- list_entries: dipecah per operasi (bukan `for all`)
create policy "select own" on list_entries for select using (auth.uid() = user_id);
create policy "insert own" on list_entries for insert with check (auth.uid() = user_id);
create policy "update own" on list_entries for update using (auth.uid() = user_id);
create policy "delete own" on list_entries for delete using (auth.uid() = user_id);

-- profiles
create policy "select own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);
```

Plus trigger di `auth.users` untuk auto-insert `profiles` saat signup
(pola standar Supabase), dan trigger `updated_at` di `list_entries`.

---

## 4. Routing & Fitur

```
PUBLIK (tanpa login)
/                 → redirect: sudah login → /dashboard, belum → /browse
/login            → email + password (?mode=signup untuk langsung ke form daftar)
/browse           → ?q= | ?genres=1,10 | ?sort= | ?year=&season= | ?page=
/anime/:malId

PRIVAT (di balik guard src/routes/_app/_auth.tsx)
/dashboard
/list/:status     → watching | completed | on-hold | dropped | plan-to-watch
/stats
/profile          → profil sendiri; nanti menjadi profil publik /u/:username
/settings
```

**Keputusan 2026-09-29:** YuWib bersifat publik untuk penjelajahan — siapa pun boleh
melihat /browse dan detail anime tanpa akun; akun hanya dibutuhkan untuk mencatat.
Guard karena itu TIDAK lagi di `_app.tsx` (yang kini hanya AppShell), melainkan di
layout pathless `_app/_auth.tsx` yang membungkus halaman privat saja.

Prinsip: **status = path param** (bookmarkable), **filter/sort = search params**
(`/list/completed?sort=score&genre=Drama&view=table`) — state hidup di URL,
bukan `useState`.

### `/dashboard` — "mau nonton apa sekarang?"
- Continue watching: kartu status watching + progress bar + tombol **+1 episode** (1 klik).
- Airing minggu ini: anime di list yang masih tayang, urut hari (Jikan `broadcast.day/time`).
- Quick stats: total anime, episode ditonton, hari terpakai, mean score.
- Recent activity: 10 perubahan terakhir.
- Random pick dari plan-to-watch.
- Season ini (Jikan `/seasons/now`) untuk discovery.

### `/list/:status` — tempat paling sering *mengedit*
- Tab per status dengan jumlah item (dihitung dari seluruh entri, bukan hasil filter).
- Toggle grid (poster) / table (kompak, ala MAL), tersimpan di `?view=`.
- Sort: terakhir diubah (default), judul, skor, progress, tanggal mulai + arah naik/turun.
- Filter: genre, tipe, tahun, pencarian dalam list. Pilihan filter dikumpulkan dari isi list itu sendiri.
- **Inline edit** tanpa buka detail: +1/−1 episode, skor, status.
- Empty state per tab yang mengarahkan ke `/browse`.

**Satu query untuk seluruh list.** `listEntriesQueryOptions` mengambil semua entri user
sekaligus beserta relasi `anime` (`select('*, anime(*)')`). Halaman Browse memakai query
yang sama untuk menandai kartu yang sudah masuk list — 24 kartu = 1 request, bukan 24.

**Filter & sort dikerjakan di browser**, bukan SQL, karena datanya sudah ada di memori
sehingga terasa seketika. Pindahkan ke query SQL kalau list mencapai ribuan baris —
begitu juga virtualisasi (TanStack Virtual), ditunda sampai benar-benar terasa lambat.

**Aturan turunan** ada di `src/features/list/entryPatch.ts` (fungsi murni, tanpa akses DB,
supaya hasil pembaruan optimis identik dengan yang dikirim ke server):
- episode terakhir tercapai saat `watching` → status jadi `completed` + `finish_date` hari ini
- status jadi `completed` → `episodes_watched` disamakan dengan total episode
- `start_date`/`finish_date` hanya diisi kalau masih kosong — catatan lama user tidak pernah ditimpa

**Pembaruan optimis** dipakai `useUpdateEntry` (onMutate → setQueryData, onError → rollback,
onSettled → invalidate), karena +1 episode adalah aksi yang paling sering ditekan.

### `/anime/:malId` — dua zona, halaman PUBLIK
- **Global** (API): poster, judul (romaji/english/japanese), tipe, episode,
  status tayang, season, studio, genre (klik → `/browse?genres=`), skor & rank MAL,
  sinopsis (collapse), trailer, **relations** (prequel/sequel), karakter & VA,
  rekomendasi. Tiga tab: Ikhtisar / Karakter / Rekomendasi, aktifnya disimpan di `?tab=`.
- **Personal** (sidebar sticky, `EntryEditor`): status, skor 1–10, stepper
  episode, tanggal mulai/selesai, rewatch count, favorit, catatan, hapus dari list.
  Belum login → ajakan masuk; belum di list → tombol pilih status.
- Auto-behavior ditangani `entryPatch.ts` (lihat bagian `/list/:status`).

**Pemuatan bertahap.** Detail anime di-prefetch lewat `loader` route (dan saat kursor
hover di kartu, berkat `defaultPreload: 'intent'`). Karakter (60+ entri) dan rekomendasi
(80+ entri) punya query terpisah dengan `enabled` yang baru menyala saat tabnya dibuka.
Trailer hanya memasang iframe YouTube setelah tombol putar ditekan; sebelum itu thumbnail statis.

### `/browse` — publik, tiga mode dalam satu grid

| Mode | URL | Endpoint |
|---|---|---|
| Musim (default) | `/browse` | `/seasons/{year}/{season}` |
| Filter genre | `/browse?genres=1,10` | `/anime?genres=…` |
| Pencarian | `/browse?q=frieren` | `/anime?q=…` |

- Kata kunci dan genre **boleh digabung** (endpoint `/anime` menerima keduanya).
- Endpoint `/seasons` **mengabaikan** parameter `genres` (sudah diuji), jadi memilih genre
  otomatis berpindah ke mode filter dan pemilih musim disembunyikan.
- Urutan hanya tersedia di mode filter: skor (`order_by=score`), terpopuler (`order_by=members`
  — bukan `popularity`, karena anime tanpa peringkat bernilai 0 dan naik ke atas),
  terbaru (`order_by=start_date` + `end_date=hari ini` untuk menyaring anime yang belum tayang).
- Genre Hentai (12) dan Erotica (49) disembunyikan dari chip: selalu 0 hasil karena `sfw=true`.
- Command palette (shadcn `Command`) untuk quick search dari mana saja — menyusul.

### `/stats`
- Baris angka utama: total anime, episode ditonton, waktu tonton (hari), skor rata-rata.
- Komposisi status (bar bertumpuk), sebaran skor 1–10, selesai per bulan (12 bulan), genre terbanyak.
- Semua dihitung di browser dari entri yang sudah diambil — tanpa query agregasi tambahan.
- Durasi episode yang tidak diketahui dianggap 24 menit supaya "waktu tonton" tetap masuk akal.

**Grafik dibuat sendiri dari elemen HTML**, bukan memakai Recharts seperti rencana awal:
semuanya keluarga batang (tanpa sumbu, kurva, atau skala rumit), jadi versi buatan sendiri
lebih kecil dan warnanya bisa dipastikan lolos uji keterbacaan.

**Warna grafik sudah divalidasi** (`src/features/stats/chartColors.ts`). Isian batang memakai
tingkat warna lebih gelap daripada badge status: teks di latar gelap butuh warna terang (*-400),
sedangkan bidang isian butuh lightness OKLCH 0,48–0,67. Urutan status pada bar bertumpuk
(completed → watching → on_hold → plan → dropped) juga hasil uji: jarak warna pasangan
bersebelahan terburuk ΔE 24,7 di bawah simulasi protanopia/deuteranopia (target ≥ 8).
Urutan lain bisa mendekatkan amber dan rose yang hanya berjarak ΔE 5,5.

### `/settings`
- Info akun, **preferensi konten dewasa**, **impor MAL XML**, ekspor JSON. Username diatur di `/profile`.

**Konten dewasa (`profiles.show_nsfw`, default false).** Disimpan di profil, bukan di browser,
supaya ikut akun lintas perangkat. Pengunjung anonim selalu dianggap false — halaman Browse dan
detail bersifat publik, jadi tanpa akun tidak ada yang bisa menyalakannya.
- Menyalakan butuh konfirmasi 18+ (dua langkah); mematikan cukup satu klik.
- Nilainya diteruskan ke API sebagai `sfw: !showNsfw` di `buildBrowseRequest`.
- Chip genre Hentai (12) & Erotica (49) hanya muncul saat preferensi menyala — saat mati keduanya
  selalu 0 hasil, jadi menampilkannya hanya membuat tombol yang sia-sia.
- **Cache aman tanpa kerja tambahan**: `sfw` ada di dalam objek `params` yang ikut menjadi queryKey,
  jadi menyalakan preferensi otomatis memakai entri cache berbeda — hasil lama yang tersaring
  tidak pernah dipakai ulang.

**Impor MAL** (`src/features/settings/`):
- Menerima `.xml` maupun `.xml.gz` — berkas gzip dibuka dengan `DecompressionStream` bawaan
  browser, tanpa pustaka tambahan (deteksi lewat nama berkas *dan* magic byte `1f 8b`).
- `my_status` diterima dalam dua bentuk: teks ("Completed") dari ekspor MAL, dan kode angka
  1/2/3/4/6 yang dipakai sebagian pembuat berkas lain.
- Tanggal kosong MAL `0000-00-00` → `null`; skor 0 → `null` (artinya belum dinilai).
- Entri ganda: kemunculan PERTAMA dipertahankan, sisanya dihitung sebagai dilewati.
- Anime yang snapshot-nya sudah ada di tabel `anime` **tidak diambil ulang** dari API —
  impor kedua kalinya hampir tanpa request.
- Disimpan dengan `onConflict: 'user_id,mal_id'`, jadi impor ulang memperbarui entri
  yang ada, bukan menggandakannya.
- Anime yang gagal diambil (mis. sudah dihapus dari MAL) dilaporkan per judul dan tidak
  menggagalkan seluruh impor.

---

## 5. Struktur Folder

```
src/
├── app/            router, providers (QueryClient, Supabase, Theme), AppShell
├── features/
│   ├── auth/       useSession, LoginForm, RequireAuth
│   ├── anime/      jikan client, useAnime(id), useSearch, AnimeHero, RelationsList
│   ├── list/       useListEntries, EntryEditor, ListTable, ListGrid, ListFilters
│   ├── dashboard/  ContinueWatching, AiringThisWeek, ActivityFeed
│   └── stats/      query agregasi + chart
├── components/ui/  primitif shadcn: Button, Select, Dialog, Tabs, Command…
├── lib/            supabase.ts, queryClient.ts, utils
└── types/          database.types.ts (generated), jikan.types.ts
```

Komponen shared yang **harus tunggal** (dipakai di detail dan quick-edit list):
`EntryEditor`, `AnimeCard`, `ProgressStepper`, `ScoreSelect`, `StatusSelect`, `StatusBadge`,
`AddToListButton`.

**Bentuk data bersama: `AnimeSnapshot`** (= baris tabel `anime`). `AnimeCard` dan `AnimeGrid`
menerima bentuk ini, sehingga komponen yang sama dipakai di Browse (data dari API, lewat
`jikanToSnapshot`) maupun My List & Dashboard (data dari database, tanpa konversi apa pun).

### Layout (perombakan 2026-09-29)

Sidebar vertikal dan bottom nav **dihapus**; navigasi pindah ke top bar:

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  YuWib   Browse  Dashboard  My List  Stats          (A)    │
└──────────────────────────────────────────────────────────────┘
  ↑ hamburger hanya < md                     avatar / Login|Register ┘
```

- Desktop: nav horizontal. Ingin hamburger di semua ukuran? ganti `hidden md:flex`
  menjadi `hidden` pada nav di `src/app/TopBar.tsx`.
- Mobile: hamburger membuka panel geser (shadcn `Sheet`).
- Kanan atas: avatar bulat → dropdown (Check Profile, Settings, Logout).
  Belum login → tautan "Login | Register".
- Konten kini selebar `max-w-7xl` tanpa sidebar 240px — ruang lebih untuk tabel My List.

---

## 6. Urutan Build

1. ✅ Scaffold (Vite + TanStack Router + Query + Tailwind + shadcn) + Supabase client + migration SQL
2. ✅ Auth (`/login`, guard, UserMenu)
3. ✅ `/browse` — pencarian, filter genre, seasonal
   3b. ✅ Perombakan layout (top bar + hamburger), halaman publik, `/profile`
4. ✅ Tambah ke list (snapshot `anime` + insert `list_entries`)
5. ✅ `/list/:status` + inline edit
6. ✅ `/anime/:malId` + `EntryEditor`
7. ✅ `/dashboard`
8. ✅ `/stats`
9. ✅ Impor MAL XML + ekspor JSON

---

## 7. Detail Teknis Kecil yang Sudah Disepakati

- TanStack Query: `staleTime` 24 jam untuk data API anime (prefix queryKey `anime-api`),
  persist ke IndexedDB (`@tanstack/query-persist-client-core`).
- Throttle request di client (antrean dengan jeda per host) untuk batch seperti import MAL.
- Optimistic update untuk +1 episode dan ubah status.
- Tipe DB di-generate: `supabase gen types typescript`.
- Poster hotlink dari `cdn.myanimelist.net` (`images.jpg.large_image_url`) — sama di Tenrai maupun Jikan.
- Dark mode default.

---

## 8. Development Lokal (Supabase CLI + Docker)

Keputusan 2026-09-13: testing lokal dulu, cloud belakangan. Kode app tidak berbeda —
hanya `.env` yang menunjuk ke Supabase lokal.

```
npx supabase start          # nyalakan stack lokal (Postgres, Auth, Studio); migration otomatis dijalankan
npx supabase status         # lihat URL + key lokal (API http://127.0.0.1:54321, Studio http://127.0.0.1:54323)
npx supabase db reset       # jalankan ulang semua migration dari nol (data lokal hilang)
npx supabase stop           # matikan stack
npx supabase gen types typescript --local > src/types/database.types.ts   # generate tipe DB
```

### Memulai kembali (checklist harian)

1. Nyalakan Docker Desktop di Windows (tunggu ikon tray stabil).
2. Terminal WSL: `cd ~/YuWib && npx supabase start` — data lama tetap ada (tersimpan di Docker volume).
3. Terminal kedua: `npm run dev` → http://localhost:5173
4. Selesai: `npx supabase stop` (data tidak hilang). Data hanya hilang lewat `supabase db reset`.

- Migration ada di `supabase/migrations/*.sql`. Setiap perubahan skema = file migration baru, bukan edit file lama.
- Email konfirmasi lokal tidak benar-benar terkirim; lihat di Inbucket/Mailpit yang URL-nya muncul di `supabase status`.
- Saat siap online: `npx supabase link --project-ref <ref>` lalu `npx supabase db push`.

---

## 9. Catatan untuk Versi Publik (DITUNDA)

Tiga keputusan kecil di atas sudah diambil sejak awal karena gratis:
tabel `profiles` minimal, policy `list_entries` dipecah per operasi,
kolom `notes` = privat (kolom `review` publik ditambah nanti).

Yang **belum** dikerjakan dan baru dikerjakan setelah versi personal selesai:

- Buka sign-up + email confirmation + captcha.
- `profiles.list_visibility`, halaman `/u/:username`, policy select publik.
- **Pindahkan jalur tulis `anime` dari browser ke Edge Function `sync-anime`**
  — wajib sebelum sign-up dibuka, karena saat ini user mana pun bisa menimpa
  snapshot untuk semua orang.
- View publik `list_entries` tanpa kolom `notes`.
- Moderasi review (report + `is_hidden`).
- **Konten dewasa di profil publik.** Tabel `anime` dibaca bersama, jadi snapshot anime dewasa
  yang ditambahkan seorang user tetap ada di sana. Sekarang tidak jadi masalah (harus tahu
  `mal_id`-nya), tapi profil publik yang menampilkan list orang lain perlu menyaringnya
  mengikuti preferensi PEMBACA, bukan pemilik list.
- OG/link preview via Cloudflare Pages Function, atau SSR via TanStack Start.
- Pertimbangkan MAL API resmi / AniList untuk lisensi data.
  Catatan: MAL API resmi **tidak mengirim header CORS**, jadi butuh proxy (Edge Function) —
  tidak bisa dipanggil langsung dari browser seperti Tenrai/Jikan. AniList bisa (CORS `*`,
  punya field `idMal`) dan layak jadi sumber ketiga kalau Tenrai dan Jikan sama-sama tumbang.
