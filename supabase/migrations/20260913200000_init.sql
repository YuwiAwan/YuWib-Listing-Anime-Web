-- Migration awal YuWib: tabel anime (snapshot Jikan), list_entries (data personal), profiles,
-- beserta RLS dan trigger. Mengacu ke docs/PLAN.md §3.
-- Dijalankan otomatis oleh `supabase start` / `supabase db reset` (lokal) dan `supabase db push` (cloud).

-- ============================================================
-- 1. ENUM status list — nilainya sama dengan LIST_STATUSES di src/features/list/status.ts
-- ============================================================
create type public.list_status as enum ('watching', 'completed', 'on_hold', 'dropped', 'plan_to_watch');

-- ============================================================
-- 2. TABEL anime — snapshot data global dari Jikan untuk anime yang pernah masuk list.
--    Dibaca bersama oleh semua user; bukan mirror penuh MAL.
-- ============================================================
create table public.anime (
  mal_id        int primary key,
  title         text not null,
  title_english text,
  image_url     text,
  type          text,                    -- TV / Movie / OVA / ONA / Special
  episodes      int,                     -- null kalau MAL belum tahu (anime masih tayang)
  duration_min  int,                     -- durasi per episode (menit), untuk hitung "hari terpakai" di /stats
  airing_status text,                    -- Currently Airing / Finished Airing / Not yet aired
  season        text,                    -- winter / spring / summer / fall
  year          int,
  genres        text[] not null default '{}',
  mal_score     numeric(4,2),            -- skor komunitas MAL saat snapshot diambil
  cached_at     timestamptz not null default now()  -- dipakai untuk refresh snapshot yang > 7 hari
);

comment on table public.anime is 'Snapshot data anime dari Jikan. Di-refresh saat halaman detail dibuka jika cached_at sudah tua.';

-- ============================================================
-- 3. TABEL profiles — satu baris per user, dibuat otomatis saat signup (lihat trigger di bawah)
-- ============================================================
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  username   text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 4. TABEL list_entries — data personal: status, skor, progress, catatan
-- ============================================================
create table public.list_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  mal_id           int  not null references public.anime,
  status           public.list_status not null default 'plan_to_watch',
  score            smallint check (score between 1 and 10),
  episodes_watched int not null default 0 check (episodes_watched >= 0),
  start_date       date,
  finish_date      date,
  rewatch_count    int not null default 0,
  is_favorite      boolean not null default false,
  notes            text,                 -- catatan PRIVAT; kolom `review` (publik) ditambah di versi publik
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, mal_id)               -- satu anime hanya boleh sekali per user
);

-- Index untuk query paling sering: tab per status, dan "recent activity" di dashboard
create index list_entries_user_status_idx on public.list_entries (user_id, status);
create index list_entries_user_updated_idx on public.list_entries (user_id, updated_at desc);

-- ============================================================
-- 5. TRIGGER: updated_at otomatis terisi setiap baris list_entries diubah
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger list_entries_set_updated_at
  before update on public.list_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. TRIGGER: buat baris profiles otomatis saat user baru mendaftar.
--    Username awal "user_" + 8 karakter pertama dari id; bisa diganti user di /settings.
--    security definer: fungsi berjalan sebagai pemilik (postgres), karena auth.users bukan milik user biasa.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'user_' || substr(replace(new.id::text, '-', ''), 1, 8));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
alter table public.anime        enable row level security;
alter table public.profiles     enable row level security;
alter table public.list_entries enable row level security;

-- anime: bebas dibaca; boleh ditulis user login (fase single-user).
-- CATATAN VERSI PUBLIK: jalur tulis ini harus dipindah ke Edge Function `sync-anime`
-- sebelum sign-up dibuka, supaya user tidak bisa menimpa snapshot milik bersama.
create policy "anime: readable by all"
  on public.anime for select using (true);
create policy "anime: insert by authenticated"
  on public.anime for insert to authenticated with check (true);
create policy "anime: update by authenticated"
  on public.anime for update to authenticated using (true);

-- profiles: hanya milik sendiri (versi publik nanti menambah select untuk semua)
create policy "profiles: select own"
  on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles: update own"
  on public.profiles for update using ((select auth.uid()) = id);

-- list_entries: dipecah per operasi supaya versi publik cukup menambah satu policy select
create policy "list_entries: select own"
  on public.list_entries for select using ((select auth.uid()) = user_id);
create policy "list_entries: insert own"
  on public.list_entries for insert with check ((select auth.uid()) = user_id);
create policy "list_entries: update own"
  on public.list_entries for update using ((select auth.uid()) = user_id);
create policy "list_entries: delete own"
  on public.list_entries for delete using ((select auth.uid()) = user_id);
