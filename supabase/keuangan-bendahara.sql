-- Jalankan sekali di SQL Editor pada database yang sudah ada.
-- Menyalin pembayaran terverifikasi menjadi pemasukan bendahara.

insert into storage.buckets (id, name, public)
values ('bukti-keuangan', 'bukti-keuangan', false)
on conflict (id) do nothing;

create or replace function public.sinkron_pembayaran_keuangan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nama_kontingen text;
  jumlah_peserta integer;
begin
  if new.status = 'Terverifikasi' then
    select nama into nama_kontingen from public.profil where id = new.kontingen_id;
    select count(*) into jumlah_peserta from public.pembayaran_peserta where pembayaran_id = new.id;
    insert into public.transaksi (
      jenis, sumber, pembayaran_id, tanggal, kategori, pihak, uraian, jumlah, metode, created_by
    )
    values (
      'masuk',
      'pendaftaran',
      new.id,
      new.tanggal,
      'Pendaftaran Peserta',
      'Kontingen ' || coalesce(nama_kontingen, new.kontingen_id::text),
      'Pembayaran pendaftaran ' || jumlah_peserta || ' peserta',
      new.jumlah,
      'Transfer Bank',
      new.kontingen_id
    )
    on conflict (pembayaran_id) do update
      set tanggal = excluded.tanggal,
          pihak = excluded.pihak,
          jumlah = excluded.jumlah,
          uraian = excluded.uraian,
          updated_at = now();
  else
    delete from public.transaksi where pembayaran_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists pembayaran_jadi_pemasukan on public.pembayaran;
create trigger pembayaran_jadi_pemasukan
  after insert or update of status, jumlah, tanggal, kontingen_id on public.pembayaran
  for each row execute function public.sinkron_pembayaran_keuangan();

create or replace function public.sinkron_uraian_pendaftaran()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bayar uuid := coalesce(new.pembayaran_id, old.pembayaran_id);
begin
  update public.transaksi
  set uraian = 'Pembayaran pendaftaran ' || (
    select count(*) from public.pembayaran_peserta where pembayaran_id = bayar
  ) || ' peserta'
  where pembayaran_id = bayar;
  return coalesce(new, old);
end;
$$;

drop trigger if exists pembayaran_peserta_uraian on public.pembayaran_peserta;
create trigger pembayaran_peserta_uraian
  after insert or delete on public.pembayaran_peserta
  for each row execute function public.sinkron_uraian_pendaftaran();

insert into public.transaksi (
  jenis, sumber, pembayaran_id, tanggal, kategori, pihak, uraian, jumlah, metode, created_by
)
select
  'masuk',
  'pendaftaran',
  p.id,
  p.tanggal,
  'Pendaftaran Peserta',
  'Kontingen ' || coalesce(pr.nama, p.kontingen_id::text),
  'Pembayaran pendaftaran ' || (
    select count(*) from public.pembayaran_peserta pp where pp.pembayaran_id = p.id
  ) || ' peserta',
  p.jumlah,
  'Transfer Bank',
  p.kontingen_id
from public.pembayaran p
left join public.profil pr on pr.id = p.kontingen_id
where p.status = 'Terverifikasi'
on conflict (pembayaran_id) do update
  set tanggal = excluded.tanggal,
      pihak = excluded.pihak,
      jumlah = excluded.jumlah,
      uraian = excluded.uraian,
      updated_at = now();

revoke all on function public.sinkron_pembayaran_keuangan() from public;
revoke all on function public.sinkron_uraian_pendaftaran() from public;
