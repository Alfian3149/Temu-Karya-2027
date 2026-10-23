-- Jalankan sekali di SQL Editor jika tabel grup_perjalanan sudah dibuat
-- sebelum kolom jam kedatangan ditambahkan.
alter table public.grup_perjalanan
  add column if not exists jam_datang time;

update public.grup_perjalanan
set jam_datang = '00:00'
where jam_datang is null;

alter table public.grup_perjalanan
  alter column jam_datang set not null;
