-- Menambah jadwal tayang ke snapshot anime.
-- Dibutuhkan bagian "Tayang minggu ini" di Dashboard: tanpa kolom ini, halaman harus memanggil
-- API sekali per anime yang sedang tayang — melanggar prinsip "halaman list & dashboard hanya baca Supabase".
alter table public.anime
  add column broadcast_day  text,  -- contoh: "Fridays" (apa adanya dari API)
  add column broadcast_time text;  -- contoh: "23:00" (waktu Jepang)

comment on column public.anime.broadcast_day is 'Hari tayang mingguan dari API, mis. "Fridays". Null kalau tidak terjadwal.';
