-- Jalankan sekali di SQL Editor pada database yang sudah ada.
-- Halaman publik saat QR ID card peserta dipindai.

create or replace function public.kartu_peserta(nomor text)
returns table (
  nomor_registrasi text,
  nama text,
  gereja text,
  mupel text,
  hotel text,
  kamar text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.nomor_registrasi,
    p.nama,
    p.gereja,
    p.mupel,
    coalesce(h.nama, '') as hotel,
    coalesce(k.nama, '') as kamar
  from public.peserta p
  left join public.penempatan t on t.peserta_id = p.id
  left join public.kamar k on k.id = t.kamar_id
  left join public.hotel h on h.id = k.hotel_id
  where p.nomor_registrasi = btrim(nomor)
  limit 1;
$$;

comment on function public.kartu_peserta(text) is 'Halaman publik hasil pindai QR ID card. Tidak menyertakan kontak, medis, atau berkas.';

revoke all on function public.kartu_peserta(text) from public;
grant execute on function public.kartu_peserta(text) to anon, authenticated;

alter table public.grup_perjalanan
  alter column lokasi_datang set default '',
  alter column lokasi_berangkat set default '';
