-- =============================================================================
-- TKS 2027 PKB GPIB — Temu Karya Sinodal
-- Skema Supabase untuk seluruh menu input aplikasi.
--
-- Jalankan SEKALI di SQL Editor pada proyek Supabase yang masih kosong.
-- Seluruh skrip berada dalam satu transaksi: kalau ada yang gagal, tidak ada
-- tabel yang tertinggal setengah jadi.
--
-- Kata sandi TIDAK disimpan di sini. Akun masuk lewat Supabase Auth
-- (auth.users). Baris public.profil dibuat otomatis saat pengguna mendaftar.
-- Peran awal selalu "user" (Ketua Kontingen). Superuser mengubah peran staf
-- lewat kolom profil.peran.
--
-- Berkas (foto, bukti, PDF) TIDAK disimpan sebagai base64. Simpan di Storage,
-- lalu tulis path-nya ke kolom berkas_path.
--
-- Peta menu → tabel
--   Akun ........................ profil                         (+ auth.users)
--   Peserta ..................... peserta, peserta_lomba
--   Riwayat medis ............... riwayat_medis, riwayat_medis_penyakit
--   Kedatangan & keberangkatan .. grup_perjalanan, grup_perjalanan_anggota
--   Pembayaran .................. pembayaran, pembayaran_peserta
--   Surat tugas ................. surat_tugas
--   Lomba ....................... peserta_lomba
--   Hasil & juara umum .......... pertandingan, pertandingan_poin, pengaturan
--   Hotel & kamar ............... hotel, kamar
--   Transportasi ................ transportasi
--   Penempatan .................. penempatan
--   Pemasukan / pengeluaran ..... transaksi, transaksi_bukti
--   Laporan keuangan ............ tampilan v_rekap_keuangan
--   Notulensi rapat ............. rapat, rapat_hadir, rapat_lampiran
--   Tugas & tindak lanjut ....... tugas
--   Pengajuan anggaran .......... pengajuan_anggaran, anggaran_rincian,
--                                 anggaran_lampiran, anggaran_riwayat
--   Rekap anggaran .............. tampilan v_pengajuan_anggaran
--   Dokumen penting ............. dokumen, pengaturan.portal_token
--   Panitia ..................... panitia
--   Pesan situs (Hubungi Kami) .. pesan_kontak
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Enum — nilai yang sama dengan pilihan di aplikasi
-- -----------------------------------------------------------------------------

create type public.peran as enum (
  'user',
  'superuser',
  'reg_admin',
  'race_admin',
  'accom_admin',
  'bendahara',
  'sekretaris',
  'panitia_inti'
);

create type public.status_verifikasi as enum (
  'Menunggu Verifikasi',
  'Terverifikasi',
  'Ditolak'
);

create type public.jenis_peserta as enum ('Peserta', 'Undangan', 'Pendamping', 'KMJ');
create type public.jenis_kelamin as enum ('Laki-laki', 'Perempuan');
create type public.ukuran_kaos as enum ('S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL');

create type public.golongan_darah as enum ('A', 'B', 'AB', 'O', 'Tidak tahu');
create type public.hubungan_kontak as enum (
  'Orang tua', 'Suami / Istri', 'Saudara', 'Pendeta / Pembina', 'Lainnya'
);
create type public.nama_penyakit as enum (
  'Asma',
  'Diabetes',
  'Hipertensi',
  'Penyakit jantung',
  'Epilepsi',
  'Maag / lambung',
  'Alergi berat (anafilaksis)'
);

create type public.nama_lomba as enum (
  'Paduan Suara',
  'Cerdas Cermat Alkitab',
  'Tenis Meja',
  'Bulu Tangkis',
  'Catur',
  'Pelatihan Kekaryaan',
  'Seminar'
);

create type public.babak_lomba as enum (
  'Penyisihan',
  'Penyisihan Grup A',
  'Penyisihan Grup B',
  'Perempat Final',
  'Semifinal',
  'Perebutan Juara 3',
  'Final'
);

create type public.tipe_kamar as enum (
  'Single', 'Double', 'Twin', 'Triple', 'Quad', 'Dormitory'
);
create type public.jenis_transport as enum (
  'Bus', 'Minibus', 'Shuttle', 'Kereta', 'Lainnya'
);

create type public.jenis_kas as enum ('masuk', 'keluar');
create type public.sumber_kas as enum ('manual', 'pendaftaran');
create type public.metode_bayar as enum ('Transfer Bank', 'Tunai', 'E-Wallet');

create type public.jenis_rapat as enum (
  'Rapat Panitia Inti',
  'Rapat Koordinasi Divisi',
  'Rapat Pleno',
  'Rapat dengan Mitra / Vendor',
  'Lainnya'
);
create type public.status_tugas as enum (
  'Belum Dimulai', 'Sedang Berjalan', 'Tertunda', 'Selesai'
);
create type public.prioritas_tugas as enum ('Rendah', 'Sedang', 'Tinggi');

create type public.bidang_panitia as enum (
  'Panitia Inti',
  'Sekretariat',
  'Bendahara',
  'Acara & Ibadah',
  'Perlombaan',
  'Registrasi',
  'Akomodasi',
  'Transportasi',
  'Konsumsi',
  'Perlengkapan & Dekorasi',
  'Dokumentasi & Publikasi',
  'Kesehatan',
  'Keamanan',
  'Humas & Sponsor',
  'Lainnya'
);
create type public.kategori_anggaran as enum (
  'Honorarium & Transport Pembicara',
  'Akomodasi',
  'Transportasi',
  'Konsumsi',
  'Sewa Tempat & Peralatan',
  'Perlengkapan & ATK',
  'Cetak & Publikasi',
  'Dekorasi',
  'Hadiah & Piagam',
  'Dokumentasi',
  'Kesehatan',
  'Lain-lain'
);
create type public.satuan_anggaran as enum (
  'unit', 'paket', 'orang', 'hari', 'malam', 'kali', 'lembar', 'buah', 'set', 'bulan'
);
create type public.status_anggaran as enum (
  'Draf', 'Diajukan', 'Revisi', 'Disetujui', 'Disetujui Sebagian', 'Ditolak'
);
create type public.aksi_anggaran as enum (
  'Mengajukan',
  'Mengajukan ulang',
  'Menarik kembali',
  'Menyetujui',
  'Menyetujui sebagian',
  'Meminta revisi',
  'Menolak'
);

create type public.kategori_dokumen as enum (
  'Surat Edaran',
  'Juknis & Panduan',
  'Proposal',
  'Formulir',
  'Laporan',
  'Keputusan & SK',
  'Materi Rapat',
  'Lainnya'
);
create type public.visibilitas_dokumen as enum ('external', 'internal');

-- -----------------------------------------------------------------------------
-- Fungsi dasar
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create sequence public.peserta_nomor_seq;
create sequence public.panitia_nomor_seq;
create sequence public.rapat_nomor_seq;
create sequence public.anggaran_nomor_seq;

-- -----------------------------------------------------------------------------
-- Akun
-- -----------------------------------------------------------------------------

create table public.profil (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) >= 3),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  peran public.peran not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profil is 'Menu Akun. Satu baris per pengguna Auth. peran=user adalah Ketua Kontingen.';

