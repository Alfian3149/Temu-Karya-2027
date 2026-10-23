-- Jalankan sekali di SQL Editor pada database yang sudah ada.
-- Lokasi dari/ke, kendaraan, dan status selesai untuk jadwal kedatangan serta kepulangan.

alter table public.grup_perjalanan
  add column if not exists dari_datang text not null default '',
  add column if not exists ke_berangkat text not null default '',
  add column if not exists kendaraan_datang_id uuid,
  add column if not exists kendaraan_berangkat_id uuid,
  add column if not exists status_datang text not null default 'Belum',
  add column if not exists status_berangkat text not null default 'Belum';

alter table public.grup_perjalanan drop constraint if exists grup_perjalanan_status_datang_check;
alter table public.grup_perjalanan
  add constraint grup_perjalanan_status_datang_check check (status_datang in ('Belum', 'Selesai'));

alter table public.grup_perjalanan drop constraint if exists grup_perjalanan_status_berangkat_check;
alter table public.grup_perjalanan
  add constraint grup_perjalanan_status_berangkat_check check (status_berangkat in ('Belum', 'Selesai'));

alter table public.grup_perjalanan drop constraint if exists grup_kendaraan_datang_fk;
alter table public.grup_perjalanan
  add constraint grup_kendaraan_datang_fk foreign key (kendaraan_datang_id) references public.transportasi (id) on delete set null;

alter table public.grup_perjalanan drop constraint if exists grup_kendaraan_berangkat_fk;
alter table public.grup_perjalanan
  add constraint grup_kendaraan_berangkat_fk foreign key (kendaraan_berangkat_id) references public.transportasi (id) on delete set null;

drop policy if exists grup_ubah_akomodasi on public.grup_perjalanan;
create policy grup_ubah_akomodasi on public.grup_perjalanan
  for update to authenticated
  using (public.punya_peran('superuser', 'accom_admin'))
  with check (public.punya_peran('superuser', 'accom_admin'));

create or replace function public.kunci_ubah_trip_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.punya_peran('user') then
    return new;
  end if;
  if new.kontingen_id is distinct from old.kontingen_id
     or new.nama is distinct from old.nama
     or new.lokasi_datang is distinct from old.lokasi_datang
     or new.tanggal_datang is distinct from old.tanggal_datang
     or new.jam_datang is distinct from old.jam_datang
     or new.lokasi_berangkat is distinct from old.lokasi_berangkat
     or new.tanggal_berangkat is distinct from old.tanggal_berangkat
     or new.jam_berangkat is distinct from old.jam_berangkat then
    raise exception 'Admin akomodasi hanya dapat mengubah lokasi dari/ke, kendaraan, dan status trip';
  end if;
  return new;
end;
$$;

drop trigger if exists grup_kunci_trip_admin on public.grup_perjalanan;
create trigger grup_kunci_trip_admin
  before update on public.grup_perjalanan
  for each row execute function public.kunci_ubah_trip_admin();
