-- Jalankan sekali di SQL Editor pada database yang sudah ada.
-- Feedback verifikasi peserta, unggah KTP, daftar lomba, dan batas 2 lomba.

-- Daftar lomba: Kekaryaan menggantikan Pelatihan Kekaryaan, Seminar dihapus dari data, Gapple ditambah.
do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'nama_lomba' and e.enumlabel = 'Pelatihan Kekaryaan'
  ) then
    alter type public.nama_lomba rename value 'Pelatihan Kekaryaan' to 'Kekaryaan';
  end if;
end $$;

alter type public.nama_lomba add value if not exists 'Gapple';

delete from public.pertandingan_poin
where pertandingan_id in (select id from public.pertandingan where lomba::text = 'Seminar');

delete from public.pertandingan where lomba::text = 'Seminar';
delete from public.peserta_lomba where lomba::text = 'Seminar';

alter table public.peserta
  add column if not exists ktp_path text,
  add column if not exists ktp_nama text,
  add column if not exists ktp_mime text;

comment on column public.peserta.ktp_path is 'Berkas KTP atau identitas diri di bucket ktp-peserta.';

create table if not exists public.peserta_feedback (
  id uuid primary key default gen_random_uuid(),
  peserta_id uuid not null references public.peserta (id) on delete cascade,
  pesan text not null check (char_length(btrim(pesan)) >= 3),
  dibuat_oleh uuid default auth.uid() references public.profil (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.peserta_feedback is 'Catatan kekurangan data peserta. Dapat dikirim berkali-kali sampai peserta disetujui.';

create index if not exists peserta_feedback_peserta_idx on public.peserta_feedback (peserta_id, created_at desc);

create or replace function public.cek_feedback_peserta()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  st public.status_verifikasi;
begin
  if not public.punya_peran('superuser', 'reg_admin') then
    raise exception 'Feedback hanya dapat dikirim oleh admin registrasi';
  end if;
  select status into st from public.peserta where id = new.peserta_id;
  if st is distinct from 'Menunggu Verifikasi' then
    raise exception 'Feedback hanya dapat dikirim selama peserta belum disetujui';
  end if;
  new.pesan := btrim(new.pesan);
  return new;
end;
$$;

drop trigger if exists peserta_feedback_cek on public.peserta_feedback;
create trigger peserta_feedback_cek
  before insert on public.peserta_feedback
  for each row execute function public.cek_feedback_peserta();

alter table public.peserta_feedback enable row level security;

drop policy if exists feedback_baca_kontingen on public.peserta_feedback;
create policy feedback_baca_kontingen on public.peserta_feedback
  for select to authenticated
  using (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  );

drop policy if exists feedback_baca_staf on public.peserta_feedback;
create policy feedback_baca_staf on public.peserta_feedback
  for select to authenticated
  using (public.is_staff());

drop policy if exists feedback_tulis_admin on public.peserta_feedback;
create policy feedback_tulis_admin on public.peserta_feedback
  for insert to authenticated
  with check (public.punya_peran('superuser', 'reg_admin'));

grant select, insert on public.peserta_feedback to authenticated;

create or replace function public.cek_batas_lomba()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jumlah integer;
  selain integer;
begin
  select count(*) into jumlah
  from public.peserta_lomba
  where peserta_id = new.peserta_id
    and lomba is distinct from new.lomba;
  jumlah := jumlah + 1;

  select count(*) into selain
  from public.peserta_lomba
  where peserta_id = new.peserta_id
    and lomba::text <> 'Paduan Suara'
    and lomba is distinct from new.lomba;
  if new.lomba::text <> 'Paduan Suara' then
    selain := selain + 1;
  end if;

  if jumlah > 2 then
    raise exception 'Peserta hanya dapat mengikuti maksimal 2 lomba.';
  end if;
  if selain > 1 then
    raise exception 'Selain Paduan Suara, peserta hanya boleh memilih satu lomba lain.';
  end if;
  return new;
end;
$$;

drop trigger if exists peserta_lomba_batas on public.peserta_lomba;
create trigger peserta_lomba_batas
  before insert on public.peserta_lomba
  for each row execute function public.cek_batas_lomba();

drop policy if exists bayar_baca_staf on public.pembayaran;
create policy bayar_baca_staf on public.pembayaran
  for select to authenticated
  using (public.is_staff());

drop policy if exists bayar_peserta_baca_staf on public.pembayaran_peserta;
create policy bayar_peserta_baca_staf on public.pembayaran_peserta
  for select to authenticated
  using (public.is_staff());

insert into storage.buckets (id, name, public)
values ('ktp-peserta', 'ktp-peserta', false)
on conflict (id) do nothing;

drop policy if exists storage_baca_staf on storage.objects;
create policy storage_baca_staf on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'foto-peserta', 'ktp-peserta', 'foto-panitia', 'bukti-pembayaran', 'surat-tugas',
      'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  );

drop policy if exists storage_kontingen_baca on storage.objects;
create policy storage_kontingen_baca on storage.objects
  for select to authenticated
  using (
    bucket_id in ('foto-peserta', 'ktp-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_kontingen_tulis on storage.objects;
create policy storage_kontingen_tulis on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('foto-peserta', 'ktp-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_kontingen_ubah on storage.objects;
create policy storage_kontingen_ubah on storage.objects
  for update to authenticated
  using (
    bucket_id in ('foto-peserta', 'ktp-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('foto-peserta', 'ktp-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists storage_kontingen_hapus on storage.objects;
create policy storage_kontingen_hapus on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('foto-peserta', 'ktp-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
