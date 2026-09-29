-- Preferensi per akun: menampilkan anime dewasa (Hentai/Erotica/Ecchi eksplisit) di hasil penjelajahan.
-- Disimpan di profiles, bukan di browser, supaya ikut akun saat dibuka dari perangkat lain.
-- Default false: konten dewasa hanya muncul setelah user menyalakannya sendiri.
alter table public.profiles
  add column show_nsfw boolean not null default false;

comment on column public.profiles.show_nsfw is
  'Kalau true, request ke API anime dikirim tanpa filter sfw. Pengunjung anonim selalu dianggap false.';
