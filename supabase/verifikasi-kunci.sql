-- Jalankan sekali di SQL Editor pada database yang sudah ada.
-- Menambah pencatat persetujuan dan mengunci data setelah disetujui atau ditolak.

alter table public.peserta
  add column if not exists diverifikasi_oleh uuid references public.profil (id) on delete set null,
  add column if not exists diverifikasi_pada timestamptz;

alter table public.peserta_lomba
  add column if not exists diverifikasi_oleh uuid references public.profil (id) on delete set null,
  add column if not exists diverifikasi_pada timestamptz;

alter table public.pembayaran
  add column if not exists diverifikasi_oleh uuid references public.profil (id) on delete set null,
  add column if not exists diverifikasi_pada timestamptz;

alter table public.surat_tugas
  add column if not exists diverifikasi_oleh uuid references public.profil (id) on delete set null,
  add column if not exists diverifikasi_pada timestamptz;

alter table public.penempatan
  add column if not exists diverifikasi_oleh uuid references public.profil (id) on delete set null,
  add column if not exists diverifikasi_pada timestamptz;

create or replace function public.kunci_status_verifikasi()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if public.punya_peran('user') or new.status is null then
      new.status := 'Menunggu Verifikasi';
      new.catatan_admin := null;
      new.diverifikasi_oleh := null;
      new.diverifikasi_pada := null;
    elsif new.status in ('Terverifikasi', 'Ditolak') then
      new.diverifikasi_oleh := auth.uid();
      new.diverifikasi_pada := now();
    end if;
    return new;
  end if;

  if old.status is distinct from 'Menunggu Verifikasi' then
    if public.punya_peran('superuser') and new.status = 'Menunggu Verifikasi' then
      new := old;
      new.status := 'Menunggu Verifikasi';
      new.catatan_admin := null;
      new.diverifikasi_oleh := null;
      new.diverifikasi_pada := null;
      return new;
    end if;
    raise exception 'Data sudah diverifikasi dan terkunci. Hanya Superuser yang dapat membuka akses.';
  end if;

  if public.punya_peran('user') and (
    new.status is distinct from old.status
    or new.catatan_admin is distinct from old.catatan_admin
  ) then
    raise exception 'Status verifikasi hanya dapat diubah oleh admin';
  end if;

  if new.status in ('Terverifikasi', 'Ditolak') and new.status is distinct from old.status then
    new.diverifikasi_oleh := auth.uid();
    new.diverifikasi_pada := now();
  elsif new.status = 'Menunggu Verifikasi' then
    new.diverifikasi_oleh := null;
    new.diverifikasi_pada := null;
  end if;

  return new;
end;
$$;

create or replace function public.kunci_hapus_terverifikasi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.status is distinct from 'Menunggu Verifikasi' then
    raise exception 'Data sudah diverifikasi dan terkunci. Superuser harus membuka akses terlebih dahulu.';
  end if;
  return old;
end;
$$;

create or replace function public.kunci_medis_peserta()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  pid uuid := coalesce(new.peserta_id, old.peserta_id);
  st public.status_verifikasi;
begin
  select status into st from public.peserta where id = pid;
  if st is distinct from 'Menunggu Verifikasi' then
    raise exception 'Data peserta sudah diverifikasi dan terkunci. Superuser harus membuka akses terlebih dahulu.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.kunci_keanggotaan_lomba()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  st public.status_verifikasi;
begin
  select status into st from public.peserta where id = coalesce(new.peserta_id, old.peserta_id);
  if st is distinct from 'Menunggu Verifikasi' then
    raise exception 'Data peserta sudah diverifikasi dan terkunci. Superuser harus membuka akses terlebih dahulu.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function public.kunci_cocok_pembayaran()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  st public.status_verifikasi;
begin
  select status into st from public.pembayaran where id = coalesce(new.pembayaran_id, old.pembayaran_id);
  if st is distinct from 'Menunggu Verifikasi' then
    raise exception 'Pembayaran sudah diverifikasi dan terkunci. Superuser harus membuka akses terlebih dahulu.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists peserta_kunci_hapus on public.peserta;
create trigger peserta_kunci_hapus
  before delete on public.peserta
  for each row execute function public.kunci_hapus_terverifikasi();

drop trigger if exists peserta_lomba_kunci_hapus on public.peserta_lomba;
create trigger peserta_lomba_kunci_hapus
  before delete on public.peserta_lomba
  for each row execute function public.kunci_hapus_terverifikasi();

drop trigger if exists pembayaran_kunci_hapus on public.pembayaran;
create trigger pembayaran_kunci_hapus
  before delete on public.pembayaran
  for each row execute function public.kunci_hapus_terverifikasi();

drop trigger if exists surat_kunci_hapus on public.surat_tugas;
create trigger surat_kunci_hapus
  before delete on public.surat_tugas
  for each row execute function public.kunci_hapus_terverifikasi();

drop trigger if exists penempatan_kunci_hapus on public.penempatan;
create trigger penempatan_kunci_hapus
  before delete on public.penempatan
  for each row execute function public.kunci_hapus_terverifikasi();

drop trigger if exists peserta_lomba_kunci_anggota on public.peserta_lomba;
create trigger peserta_lomba_kunci_anggota
  before insert or delete on public.peserta_lomba
  for each row execute function public.kunci_keanggotaan_lomba();

drop trigger if exists medis_kunci_peserta on public.riwayat_medis;
create trigger medis_kunci_peserta
  before insert or update or delete on public.riwayat_medis
  for each row execute function public.kunci_medis_peserta();

drop trigger if exists penyakit_kunci_peserta on public.riwayat_medis_penyakit;
create trigger penyakit_kunci_peserta
  before insert or update or delete on public.riwayat_medis_penyakit
  for each row execute function public.kunci_medis_peserta();

drop trigger if exists pembayaran_peserta_kunci on public.pembayaran_peserta;
create trigger pembayaran_peserta_kunci
  before insert or update or delete on public.pembayaran_peserta
  for each row execute function public.kunci_cocok_pembayaran();
