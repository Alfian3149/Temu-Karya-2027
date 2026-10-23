-- Jalankan sekali di SQL Editor jika database sudah dibuat dari schema.sql versi sebelumnya.
-- Menambah asal mupel pada akun kontingen dan menyamakan mupel peserta dengan akun tersebut.

alter table public.profil add column if not exists mupel text;
alter table public.profil add column if not exists whatsapp text;
alter table public.profil add column if not exists gereja text;

alter table public.profil drop constraint if exists profil_mupel_cek;
alter table public.profil add constraint profil_mupel_cek check (
  mupel is null or mupel in (
    'BABEL', 'BALI-NTB', 'BANTEN', 'BEKASI', 'JABAR I', 'JABAR II',
    'JAKBAR', 'JAKPUS', 'JAKSEL', 'JAKTIM', 'JAKUT', 'JAMBI',
    'JATENG-DIY', 'JATIM', 'KALBAR', 'KALSELTENG', 'KALTARA-BERKAT',
    'KALTIM I', 'KALTIM II', 'KEPRI', 'LAMPUNG', 'SULSELBARA',
    'SUMBAR-RIAU', 'SUMSEL', 'SUMUT-ACEH'
  )
);

alter table public.profil drop constraint if exists profil_whatsapp_cek;
alter table public.profil add constraint profil_whatsapp_cek check (
  whatsapp is null or whatsapp ~ '^(\+?62|0)8[0-9]{7,12}$'
);

comment on column public.profil.mupel is 'Asal mupel ketua kontingen. Peserta kontingen dipaksa memakai nilai ini.';
comment on column public.profil.whatsapp is 'Nomor WhatsApp ketua kontingen. Opsional.';
comment on column public.profil.gereja is 'Asal gereja ketua kontingen. Opsional.';

create or replace function public.tangani_pengguna_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asal text := nullif(btrim(new.raw_user_meta_data ->> 'mupel'), '');
begin
  if asal is not null and asal not in (
    'BABEL', 'BALI-NTB', 'BANTEN', 'BEKASI', 'JABAR I', 'JABAR II',
    'JAKBAR', 'JAKPUS', 'JAKSEL', 'JAKTIM', 'JAKUT', 'JAMBI',
    'JATENG-DIY', 'JATIM', 'KALBAR', 'KALSELTENG', 'KALTARA-BERKAT',
    'KALTIM I', 'KALTIM II', 'KEPRI', 'LAMPUNG', 'SULSELBARA',
    'SUMBAR-RIAU', 'SUMSEL', 'SUMUT-ACEH'
  ) then
    asal := null;
  end if;

  insert into public.profil (id, nama, email, peran, mupel)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'user',
    asal
  );
  return new;
end;
$$;

create or replace function public.sesuaikan_mupel_peserta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.peran = 'user'
     and new.mupel is not null
     and new.mupel is distinct from old.mupel then
    update public.peserta
      set mupel = new.mupel
      where kontingen_id = new.id
        and mupel is distinct from new.mupel;
  end if;
  return new;
end;
$$;

drop trigger if exists profil_sesuaikan_mupel on public.profil;
create trigger profil_sesuaikan_mupel
  after update of mupel on public.profil
  for each row execute function public.sesuaikan_mupel_peserta();

create or replace function public.samakan_mupel_peserta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mupel_ketua text;
  peran_ketua public.peran;
begin
  select p.mupel, p.peran into mupel_ketua, peran_ketua
  from public.profil p
  where p.id = new.kontingen_id;

  if peran_ketua = 'user' then
    if mupel_ketua is null or btrim(mupel_ketua) = '' then
      if tg_op = 'INSERT' then
        raise exception 'Ketua kontingen wajib mengisi asal mupel sebelum mendaftarkan peserta';
      end if;
      return new;
    end if;
    new.mupel := mupel_ketua;
  end if;
  return new;
end;
$$;

drop trigger if exists peserta_samakan_mupel on public.peserta;
create trigger peserta_samakan_mupel
  before insert or update on public.peserta
  for each row execute function public.samakan_mupel_peserta();

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
    if tg_table_name = 'peserta'
       and (to_jsonb(new) - 'mupel' - 'updated_at') = (to_jsonb(old) - 'mupel' - 'updated_at')
       and exists (
         select 1
         from public.profil p
         where p.id = new.kontingen_id
           and p.peran = 'user'
           and p.mupel is not null
           and p.mupel = new.mupel
       ) then
      return new;
    end if;
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

create or replace view public.v_kontingen
with (security_invoker = true) as
select
  p.id,
  p.nama as ketua,
  p.email,
  coalesce(
    nullif(btrim(p.mupel), ''),
    (
      select s.mupel
      from public.peserta s
      where s.kontingen_id = p.id
      group by s.mupel
      order by count(*) desc, s.mupel
      limit 1
    ),
    p.nama
  ) as nama_kontingen
from public.profil p
where p.peran = 'user';

comment on view public.v_kontingen is 'Kontingen = ketua (profil peran user). Nama memakai asal mupel pada profil.';

create or replace view public.v_klasemen_publik
with (security_invoker = false) as
with skor as (
  select
    pp.kontingen_id,
    pt.lomba,
    pt.id as pertandingan_id,
    pp.poin,
    max(pp.poin) over (partition by pt.id) as tertinggi
  from public.pertandingan_poin pp
  join public.pertandingan pt on pt.id = pp.pertandingan_id
),
per_match as (
  select
    kontingen_id,
    lomba,
    pertandingan_id,
    poin,
    tertinggi,
    count(*) filter (where poin = tertinggi) over (partition by pertandingan_id) as jumlah_puncak
  from skor
),
agregat as (
  select
    kontingen_id,
    sum(poin) as total_poin,
    count(*) as main,
    count(*) filter (where poin = tertinggi and jumlah_puncak = 1) as menang
  from per_match
  group by kontingen_id
),
kontingen as (
  select
    p.id,
    coalesce(
      nullif(btrim(p.mupel), ''),
      (
        select s.mupel
        from public.peserta s
        where s.kontingen_id = p.id
        group by s.mupel
        order by count(*) desc, s.mupel
        limit 1
      ),
      p.nama
    ) as nama_kontingen,
    p.nama as ketua
  from public.profil p
  where p.peran = 'user'
    and exists (select 1 from public.peserta s where s.kontingen_id = p.id)
)
select
  k.id as kontingen_id,
  k.nama_kontingen,
  k.ketua,
  coalesce(a.total_poin, 0) as total_poin,
  coalesce(a.menang, 0)::integer as menang,
  coalesce(a.main, 0)::integer as main,
  rank() over (
    order by coalesce(a.total_poin, 0) desc, coalesce(a.menang, 0) desc
  ) as peringkat
from kontingen k
left join agregat a on a.kontingen_id = k.id;
