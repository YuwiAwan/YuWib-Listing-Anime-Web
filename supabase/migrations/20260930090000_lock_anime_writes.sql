-- Menutup celah penulisan tabel `anime` dan memperketat data list sebelum situs dibuka untuk umum.
--
-- Masalahnya: tabel `anime` dibaca bersama oleh semua user, tapi dulu setiap user yang login boleh
-- insert/update baris MANA SAJA dengan isi apa saja. Satu user iseng bisa mengganti judul/poster
-- anime untuk semua orang. Sekarang penulisan hanya lewat Edge Function sync-anime, yang mengambil
-- datanya sendiri dari API dan menulis memakai service role (service role melewati RLS, jadi
-- function tetap bisa menulis walau policy di bawah dihapus).

-- 1. Cabut izin tulis user. Tanpa policy insert/update, RLS menolak semua penulisan dari browser.
drop policy "anime: insert by authenticated" on public.anime;
drop policy "anime: update by authenticated" on public.anime;
-- Policy "anime: readable by all" tetap: siapa pun (termasuk anonim) boleh MEMBACA.

-- 2. Batas wajar untuk data yang ditulis user sendiri. RLS hanya memastikan user menulis baris
--    miliknya; constraint ini mencegah isi yang tidak masuk akal (mis. catatan berukuran megabyte).
alter table public.list_entries
  add constraint list_entries_notes_length check (notes is null or char_length(notes) <= 5000),
  add constraint list_entries_rewatch_range check (rewatch_count between 0 and 999),
  add constraint list_entries_episodes_range check (episodes_watched <= 100000);