create or replace function public.punya_peran(variadic diminta text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profil
    where id = auth.uid()
      and peran::text = any (diminta)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profil
    where id = auth.uid()
      and peran <> 'user'
  );
$$;

create or replace function public.tangani_pengguna_baru()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profil (id, nama, email, peran)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nama'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'user'
  );
  return new;
end;
$$;

create trigger profil_dari_auth
  after insert on auth.users
  for each row execute function public.tangani_pengguna_baru();

create trigger profil_updated_at
  before update on public.profil
  for each row execute function public.set_updated_at();

-- Ketua kontingen tidak boleh mengangkat dirinya menjadi staf.
create or replace function public.kunci_peran_profil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.punya_peran('superuser')
     and new.peran is distinct from old.peran then
    raise exception 'Hanya superuser yang dapat mengubah peran';
  end if;
  return new;
end;
$$;

create trigger profil_kunci_peran
  before update on public.profil
  for each row execute function public.kunci_peran_profil();

-- -----------------------------------------------------------------------------
-- Peserta
-- -----------------------------------------------------------------------------

create table public.peserta (
  id uuid primary key default gen_random_uuid(),
  nomor_registrasi text not null unique,
  kontingen_id uuid not null references public.profil (id) on delete restrict,
  nama text not null check (char_length(btrim(nama)) >= 3),
  jenis public.jenis_peserta not null,
  tempat_lahir text not null,
  tanggal_lahir date not null check (tanggal_lahir <= current_date),
  jenis_kelamin public.jenis_kelamin not null,
  gereja text not null,
  mupel text not null,
  whatsapp text not null check (whatsapp ~ '^(\+?62|0)8[0-9]{7,12}$'),
  ukuran_kaos public.ukuran_kaos not null,
  foto_path text,
  foto_nama text,
  foto_mime text,
  status public.status_verifikasi not null default 'Menunggu Verifikasi',
  catatan_admin text,
  diverifikasi_oleh uuid references public.profil (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.peserta is 'Menu Peserta (kontingen) dan verifikasi Peserta (admin registrasi).';
comment on column public.peserta.diverifikasi_oleh is 'Akun staf yang terakhir menyetujui atau menolak.';

create index peserta_kontingen_idx on public.peserta (kontingen_id);
create index peserta_status_idx on public.peserta (status);

create or replace function public.isi_nomor_peserta()
returns trigger
language plpgsql
as $$
begin
  if new.nomor_registrasi is null or btrim(new.nomor_registrasi) = '' then
    new.nomor_registrasi := 'TKS27-' || lpad(nextval('public.peserta_nomor_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger peserta_nomor
  before insert on public.peserta
  for each row execute function public.isi_nomor_peserta();

create trigger peserta_updated_at
  before update on public.peserta
  for each row execute function public.set_updated_at();

create table public.peserta_lomba (
  peserta_id uuid not null references public.peserta (id) on delete cascade,
  lomba public.nama_lomba not null,
  status public.status_verifikasi not null default 'Menunggu Verifikasi',
  catatan_admin text,
  diverifikasi_oleh uuid references public.profil (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (peserta_id, lomba)
);

comment on table public.peserta_lomba is 'Menu Lomba: cabang yang dipilih peserta beserta status verifikasinya.';

create index peserta_lomba_lomba_idx on public.peserta_lomba (lomba);

create trigger peserta_lomba_updated_at
  before update on public.peserta_lomba
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Riwayat medis
-- -----------------------------------------------------------------------------

create table public.riwayat_medis (
  peserta_id uuid primary key references public.peserta (id) on delete cascade,
  golongan_darah public.golongan_darah not null,
  alergi text not null default '',
  penyakit_lain text not null default '',
  obat text not null default '',
  riwayat_rawat text not null default '',
  kondisi_khusus text not null default '',
  kontak_nama text not null check (char_length(btrim(kontak_nama)) >= 3),
  kontak_hubungan public.hubungan_kontak not null,
  kontak_telp text not null check (kontak_telp ~ '^(\+?62|0)8[0-9]{7,12}$'),
  updated_at timestamptz not null default now()
);

comment on table public.riwayat_medis is 'Menu Riwayat Medis. Satu baris per peserta.';

create table public.riwayat_medis_penyakit (
  peserta_id uuid not null references public.riwayat_medis (peserta_id) on delete cascade,
  penyakit public.nama_penyakit not null,
  primary key (peserta_id, penyakit)
);

comment on table public.riwayat_medis_penyakit is 'Centang riwayat penyakit pada form medis.';

create trigger riwayat_medis_updated_at
  before update on public.riwayat_medis
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Kedatangan dan keberangkatan
-- -----------------------------------------------------------------------------

create table public.grup_perjalanan (
  id uuid primary key default gen_random_uuid(),
  kontingen_id uuid not null references public.profil (id) on delete restrict,
  nama text not null check (char_length(btrim(nama)) >= 2),
  dari_datang text not null default '',
  lokasi_datang text not null,
  tanggal_datang date not null,
  jam_datang time not null,
  lokasi_berangkat text not null,
  ke_berangkat text not null default '',
  tanggal_berangkat date not null,
  jam_berangkat time not null,
  kendaraan_datang_id uuid,
  kendaraan_berangkat_id uuid,
  status_datang text not null default 'Belum' check (status_datang in ('Belum', 'Selesai')),
  status_berangkat text not null default 'Belum' check (status_berangkat in ('Belum', 'Selesai')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (tanggal_berangkat >= tanggal_datang)
);

comment on table public.grup_perjalanan is 'Menu Kedatangan & Keberangkatan.';

create index grup_perjalanan_kontingen_idx on public.grup_perjalanan (kontingen_id);

create table public.grup_perjalanan_anggota (
  grup_id uuid not null references public.grup_perjalanan (id) on delete cascade,
  peserta_id uuid not null unique references public.peserta (id) on delete cascade,
  primary key (grup_id, peserta_id)
);

comment on table public.grup_perjalanan_anggota is 'Satu peserta hanya boleh masuk satu grup perjalanan.';

create trigger grup_perjalanan_updated_at
  before update on public.grup_perjalanan
  for each row execute function public.set_updated_at();

-- Anggota grup harus milik kontingen yang sama dengan grupnya.
create or replace function public.cek_anggota_grup()
returns trigger
language plpgsql
as $$
declare
  pemilik_grup uuid;
  pemilik_peserta uuid;
begin
  select kontingen_id into pemilik_grup from public.grup_perjalanan where id = new.grup_id;
  select kontingen_id into pemilik_peserta from public.peserta where id = new.peserta_id;
  if pemilik_grup is distinct from pemilik_peserta then
    raise exception 'Peserta hanya dapat dimasukkan ke grup kontingennya sendiri';
  end if;
  return new;
end;
$$;

create trigger grup_anggota_kontingen
  before insert or update on public.grup_perjalanan_anggota
  for each row execute function public.cek_anggota_grup();

-- -----------------------------------------------------------------------------
-- Pembayaran dan surat tugas
-- -----------------------------------------------------------------------------

create table public.pembayaran (
  id uuid primary key default gen_random_uuid(),
  kontingen_id uuid not null references public.profil (id) on delete restrict,
  jumlah numeric(14, 2) not null check (jumlah > 0),
  tanggal date not null check (tanggal <= current_date),
  catatan text not null default '',
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null check (berkas_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  berkas_ukuran integer not null check (berkas_ukuran > 0),
  status public.status_verifikasi not null default 'Menunggu Verifikasi',
  catatan_admin text,
  diverifikasi_oleh uuid references public.profil (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pembayaran is 'Menu Pembayaran kontingen dan verifikasi Pembayaran admin.';

create index pembayaran_kontingen_idx on public.pembayaran (kontingen_id);
create index pembayaran_status_idx on public.pembayaran (status);

create table public.pembayaran_peserta (
  pembayaran_id uuid not null references public.pembayaran (id) on delete cascade,
  peserta_id uuid not null unique references public.peserta (id) on delete cascade,
  primary key (pembayaran_id, peserta_id)
);

comment on table public.pembayaran_peserta is 'Peserta yang ditanggung satu bukti pembayaran. Satu peserta satu pembayaran.';

create or replace function public.cek_pembayaran_peserta()
returns trigger
language plpgsql
as $$
declare
  pemilik_bayar uuid;
  pemilik_peserta uuid;
begin
  select kontingen_id into pemilik_bayar from public.pembayaran where id = new.pembayaran_id;
  select kontingen_id into pemilik_peserta from public.peserta where id = new.peserta_id;
  if pemilik_bayar is distinct from pemilik_peserta then
    raise exception 'Peserta dan pembayaran harus satu kontingen';
  end if;
  return new;
end;
$$;

create trigger pembayaran_peserta_kontingen
  before insert or update on public.pembayaran_peserta
  for each row execute function public.cek_pembayaran_peserta();

create trigger pembayaran_updated_at
  before update on public.pembayaran
  for each row execute function public.set_updated_at();

create table public.surat_tugas (
  id uuid primary key default gen_random_uuid(),
  kontingen_id uuid not null references public.profil (id) on delete restrict,
  catatan text not null default '',
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null check (berkas_mime in ('application/pdf', 'image/jpeg', 'image/png')),
  berkas_ukuran integer not null check (berkas_ukuran > 0),
  status public.status_verifikasi not null default 'Menunggu Verifikasi',
  catatan_admin text,
  diverifikasi_oleh uuid references public.profil (id) on delete set null,
  diverifikasi_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.surat_tugas is 'Menu Surat Tugas.';

create index surat_tugas_kontingen_idx on public.surat_tugas (kontingen_id);

create trigger surat_tugas_updated_at
  before update on public.surat_tugas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Hotel, kamar, transportasi, penempatan
-- -----------------------------------------------------------------------------

create table public.hotel (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(btrim(nama)) > 0),
  alamat text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.hotel is 'Menu Hotel & Kamar.';

create table public.kamar (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null references public.hotel (id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) > 0),
  tipe public.tipe_kamar not null,
  kapasitas integer not null check (kapasitas > 0),
  created_at timestamptz not null default now(),
  unique (hotel_id, nama)
);

create index kamar_hotel_idx on public.kamar (hotel_id);

create table public.transportasi (
  id uuid primary key default gen_random_uuid(),
  jenis public.jenis_transport not null,
  nama text not null check (char_length(btrim(nama)) > 0),
  rute text not null,
  berangkat timestamptz not null,
  kapasitas integer not null check (kapasitas > 0),
  created_at timestamptz not null default now()
);

comment on table public.transportasi is 'Menu Transportasi.';

alter table public.grup_perjalanan
  add constraint grup_kendaraan_datang_fk foreign key (kendaraan_datang_id) references public.transportasi (id) on delete set null,
  add constraint grup_kendaraan_berangkat_fk foreign key (kendaraan_berangkat_id) references public.transportasi (id) on delete set null;

create table public.penempatan (
  peserta_id uuid primary key references public.peserta (id) on delete cascade,
  kamar_id uuid references public.kamar (id) on delete restrict,
  transportasi_id uuid references public.transportasi (id) on delete restrict,
  status public.status_verifikasi not null default 'Menunggu Verifikasi',
  catatan_admin text,
  diverifikasi_oleh uuid references public.profil (id) on delete set null,
  diverifikasi_pada timestamptz,
  updated_at timestamptz not null default now(),
  check (kamar_id is not null or transportasi_id is not null or status <> 'Terverifikasi')
);

comment on table public.penempatan is 'Menu Penempatan. Kamar atau transport wajib ada sebelum status Terverifikasi.';

create index penempatan_kamar_idx on public.penempatan (kamar_id);
create index penempatan_transport_idx on public.penempatan (transportasi_id);

create or replace function public.cek_kapasitas_penempatan()
returns trigger
language plpgsql
as $$
declare
  kap integer;
  isi integer;
begin
  if new.kamar_id is not null then
    select kapasitas into kap from public.kamar where id = new.kamar_id;
    select count(*) into isi
    from public.penempatan
    where kamar_id = new.kamar_id
      and peserta_id <> new.peserta_id;
    if isi >= kap then
      raise exception 'Kapasitas kamar sudah penuh';
    end if;
  end if;

  if new.transportasi_id is not null then
    select kapasitas into kap from public.transportasi where id = new.transportasi_id;
    select count(*) into isi
    from public.penempatan
    where transportasi_id = new.transportasi_id
      and peserta_id <> new.peserta_id;
    if isi >= kap then
      raise exception 'Kapasitas transportasi sudah penuh';
    end if;
  end if;

  if new.status = 'Terverifikasi' and new.kamar_id is null and new.transportasi_id is null then
    raise exception 'Tentukan kamar atau transportasi sebelum memverifikasi penempatan';
  end if;

  return new;
end;
$$;

create trigger penempatan_kapasitas
  before insert or update on public.penempatan
  for each row execute function public.cek_kapasitas_penempatan();

create trigger penempatan_updated_at
  before update on public.penempatan
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Keuangan
-- Pembayaran peserta yang sudah Terverifikasi disalin otomatis menjadi
-- pemasukan kategori "Pendaftaran Peserta".
-- -----------------------------------------------------------------------------

create table public.transaksi (
  id uuid primary key default gen_random_uuid(),
  jenis public.jenis_kas not null,
  sumber public.sumber_kas not null default 'manual',
  pembayaran_id uuid unique references public.pembayaran (id) on delete cascade,
  tanggal date not null,
  kategori text not null,
  pihak text not null,
  uraian text not null,
  jumlah numeric(14, 2) not null check (jumlah > 0),
  metode public.metode_bayar not null,
  created_by uuid references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (jenis = 'masuk' and kategori in (
      'Pendaftaran Peserta', 'Sponsor', 'Donasi', 'Kas Sinodal / Mupel',
      'Penjualan (kaos, merchandise)', 'Bunga Bank', 'Lainnya'
    ))
    or
    (jenis = 'keluar' and kategori in (
      'Akomodasi', 'Transportasi', 'Konsumsi', 'Lomba & Hadiah',
      'Perlengkapan & Dekorasi', 'Kesehatan', 'Dokumentasi & Publikasi',
      'Honor & Konsumsi Panitia', 'Sewa Tempat', 'Lainnya'
    ))
  ),
  check (
    (sumber = 'pendaftaran' and pembayaran_id is not null and jenis = 'masuk' and kategori = 'Pendaftaran Peserta')
    or
    (sumber = 'manual' and pembayaran_id is null)
  )
);

comment on table public.transaksi is 'Menu Pemasukan dan Pengeluaran. Baris sumber=pendaftaran dibuat otomatis dari pembayaran terverifikasi.';

create index transaksi_tanggal_idx on public.transaksi (tanggal);
create index transaksi_jenis_idx on public.transaksi (jenis);

create table public.transaksi_bukti (
  id uuid primary key default gen_random_uuid(),
  transaksi_id uuid not null references public.transaksi (id) on delete cascade,
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null,
  berkas_ukuran integer not null check (berkas_ukuran > 0),
  created_at timestamptz not null default now()
);

comment on table public.transaksi_bukti is 'Lampiran bukti transaksi. Pengeluaran sebaiknya punya minimal satu bukti.';

create index transaksi_bukti_idx on public.transaksi_bukti (transaksi_id);

create trigger transaksi_updated_at
  before update on public.transaksi
  for each row execute function public.set_updated_at();

create or replace function public.sinkron_pembayaran_keuangan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nama_kontingen text;
begin
  if new.status = 'Terverifikasi' then
    select nama into nama_kontingen from public.profil where id = new.kontingen_id;
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
      'Pembayaran pendaftaran',
      new.jumlah,
      'Transfer Bank',
      new.kontingen_id
    )
    on conflict (pembayaran_id) do update
      set tanggal = excluded.tanggal,
          pihak = excluded.pihak,
          jumlah = excluded.jumlah,
          updated_at = now();
  else
    delete from public.transaksi where pembayaran_id = new.id;
  end if;
  return new;
end;
$$;

create trigger pembayaran_jadi_pemasukan
  after insert or update of status, jumlah, tanggal, kontingen_id on public.pembayaran
  for each row execute function public.sinkron_pembayaran_keuangan();

-- -----------------------------------------------------------------------------
-- Sekretariat: rapat dan tugas
-- -----------------------------------------------------------------------------

create table public.rapat (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  judul text not null,
  jenis public.jenis_rapat not null,
  tanggal date not null,
  mulai time not null,
  selesai time not null,
  tempat text not null default '',
  pimpinan text not null,
  notulis text not null default '',
  agenda text not null default '',
  pembahasan text not null default '',
  keputusan text not null default '',
  rapat_berikutnya date,
  final boolean not null default false,
  created_by uuid references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (selesai > mulai)
);

comment on table public.rapat is 'Menu Notulensi Rapat.';

create or replace function public.isi_nomor_rapat()
returns trigger
language plpgsql
as $$
begin
  if new.nomor is null or btrim(new.nomor) = '' then
    new.nomor := 'RPT/' || lpad(nextval('public.rapat_nomor_seq')::text, 3, '0') || '/' || to_char(now(), 'YYYY');
  end if;
  return new;
end;
$$;

create trigger rapat_nomor
  before insert on public.rapat
  for each row execute function public.isi_nomor_rapat();

create trigger rapat_updated_at
  before update on public.rapat
  for each row execute function public.set_updated_at();

create table public.rapat_hadir (
  id uuid primary key default gen_random_uuid(),
  rapat_id uuid not null references public.rapat (id) on delete cascade,
  nama text not null check (char_length(btrim(nama)) > 0),
  unique (rapat_id, nama)
);

comment on table public.rapat_hadir is 'Daftar hadir rapat. Nama bebas, biasanya dari panitia atau akun staf.';

create index rapat_hadir_rapat_idx on public.rapat_hadir (rapat_id);

create table public.rapat_lampiran (
  id uuid primary key default gen_random_uuid(),
  rapat_id uuid not null references public.rapat (id) on delete cascade,
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null,
  berkas_ukuran integer not null check (berkas_ukuran > 0),
  created_at timestamptz not null default now()
);

create index rapat_lampiran_rapat_idx on public.rapat_lampiran (rapat_id);

create table public.tugas (
  id uuid primary key default gen_random_uuid(),
  rapat_id uuid references public.rapat (id) on delete set null,
  judul text not null,
  deskripsi text not null default '',
  pic text not null,
  divisi text not null default '',
  tenggat date,
  prioritas public.prioritas_tugas not null default 'Sedang',
  status public.status_tugas not null default 'Belum Dimulai',
  catatan text not null default '',
  selesai_pada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'Selesai' and selesai_pada is not null)
    or
    (status <> 'Selesai' and selesai_pada is null)
  )
);

comment on table public.tugas is 'Menu Tugas & Tindak Lanjut. rapat_id boleh kosong.';

create index tugas_rapat_idx on public.tugas (rapat_id);
create index tugas_status_idx on public.tugas (status);
create index tugas_tenggat_idx on public.tugas (tenggat);

create or replace function public.isi_waktu_selesai_tugas()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Selesai' and new.selesai_pada is null then
    new.selesai_pada := now();
  elsif new.status <> 'Selesai' then
    new.selesai_pada := null;
  end if;
  return new;
end;
$$;

create trigger tugas_selesai
  before insert or update on public.tugas
  for each row execute function public.isi_waktu_selesai_tugas();

create trigger tugas_updated_at
  before update on public.tugas
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Anggaran
-- -----------------------------------------------------------------------------

create table public.pengajuan_anggaran (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  judul text not null check (char_length(btrim(judul)) >= 3),
  bidang public.bidang_panitia not null,
  tujuan text not null check (char_length(btrim(tujuan)) >= 5),
  tanggal_kegiatan date,
  tanggal_dibutuhkan date not null,
  kontingensi_persen integer not null default 0 check (kontingensi_persen in (0, 2, 5, 10)),
  status public.status_anggaran not null default 'Draf',
  jumlah_disetujui numeric(14, 2) check (jumlah_disetujui is null or jumlah_disetujui > 0),
  pengaju_id uuid not null references public.profil (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status in ('Disetujui', 'Disetujui Sebagian') and jumlah_disetujui is not null)
    or
    (status not in ('Disetujui', 'Disetujui Sebagian') and jumlah_disetujui is null)
  )
);

comment on table public.pengajuan_anggaran is 'Menu Pengajuan Anggaran dan Persetujuan Anggaran.';

create index anggaran_pengaju_idx on public.pengajuan_anggaran (pengaju_id);
create index anggaran_status_idx on public.pengajuan_anggaran (status);

create or replace function public.isi_nomor_anggaran()
returns trigger
language plpgsql
as $$
begin
  if new.nomor is null or btrim(new.nomor) = '' then
    new.nomor := 'BGT/' || lpad(nextval('public.anggaran_nomor_seq')::text, 3, '0') || '/' || to_char(now(), 'YYYY');
  end if;
  return new;
end;
$$;

create trigger anggaran_nomor
  before insert on public.pengajuan_anggaran
  for each row execute function public.isi_nomor_anggaran();

create trigger anggaran_updated_at
  before update on public.pengajuan_anggaran
  for each row execute function public.set_updated_at();

create or replace function public.kunci_keputusan_anggaran()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('Disetujui', 'Disetujui Sebagian', 'Revisi', 'Ditolak')
     and new.status is distinct from old.status
     and auth.uid() is not null then
    if not public.punya_peran('superuser', 'panitia_inti') then
      raise exception 'Keputusan anggaran hanya dapat dibuat panitia inti';
    end if;
    if auth.uid() = new.pengaju_id and not public.punya_peran('superuser') then
      raise exception 'Pengaju tidak dapat memutuskan anggarannya sendiri';
    end if;
  end if;
  return new;
end;
$$;

create trigger anggaran_keputusan
  before update on public.pengajuan_anggaran
  for each row execute function public.kunci_keputusan_anggaran();

create table public.anggaran_rincian (
  id uuid primary key default gen_random_uuid(),
  pengajuan_id uuid not null references public.pengajuan_anggaran (id) on delete cascade,
  uraian text not null,
  kategori public.kategori_anggaran not null,
  qty numeric(12, 2) not null check (qty > 0),
  satuan public.satuan_anggaran not null,
  harga numeric(14, 2) not null check (harga > 0)
);

comment on table public.anggaran_rincian is 'Baris rincian pada form pengajuan anggaran.';

create index anggaran_rincian_pengajuan_idx on public.anggaran_rincian (pengajuan_id);

create table public.anggaran_lampiran (
  id uuid primary key default gen_random_uuid(),
  pengajuan_id uuid not null references public.pengajuan_anggaran (id) on delete cascade,
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null,
  berkas_ukuran integer not null check (berkas_ukuran > 0),
  created_at timestamptz not null default now()
);

create index anggaran_lampiran_pengajuan_idx on public.anggaran_lampiran (pengajuan_id);

create table public.anggaran_riwayat (
  id uuid primary key default gen_random_uuid(),
  pengajuan_id uuid not null references public.pengajuan_anggaran (id) on delete cascade,
  aktor_id uuid references public.profil (id) on delete set null,
  aksi public.aksi_anggaran not null,
  catatan text not null default '',
  jumlah numeric(14, 2),
  dibuat_pada timestamptz not null default now()
);

comment on table public.anggaran_riwayat is 'Jejak ajukan, tarik, setujui, revisi, dan tolak.';

create index anggaran_riwayat_pengajuan_idx on public.anggaran_riwayat (pengajuan_id, dibuat_pada);

-- -----------------------------------------------------------------------------
-- Dokumen, panitia, hasil lomba, pengaturan, pesan kontak
-- -----------------------------------------------------------------------------

create table public.dokumen (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  nomor text not null default '',
  deskripsi text not null default '',
  kategori public.kategori_dokumen not null,
  visibilitas public.visibilitas_dokumen not null default 'internal',
  berkas_path text not null,
  berkas_nama text not null,
  berkas_mime text not null,
  berkas_ukuran integer not null check (berkas_ukuran > 0 and berkas_ukuran <= 2 * 1024 * 1024),
  created_by uuid references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dokumen is 'Menu Dokumen Penting. visibilitas external tampil di portal bertoken.';

create index dokumen_visibilitas_idx on public.dokumen (visibilitas, updated_at desc);

create trigger dokumen_updated_at
  before update on public.dokumen
  for each row execute function public.set_updated_at();

create table public.panitia (
  id uuid primary key default gen_random_uuid(),
  nomor text not null unique,
  nama text not null check (char_length(btrim(nama)) >= 3),
  divisi text not null,
  jabatan text not null,
  foto_path text,
  foto_nama text,
  foto_mime text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.panitia is 'Menu Panitia dan cetak ID card. Nomor berbentuk PNT-0001.';

create or replace function public.isi_nomor_panitia()
returns trigger
language plpgsql
as $$
begin
  if new.nomor is null or btrim(new.nomor) = '' then
    new.nomor := 'PNT-' || lpad(nextval('public.panitia_nomor_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger panitia_nomor
  before insert on public.panitia
  for each row execute function public.isi_nomor_panitia();

create trigger panitia_updated_at
  before update on public.panitia
  for each row execute function public.set_updated_at();

create table public.pertandingan (
  id uuid primary key default gen_random_uuid(),
  lomba public.nama_lomba not null,
  babak public.babak_lomba not null,
  tanggal date not null,
  catatan text not null default '',
  created_by uuid references public.profil (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pertandingan is 'Menu Hasil & Juara Umum.';

create index pertandingan_lomba_idx on public.pertandingan (lomba, tanggal);

create table public.pertandingan_poin (
  pertandingan_id uuid not null references public.pertandingan (id) on delete cascade,
  kontingen_id uuid not null references public.profil (id) on delete restrict,
  poin numeric(10, 2) not null check (poin >= 0),
  primary key (pertandingan_id, kontingen_id)
);

comment on table public.pertandingan_poin is 'Poin tiap kontingen pada satu pertandingan. kontingen_id menunjuk profil Ketua Kontingen.';

create index pertandingan_poin_kontingen_idx on public.pertandingan_poin (kontingen_id);

create trigger pertandingan_updated_at
  before update on public.pertandingan
  for each row execute function public.set_updated_at();

create table public.pengaturan (
  id integer primary key default 1 check (id = 1),
  biaya_pendaftaran numeric(14, 2) not null default 2000000 check (biaya_pendaftaran >= 0),
  klasemen_final boolean not null default false,
  portal_token text,
  portal_token_dibuat timestamptz,
  updated_at timestamptz not null default now()
);

comment on table public.pengaturan is 'Satu baris: biaya pendaftaran, kunci juara umum, dan token portal dokumen.';

insert into public.pengaturan (id) values (1);

create trigger pengaturan_updated_at
  before update on public.pengaturan
  for each row execute function public.set_updated_at();

create table public.pesan_kontak (
  id uuid primary key default gen_random_uuid(),
  nama text not null check (char_length(btrim(nama)) >= 2),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  pesan text not null check (char_length(btrim(pesan)) >= 5),
  dibaca boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.pesan_kontak is 'Form Hubungi Kami di situs publik.';

-- Mencatat petugas verifikasi dan mengunci data setelah disetujui atau ditolak.
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

create trigger peserta_kunci_status
  before insert or update on public.peserta
  for each row execute function public.kunci_status_verifikasi();

create trigger peserta_lomba_kunci_status
  before insert or update on public.peserta_lomba
  for each row execute function public.kunci_status_verifikasi();

create trigger pembayaran_kunci_status
  before insert or update on public.pembayaran
  for each row execute function public.kunci_status_verifikasi();

create trigger surat_kunci_status
  before insert or update on public.surat_tugas
  for each row execute function public.kunci_status_verifikasi();

create trigger penempatan_kunci_status
  before insert or update on public.penempatan
  for each row execute function public.kunci_status_verifikasi();

create trigger peserta_kunci_hapus
  before delete on public.peserta
  for each row execute function public.kunci_hapus_terverifikasi();

create trigger peserta_lomba_kunci_hapus
  before delete on public.peserta_lomba
  for each row execute function public.kunci_hapus_terverifikasi();

create trigger pembayaran_kunci_hapus
  before delete on public.pembayaran
  for each row execute function public.kunci_hapus_terverifikasi();

create trigger surat_kunci_hapus
  before delete on public.surat_tugas
  for each row execute function public.kunci_hapus_terverifikasi();

create trigger penempatan_kunci_hapus
  before delete on public.penempatan
  for each row execute function public.kunci_hapus_terverifikasi();

create trigger peserta_lomba_kunci_anggota
  before insert or delete on public.peserta_lomba
  for each row execute function public.kunci_keanggotaan_lomba();

create trigger medis_kunci_peserta
  before insert or update or delete on public.riwayat_medis
  for each row execute function public.kunci_medis_peserta();

create trigger penyakit_kunci_peserta
  before insert or update or delete on public.riwayat_medis_penyakit
  for each row execute function public.kunci_medis_peserta();

create trigger pembayaran_peserta_kunci
  before insert or update or delete on public.pembayaran_peserta
  for each row execute function public.kunci_cocok_pembayaran();

-- -----------------------------------------------------------------------------
-- Tampilan
-- -----------------------------------------------------------------------------

create view public.v_kontingen
with (security_invoker = true) as
select
  p.id,
  p.nama as ketua,
  p.email,
  coalesce(
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

comment on view public.v_kontingen is 'Kontingen = ketua (profil peran user) dengan nama mupel yang paling sering dipakai pesertanya.';

create view public.v_pengajuan_anggaran
with (security_invoker = true) as
select
  a.id,
  a.nomor,
  a.judul,
  a.bidang,
  a.tujuan,
  a.tanggal_kegiatan,
  a.tanggal_dibutuhkan,
  a.kontingensi_persen,
  a.status,
  a.jumlah_disetujui,
  a.pengaju_id,
  pf.nama as pengaju,
  a.created_at,
  coalesce(sum(r.qty * r.harga), 0) as subtotal,
  round(coalesce(sum(r.qty * r.harga), 0) * a.kontingensi_persen / 100.0) as nilai_kontingensi,
  coalesce(sum(r.qty * r.harga), 0)
    + round(coalesce(sum(r.qty * r.harga), 0) * a.kontingensi_persen / 100.0) as total_diajukan
from public.pengajuan_anggaran a
join public.profil pf on pf.id = a.pengaju_id
left join public.anggaran_rincian r on r.pengajuan_id = a.id
group by a.id, pf.nama;

comment on view public.v_pengajuan_anggaran is 'Menu Rekap Anggaran. total_diajukan = subtotal + kontingensi.';

create view public.v_rekap_keuangan
with (security_invoker = true) as
select
  date_trunc('month', tanggal)::date as bulan,
  coalesce(sum(jumlah) filter (where jenis = 'masuk'), 0) as pemasukan,
  coalesce(sum(jumlah) filter (where jenis = 'keluar'), 0) as pengeluaran,
  coalesce(sum(jumlah) filter (where jenis = 'masuk'), 0)
    - coalesce(sum(jumlah) filter (where jenis = 'keluar'), 0) as saldo
from public.transaksi
group by 1;

comment on view public.v_rekap_keuangan is 'Menu Laporan Keuangan, dikelompokkan per bulan.';

create view public.v_klasemen_publik
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

comment on view public.v_klasemen_publik is 'Klasemen publik. Tidak menyertakan email. Boleh dibaca tanpa login.';

create view public.v_poin_lomba_publik
with (security_invoker = false) as
select
  pp.kontingen_id,
  pt.lomba,
  sum(pp.poin) as poin
from public.pertandingan_poin pp
join public.pertandingan pt on pt.id = pp.pertandingan_id
group by pp.kontingen_id, pt.lomba;

comment on view public.v_poin_lomba_publik is 'Poin per cabang lomba untuk papan klasemen publik.';

-- Portal dokumen: anon hanya mendapat berkas external bila token cocok.
create or replace function public.buka_portal_dokumen(token text)
returns table (
  id uuid,
  judul text,
  nomor text,
  deskripsi text,
  kategori public.kategori_dokumen,
  berkas_path text,
  berkas_nama text,
  berkas_mime text,
  berkas_ukuran integer,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.id, d.judul, d.nomor, d.deskripsi, d.kategori,
    d.berkas_path, d.berkas_nama, d.berkas_mime, d.berkas_ukuran, d.updated_at
  from public.dokumen d
  where d.visibilitas = 'external'
    and token is not null
    and token <> ''
    and token = (select p.portal_token from public.pengaturan p where p.id = 1);
$$;

create or replace function public.ganti_token_portal()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  token text;
begin
  if not public.is_staff() then
    raise exception 'Hanya staf yang dapat memperbarui tautan portal';
  end if;
  token := replace(gen_random_uuid()::text, '-', '');
  update public.pengaturan
  set portal_token = token,
      portal_token_dibuat = now()
  where id = 1;
  return token;
end;
$$;

create or replace function public.set_klasemen_final(nilai boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.punya_peran('superuser', 'race_admin') then
    raise exception 'Hanya admin lomba yang dapat mengunci klasemen';
  end if;
  update public.pengaturan set klasemen_final = nilai where id = 1;
end;
$$;

create or replace function public.set_biaya_pendaftaran(nilai numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.punya_peran('superuser') then
    raise exception 'Hanya superuser yang dapat mengubah biaya pendaftaran';
  end if;
  if nilai < 0 then
    raise exception 'Biaya tidak boleh negatif';
  end if;
  update public.pengaturan set biaya_pendaftaran = nilai where id = 1;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- Kebijakan untuk perintah yang sama digabung dengan OR.
-- -----------------------------------------------------------------------------

alter table public.profil enable row level security;
alter table public.peserta enable row level security;
alter table public.peserta_lomba enable row level security;
alter table public.riwayat_medis enable row level security;
alter table public.riwayat_medis_penyakit enable row level security;
alter table public.grup_perjalanan enable row level security;
alter table public.grup_perjalanan_anggota enable row level security;
alter table public.pembayaran enable row level security;
alter table public.pembayaran_peserta enable row level security;
alter table public.surat_tugas enable row level security;
alter table public.hotel enable row level security;
alter table public.kamar enable row level security;
alter table public.transportasi enable row level security;
alter table public.penempatan enable row level security;
alter table public.transaksi enable row level security;
alter table public.transaksi_bukti enable row level security;
alter table public.rapat enable row level security;
alter table public.rapat_hadir enable row level security;
alter table public.rapat_lampiran enable row level security;
alter table public.tugas enable row level security;
alter table public.pengajuan_anggaran enable row level security;
alter table public.anggaran_rincian enable row level security;
alter table public.anggaran_lampiran enable row level security;
alter table public.anggaran_riwayat enable row level security;
alter table public.dokumen enable row level security;
alter table public.panitia enable row level security;
alter table public.pertandingan enable row level security;
alter table public.pertandingan_poin enable row level security;
alter table public.pengaturan enable row level security;
alter table public.pesan_kontak enable row level security;

-- profil
create policy profil_baca_sendiri on public.profil
  for select to authenticated
  using (id = auth.uid() or public.is_staff());

create policy profil_ubah_sendiri on public.profil
  for update to authenticated
  using (id = auth.uid() or public.punya_peran('superuser'))
  with check (id = auth.uid() or public.punya_peran('superuser'));

create policy profil_hapus_admin on public.profil
  for delete to authenticated
  using (public.punya_peran('superuser') and id <> auth.uid());

-- peserta
create policy peserta_kontingen on public.peserta
  for all to authenticated
  using (kontingen_id = auth.uid())
  with check (kontingen_id = auth.uid());

create policy peserta_baca_admin on public.peserta
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'race_admin', 'accom_admin'));

create policy peserta_ubah_admin on public.peserta
  for update to authenticated
  using (public.punya_peran('superuser', 'reg_admin'))
  with check (public.punya_peran('superuser', 'reg_admin'));

create policy peserta_hapus_admin on public.peserta
  for delete to authenticated
  using (public.punya_peran('superuser', 'reg_admin'));

create policy peserta_baca_staf on public.peserta
  for select to authenticated
  using (public.is_staff());

-- peserta_lomba
create policy lomba_kontingen on public.peserta_lomba
  for all to authenticated
  using (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  );

create policy lomba_admin on public.peserta_lomba
  for all to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'race_admin'))
  with check (public.punya_peran('superuser', 'reg_admin', 'race_admin'));

create policy lomba_baca_staf on public.peserta_lomba
  for select to authenticated
  using (public.is_staff());

-- medis: kontingen menulis, seluruh staf membaca (dibutuhkan saat acara)
create policy medis_kontingen on public.riwayat_medis
  for all to authenticated
  using (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  );

create policy medis_baca_staf on public.riwayat_medis
  for select to authenticated
  using (public.is_staff());

create policy penyakit_kontingen on public.riwayat_medis_penyakit
  for all to authenticated
  using (
    exists (
      select 1
      from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  );

create policy penyakit_baca_staf on public.riwayat_medis_penyakit
  for select to authenticated
  using (public.is_staff());

-- perjalanan
create policy grup_kontingen on public.grup_perjalanan
  for all to authenticated
  using (kontingen_id = auth.uid())
  with check (kontingen_id = auth.uid());

create policy grup_baca_admin on public.grup_perjalanan
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'accom_admin'));

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

create trigger grup_kunci_trip_admin
  before update on public.grup_perjalanan
  for each row execute function public.kunci_ubah_trip_admin();

create policy grup_anggota_kontingen on public.grup_perjalanan_anggota
  for all to authenticated
  using (
    exists (
      select 1 from public.grup_perjalanan g
      where g.id = grup_id and g.kontingen_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.grup_perjalanan g
      where g.id = grup_id and g.kontingen_id = auth.uid()
    )
  );

create policy grup_anggota_baca_admin on public.grup_perjalanan_anggota
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'accom_admin'));

-- pembayaran + surat
create policy bayar_kontingen on public.pembayaran
  for all to authenticated
  using (kontingen_id = auth.uid())
  with check (kontingen_id = auth.uid());

create policy bayar_admin on public.pembayaran
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'bendahara'));

create policy bayar_verifikasi on public.pembayaran
  for update to authenticated
  using (public.punya_peran('superuser', 'reg_admin'))
  with check (public.punya_peran('superuser', 'reg_admin'));

create policy bayar_peserta_kontingen on public.pembayaran_peserta
  for all to authenticated
  using (
    exists (
      select 1 from public.pembayaran b
      where b.id = pembayaran_id and b.kontingen_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pembayaran b
      where b.id = pembayaran_id and b.kontingen_id = auth.uid()
    )
  );

create policy bayar_peserta_admin on public.pembayaran_peserta
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin', 'bendahara'));

create policy surat_kontingen on public.surat_tugas
  for all to authenticated
  using (kontingen_id = auth.uid())
  with check (kontingen_id = auth.uid());

create policy surat_admin on public.surat_tugas
  for select to authenticated
  using (public.punya_peran('superuser', 'reg_admin'));

create policy surat_verifikasi on public.surat_tugas
  for update to authenticated
  using (public.punya_peran('superuser', 'reg_admin'))
  with check (public.punya_peran('superuser', 'reg_admin'));

-- akomodasi
create policy hotel_admin on public.hotel
  for all to authenticated
  using (public.punya_peran('superuser', 'accom_admin'))
  with check (public.punya_peran('superuser', 'accom_admin'));

create policy hotel_baca_kontingen on public.hotel
  for select to authenticated
  using (public.punya_peran('user'));

create policy hotel_baca_staf on public.hotel
  for select to authenticated
  using (public.is_staff());

create policy kamar_admin on public.kamar
  for all to authenticated
  using (public.punya_peran('superuser', 'accom_admin'))
  with check (public.punya_peran('superuser', 'accom_admin'));

create policy kamar_baca_kontingen on public.kamar
  for select to authenticated
  using (public.punya_peran('user'));

create policy kamar_baca_staf on public.kamar
  for select to authenticated
  using (public.is_staff());

create policy transport_admin on public.transportasi
  for all to authenticated
  using (public.punya_peran('superuser', 'accom_admin'))
  with check (public.punya_peran('superuser', 'accom_admin'));

create policy transport_baca_kontingen on public.transportasi
  for select to authenticated
  using (public.punya_peran('user'));

create policy transport_baca_staf on public.transportasi
  for select to authenticated
  using (public.is_staff());

create policy tempat_admin on public.penempatan
  for all to authenticated
  using (public.punya_peran('superuser', 'accom_admin'))
  with check (public.punya_peran('superuser', 'accom_admin'));

create policy tempat_baca_kontingen on public.penempatan
  for select to authenticated
  using (
    exists (
      select 1 from public.peserta p
      where p.id = peserta_id and p.kontingen_id = auth.uid()
    )
  );

create policy tempat_baca_staf on public.penempatan
  for select to authenticated
  using (public.is_staff());

-- keuangan: semua staf boleh membaca (kartu ringkasan), bendahara yang menulis
create policy kas_baca on public.transaksi
  for select to authenticated
  using (public.is_staff());

create policy kas_tulis on public.transaksi
  for all to authenticated
  using (public.punya_peran('superuser', 'bendahara'))
  with check (public.punya_peran('superuser', 'bendahara'));

create policy bukti_baca on public.transaksi_bukti
  for select to authenticated
  using (public.is_staff());

create policy bukti_tulis on public.transaksi_bukti
  for all to authenticated
  using (public.punya_peran('superuser', 'bendahara'))
  with check (public.punya_peran('superuser', 'bendahara'));

-- sekretariat: semua staf membaca ringkasan, sekretaris menulis
create policy rapat_baca on public.rapat
  for select to authenticated
  using (public.is_staff());

create policy rapat_tulis on public.rapat
  for all to authenticated
  using (public.punya_peran('superuser', 'sekretaris'))
  with check (public.punya_peran('superuser', 'sekretaris'));

create policy hadir_baca on public.rapat_hadir
  for select to authenticated
  using (public.is_staff());

create policy hadir_tulis on public.rapat_hadir
  for all to authenticated
  using (public.punya_peran('superuser', 'sekretaris'))
  with check (public.punya_peran('superuser', 'sekretaris'));

create policy lampiran_rapat_baca on public.rapat_lampiran
  for select to authenticated
  using (public.is_staff());

create policy lampiran_rapat_tulis on public.rapat_lampiran
  for all to authenticated
  using (public.punya_peran('superuser', 'sekretaris'))
  with check (public.punya_peran('superuser', 'sekretaris'));

create policy tugas_baca on public.tugas
  for select to authenticated
  using (public.is_staff());

create policy tugas_tulis on public.tugas
  for all to authenticated
  using (public.punya_peran('superuser', 'sekretaris'))
  with check (public.punya_peran('superuser', 'sekretaris'));

-- anggaran
create policy anggaran_baca on public.pengajuan_anggaran
  for select to authenticated
  using (
    pengaju_id = auth.uid()
    or public.punya_peran('superuser', 'panitia_inti', 'bendahara')
  );

create policy anggaran_milik on public.pengajuan_anggaran
  for all to authenticated
  using (pengaju_id = auth.uid() and public.is_staff())
  with check (pengaju_id = auth.uid() and public.is_staff());

create policy anggaran_keputusan on public.pengajuan_anggaran
  for update to authenticated
  using (public.punya_peran('superuser', 'panitia_inti'))
  with check (public.punya_peran('superuser', 'panitia_inti'));

create policy rincian_baca on public.anggaran_rincian
  for select to authenticated
  using (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id
        and (
          a.pengaju_id = auth.uid()
          or public.punya_peran('superuser', 'panitia_inti', 'bendahara')
        )
    )
  );

create policy rincian_tulis on public.anggaran_rincian
  for all to authenticated
  using (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id and a.pengaju_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id and a.pengaju_id = auth.uid()
    )
  );

create policy lampiran_anggaran_baca on public.anggaran_lampiran
  for select to authenticated
  using (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id
        and (
          a.pengaju_id = auth.uid()
          or public.punya_peran('superuser', 'panitia_inti', 'bendahara')
        )
    )
  );

create policy lampiran_anggaran_tulis on public.anggaran_lampiran
  for all to authenticated
  using (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id and a.pengaju_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id and a.pengaju_id = auth.uid()
    )
  );

create policy riwayat_anggaran_baca on public.anggaran_riwayat
  for select to authenticated
  using (
    exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id
        and (
          a.pengaju_id = auth.uid()
          or public.punya_peran('superuser', 'panitia_inti', 'bendahara')
        )
    )
  );

create policy riwayat_anggaran_tulis on public.anggaran_riwayat
  for insert to authenticated
  with check (
    aktor_id = auth.uid()
    and exists (
      select 1 from public.pengajuan_anggaran a
      where a.id = pengajuan_id
        and (a.pengaju_id = auth.uid() or public.punya_peran('superuser', 'panitia_inti'))
    )
  );

-- dokumen dan panitia
create policy dokumen_staf on public.dokumen
  for all to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy panitia_baca on public.panitia
  for select to authenticated
  using (public.is_staff());

create policy panitia_tulis on public.panitia
  for all to authenticated
  using (public.punya_peran('superuser'))
  with check (public.punya_peran('superuser'));

-- hasil lomba: publik membaca lewat tampilan, admin lomba menulis tabel
create policy tanding_baca on public.pertandingan
  for select to authenticated
  using (true);

create policy tanding_tulis on public.pertandingan
  for all to authenticated
  using (public.punya_peran('superuser', 'race_admin'))
  with check (public.punya_peran('superuser', 'race_admin'));

create policy poin_baca on public.pertandingan_poin
  for select to authenticated
  using (true);

create policy poin_tulis on public.pertandingan_poin
  for all to authenticated
  using (public.punya_peran('superuser', 'race_admin'))
  with check (public.punya_peran('superuser', 'race_admin'));

-- Biaya dan status juara umum boleh dibaca publik. Token portal tidak ikut.
create view public.v_biaya_pendaftaran
with (security_invoker = false) as
select biaya_pendaftaran, klasemen_final
from public.pengaturan
where id = 1;

create policy pengaturan_baca_staf on public.pengaturan
  for select to authenticated
  using (public.is_staff());

-- pesan kontak
create policy pesan_kirim on public.pesan_kontak
  for insert to anon, authenticated
  with check (true);

create policy pesan_baca on public.pesan_kontak
  for select to authenticated
  using (public.is_staff());

create policy pesan_tinjau on public.pesan_kontak
  for update to authenticated
  using (public.is_staff())
  with check (public.is_staff());

grant select on public.v_klasemen_publik to anon, authenticated;
grant select on public.v_poin_lomba_publik to anon, authenticated;
grant select on public.v_biaya_pendaftaran to anon, authenticated;
grant select on public.v_kontingen to authenticated;
grant select on public.v_pengajuan_anggaran to authenticated;
grant select on public.v_rekap_keuangan to authenticated;

revoke all on function public.buka_portal_dokumen(text) from public;
grant execute on function public.buka_portal_dokumen(text) to anon, authenticated;

revoke all on function public.ganti_token_portal() from public;
grant execute on function public.ganti_token_portal() to authenticated;

revoke all on function public.set_klasemen_final(boolean) from public;
grant execute on function public.set_klasemen_final(boolean) to authenticated;

revoke all on function public.set_biaya_pendaftaran(numeric) from public;
grant execute on function public.set_biaya_pendaftaran(numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage
-- Path yang disarankan: {auth.uid()}/{id-berkas}
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('foto-peserta', 'foto-peserta', false),
  ('foto-panitia', 'foto-panitia', false),
  ('bukti-pembayaran', 'bukti-pembayaran', false),
  ('surat-tugas', 'surat-tugas', false),
  ('bukti-keuangan', 'bukti-keuangan', false),
  ('lampiran-rapat', 'lampiran-rapat', false),
  ('lampiran-anggaran', 'lampiran-anggaran', false),
  ('dokumen', 'dokumen', false)
on conflict (id) do nothing;

create policy storage_baca_staf on storage.objects
  for select to authenticated
  using (
    bucket_id in (
      'foto-peserta', 'foto-panitia', 'bukti-pembayaran', 'surat-tugas',
      'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  );

create policy storage_kontingen_baca on storage.objects
  for select to authenticated
  using (
    bucket_id in ('foto-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_kontingen_tulis on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('foto-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_kontingen_ubah on storage.objects
  for update to authenticated
  using (
    bucket_id in ('foto-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id in ('foto-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_kontingen_hapus on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('foto-peserta', 'bukti-pembayaran', 'surat-tugas')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy storage_staf_tulis on storage.objects
  for insert to authenticated
  with check (
    bucket_id in (
      'foto-panitia', 'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  );

create policy storage_staf_ubah on storage.objects
  for update to authenticated
  using (
    bucket_id in (
      'foto-panitia', 'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  )
  with check (
    bucket_id in (
      'foto-panitia', 'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  );

create policy storage_staf_hapus on storage.objects
  for delete to authenticated
  using (
    bucket_id in (
      'foto-panitia', 'bukti-keuangan', 'lampiran-rapat', 'lampiran-anggaran', 'dokumen'
    )
    and public.is_staff()
  );

commit;
