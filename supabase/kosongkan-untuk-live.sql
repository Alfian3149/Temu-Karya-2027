-- Kosongkan data uji coba sekali, pada hari pendaftaran sungguhan dibuka.
-- Jalankan seluruh skrip di SQL Editor Supabase. Tidak bisa dibatalkan setelah COMMIT.
--
-- Yang dihapus
--   akun kontingen (peran user) beserta login-nya
--   peserta, lomba, feedback, riwayat medis, penempatan
--   pembayaran, surat tugas, rombongan perjalanan
--   pemasukan kas yang berasal dari pembayaran terverifikasi
--   hasil pertandingan uji coba
--   pesan dari formulir kontak
--
-- Berkas di Storage tidak dihapus dari SQL. Supabase menolak DELETE pada
-- storage.objects dan meminta Storage API. Setelah skrip ini berhasil, buka
-- Dashboard → Storage, lalu kosongkan isi bucket:
--   foto-peserta, ktp-peserta, bukti-pembayaran, surat-tugas
-- Bucket bukti-keuangan hanya dikosongkan jika seluruh isinya masih uji coba.
-- Bukti kas manual yang ingin dipertahankan jangan dihapus dari bucket itu.
--
-- Yang tetap
--   akun staf: superuser, bendahara, registrasi, lomba, akomodasi, sekretaris, panitia inti
--   hotel, kamar, kendaraan
--   kas manual yang dicatat bendahara
--   rapat, tugas, anggaran, dokumen, dan data panitia
--   biaya pendaftaran di pengaturan
--
-- Hapus dulu akun staf percobaan dari tab Akun jika akun itu tidak akan dipakai saat live.

begin;

do $$
begin
  if not exists (select 1 from public.profil where peran = 'superuser') then
    raise exception 'Pengosongan dibatalkan: tidak ada akun superuser.';
  end if;
end $$;

alter table public.peserta disable trigger user;
alter table public.peserta_lomba disable trigger user;
alter table public.riwayat_medis disable trigger user;
alter table public.riwayat_medis_penyakit disable trigger user;
alter table public.pembayaran disable trigger user;
alter table public.pembayaran_peserta disable trigger user;
alter table public.surat_tugas disable trigger user;
alter table public.penempatan disable trigger user;

do $$
begin
  if to_regclass('public.peserta_feedback') is not null then
    execute 'alter table public.peserta_feedback disable trigger user';
  end if;
end $$;

delete from public.pengajuan_anggaran a
using public.profil p
where p.id = a.pengaju_id
  and p.peran = 'user';

delete from public.pertandingan_poin;
delete from public.pertandingan;

delete from public.pembayaran;
delete from public.surat_tugas;
delete from public.grup_perjalanan;
delete from public.peserta;
delete from public.pesan_kontak;

delete from auth.users u
using public.profil p
where p.id = u.id
  and p.peran = 'user';

update public.pengaturan
set klasemen_final = false
where id = 1;

do $$
begin
  if to_regclass('public.peserta_feedback') is not null then
    execute 'alter table public.peserta_feedback enable trigger user';
  end if;
end $$;

alter table public.penempatan enable trigger user;
alter table public.surat_tugas enable trigger user;
alter table public.pembayaran_peserta enable trigger user;
alter table public.pembayaran enable trigger user;
alter table public.riwayat_medis_penyakit enable trigger user;
alter table public.riwayat_medis enable trigger user;
alter table public.peserta_lomba enable trigger user;
alter table public.peserta enable trigger user;

commit;

-- Hasil yang diharapkan: kontingen, peserta, pembayaran, dan surat = 0. Staf tetap terisi.
select
  (select count(*) from public.profil where peran = 'user') as kontingen,
  (select count(*) from public.peserta) as peserta,
  (select count(*) from public.pembayaran) as pembayaran,
  (select count(*) from public.surat_tugas) as surat,
  (select count(*) from public.transaksi where sumber = 'pendaftaran') as pemasukan_pendaftaran,
  (select count(*) from public.profil where peran <> 'user') as staf;
