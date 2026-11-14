-- Data jemaat GPIB: mupel, nama, alamat, telepon, email jemaat, dan email mupel.
-- Sumber: Data Jemaat, Telp dan Email GPIB.xlsx
-- Nilai mupel berbentuk KODE(Nama), contoh JAKPUS(Jakarta Pusat).
-- Baris 2-322 adalah data jemaat. Baris 324 adalah judul, baris 325-349 adalah email mupel.
-- Nama jemaat yang sama dalam satu mupel dibedakan dengan kota, contoh GPIB IMMANUEL (Surabaya).

begin;

alter table public.profil drop constraint if exists profil_mupel_cek;

update public.profil
set mupel = case mupel
    when 'BABEL' then 'BABEL(Bangka Belitung)'
    when 'BALI-NTB' then 'BALI-NTB(Bali dan Nusa Tenggara Barat)'
    when 'BANTEN' then 'BANTEN(Banten)'
    when 'BEKASI' then 'BEKASI(Bekasi)'
    when 'JABAR I' then 'JABAR I(Jawa Barat I)'
    when 'JABAR II' then 'JABAR II(Jawa Barat II)'
    when 'JAKBAR' then 'JAKBAR(Jakarta Barat)'
    when 'JAKPUS' then 'JAKPUS(Jakarta Pusat)'
    when 'JAKSEL' then 'JAKSEL(Jakarta Selatan)'
    when 'JAKTIM' then 'JAKTIM(Jakarta Timur)'
    when 'JAKUT' then 'JAKUT(Jakarta Utara)'
    when 'JAMBI' then 'JAMBI(Jambi)'
    when 'JATENG-DIY' then 'JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)'
    when 'JATIM' then 'JATIM(Jawa Timur)'
    when 'KALBAR' then 'KALBAR(Kalimantan Barat)'
    when 'KALSELTENG' then 'KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)'
    when 'KALTARA-BERKAT' then 'KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)'
    when 'KALTIM I' then 'KALTIM I(Kalimantan Timur I)'
    when 'KALTIM II' then 'KALTIM II(Kalimantan Timur II)'
    when 'KEPRI' then 'KEPRI(Kepulauan Riau)'
    when 'LAMPUNG' then 'LAMPUNG(Lampung)'
    when 'SULSELBARA' then 'SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)'
    when 'SUMBAR-RIAU' then 'SUMBAR-RIAU(Sumatera Barat dan Riau)'
    when 'SUMSEL' then 'SUMSEL(Sumatera Selatan)'
    when 'SUMUT-ACEH' then 'SUMUT-ACEH(Sumatera Utara dan Aceh)'
  else mupel
end
where mupel in ('BABEL', 'BALI-NTB', 'BANTEN', 'BEKASI', 'JABAR I', 'JABAR II', 'JAKBAR', 'JAKPUS', 'JAKSEL', 'JAKTIM', 'JAKUT', 'JAMBI', 'JATENG-DIY', 'JATIM', 'KALBAR', 'KALSELTENG', 'KALTARA-BERKAT', 'KALTIM I', 'KALTIM II', 'KEPRI', 'LAMPUNG', 'SULSELBARA', 'SUMBAR-RIAU', 'SUMSEL', 'SUMUT-ACEH');

update public.peserta
set mupel = case mupel
    when 'BABEL' then 'BABEL(Bangka Belitung)'
    when 'BALI-NTB' then 'BALI-NTB(Bali dan Nusa Tenggara Barat)'
    when 'BANTEN' then 'BANTEN(Banten)'
    when 'BEKASI' then 'BEKASI(Bekasi)'
    when 'JABAR I' then 'JABAR I(Jawa Barat I)'
    when 'JABAR II' then 'JABAR II(Jawa Barat II)'
    when 'JAKBAR' then 'JAKBAR(Jakarta Barat)'
    when 'JAKPUS' then 'JAKPUS(Jakarta Pusat)'
    when 'JAKSEL' then 'JAKSEL(Jakarta Selatan)'
    when 'JAKTIM' then 'JAKTIM(Jakarta Timur)'
    when 'JAKUT' then 'JAKUT(Jakarta Utara)'
    when 'JAMBI' then 'JAMBI(Jambi)'
    when 'JATENG-DIY' then 'JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)'
    when 'JATIM' then 'JATIM(Jawa Timur)'
    when 'KALBAR' then 'KALBAR(Kalimantan Barat)'
    when 'KALSELTENG' then 'KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)'
    when 'KALTARA-BERKAT' then 'KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)'
    when 'KALTIM I' then 'KALTIM I(Kalimantan Timur I)'
    when 'KALTIM II' then 'KALTIM II(Kalimantan Timur II)'
    when 'KEPRI' then 'KEPRI(Kepulauan Riau)'
    when 'LAMPUNG' then 'LAMPUNG(Lampung)'
    when 'SULSELBARA' then 'SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)'
    when 'SUMBAR-RIAU' then 'SUMBAR-RIAU(Sumatera Barat dan Riau)'
    when 'SUMSEL' then 'SUMSEL(Sumatera Selatan)'
    when 'SUMUT-ACEH' then 'SUMUT-ACEH(Sumatera Utara dan Aceh)'
  else mupel
end
where mupel in ('BABEL', 'BALI-NTB', 'BANTEN', 'BEKASI', 'JABAR I', 'JABAR II', 'JAKBAR', 'JAKPUS', 'JAKSEL', 'JAKTIM', 'JAKUT', 'JAMBI', 'JATENG-DIY', 'JATIM', 'KALBAR', 'KALSELTENG', 'KALTARA-BERKAT', 'KALTIM I', 'KALTIM II', 'KEPRI', 'LAMPUNG', 'SULSELBARA', 'SUMBAR-RIAU', 'SUMSEL', 'SUMUT-ACEH');

alter table public.profil add constraint profil_mupel_cek check (
  mupel is null or mupel in (
    'BABEL(Bangka Belitung)',
    'BALI-NTB(Bali dan Nusa Tenggara Barat)',
    'BANTEN(Banten)',
    'BEKASI(Bekasi)',
    'JABAR I(Jawa Barat I)',
    'JABAR II(Jawa Barat II)',
    'JAKBAR(Jakarta Barat)',
    'JAKPUS(Jakarta Pusat)',
    'JAKSEL(Jakarta Selatan)',
    'JAKTIM(Jakarta Timur)',
    'JAKUT(Jakarta Utara)',
    'JAMBI(Jambi)',
    'JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)',
    'JATIM(Jawa Timur)',
    'KALBAR(Kalimantan Barat)',
    'KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)',
    'KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)',
    'KALTIM I(Kalimantan Timur I)',
    'KALTIM II(Kalimantan Timur II)',
    'KEPRI(Kepulauan Riau)',
    'LAMPUNG(Lampung)',
    'SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)',
    'SUMBAR-RIAU(Sumatera Barat dan Riau)',
    'SUMSEL(Sumatera Selatan)',
    'SUMUT-ACEH(Sumatera Utara dan Aceh)'
  )
);

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
    'BABEL(Bangka Belitung)',
    'BALI-NTB(Bali dan Nusa Tenggara Barat)',
    'BANTEN(Banten)',
    'BEKASI(Bekasi)',
    'JABAR I(Jawa Barat I)',
    'JABAR II(Jawa Barat II)',
    'JAKBAR(Jakarta Barat)',
    'JAKPUS(Jakarta Pusat)',
    'JAKSEL(Jakarta Selatan)',
    'JAKTIM(Jakarta Timur)',
    'JAKUT(Jakarta Utara)',
    'JAMBI(Jambi)',
    'JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)',
    'JATIM(Jawa Timur)',
    'KALBAR(Kalimantan Barat)',
    'KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)',
    'KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)',
    'KALTIM I(Kalimantan Timur I)',
    'KALTIM II(Kalimantan Timur II)',
    'KEPRI(Kepulauan Riau)',
    'LAMPUNG(Lampung)',
    'SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)',
    'SUMBAR-RIAU(Sumatera Barat dan Riau)',
    'SUMSEL(Sumatera Selatan)',
    'SUMUT-ACEH(Sumatera Utara dan Aceh)'
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

create table if not exists public.mupel_jemaat (
  kode text primary key,
  nama text not null,
  email text
);

create table if not exists public.jemaat (
  id bigint generated always as identity primary key,
  mupel text not null references public.mupel_jemaat (kode),
  nama text not null,
  alamat text,
  telepon text,
  email text
);

comment on table public.mupel_jemaat is 'Daftar mupel dan alamat email mupel.';
comment on table public.jemaat is 'Data jemaat: nama, alamat, telepon, dan email.';
comment on column public.jemaat.mupel is 'Nilai mupel berbentuk KODE(Nama), sama dengan pilihan asal mupel.';

truncate table public.jemaat, public.mupel_jemaat restart identity;

insert into public.mupel_jemaat (kode, nama, email) values
  ('BABEL(Bangka Belitung)', 'Bangka Belitung', 'mupel.babel@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'Bali dan Nusa Tenggara Barat', 'mupel.bali-ntb@gpib.or.id'),
  ('BANTEN(Banten)', 'Banten', 'mupel.banten@gpib.or.id'),
  ('BEKASI(Bekasi)', 'Bekasi', 'mupel.bekasi@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'Jawa Barat I', 'mupel.jabari@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'Jawa Barat II', 'mupel.jabarii@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'Jakarta Barat', 'mupel.jakartabarat@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'Jakarta Pusat', 'mupel.jakartapusat@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'Jakarta Selatan', 'mupel.jakartaselatan@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'Jakarta Timur', 'mupel.jakartatimur@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'Jakarta Utara', 'mupel.jakartautara@gpib.or.id'),
  ('JAMBI(Jambi)', 'Jambi', 'mupel.jambi@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'Jawa Tengah dan D.I. Yogyakarta', 'mupel.jateng-diy@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'Jawa Timur', 'mupel.jatim@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'Kalimantan Barat', 'mupel.kalbar@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'Kalimantan Selatan dan Kalimantan Tengah', 'mupel.kalselteng@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'Kalimantan Utara dan Berau/Kaltim bagian utara', 'mupel.kaltaraberkat@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'Kalimantan Timur I', 'mupel.kaltim1@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'Kalimantan Timur II', 'mupel.kaltim2@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'Kepulauan Riau', 'mupel.kepri@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'Lampung', 'mupel.lampung@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara', 'mupel.sulselbara@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'Sumatera Barat dan Riau', 'mupel.sumbar-riau@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'Sumatera Selatan', 'mupel.sumsel@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'Sumatera Utara dan Aceh', 'mupel.sumut-aceh@gpib.or.id');

insert into public.jemaat (mupel, nama, alamat, telepon, email) values
  ('JAKPUS(Jakarta Pusat)', 'GPIB ANUGERAH', 'Jln. Bendungan Hilir Raya No. 12A; Pejompongan; Jakarta 10210', '5733756, 5703094', 'anugerah.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB BETHESDA', 'Jln. Kramat Jaya Baru I No. 16; Jakarta 10560', '4203624, 4201205', 'bethesda.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB BETLEHEM', 'Jln. Pembangunan III No. 9; Jakarta 10130', '63857309, 6340923', 'betlehem.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB BUKIT ZAITUN', 'Jln. Pemadam Kebakaran No. 5 A; Jakarta 10140', '6349435', 'bukitzaitun.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB EBENHAEZER', 'Jln. Kramat VII No. 22 A; Jakarta 10430', '31922890, 31934827', 'ebenhaezer.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB GIDEON', 'Jln. Kramat V No. 28; Jakarta Pusat - 10430', '3144941, 3902235, 39899331', 'gideon.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB HOSIANA', 'Jln. Rajawali Selatan V No. 7; Jakarta 10720', '64710936, 6457802', 'hosiana.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB IMMANUEL', 'Jln. Medan Merdeka Timur 10; Jakarta 10110', '3440747, 3512267, 3813028', 'immanuel.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB MARANATHA', 'Jln. Baladewa No. 32; Tanah Tinggi; Jakarta Pusat - 10540', '4245739, 42878032, 65304806', 'maranatha.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB PAULUS', 'Jln. Taman Sunda Kelapa No. 12; Jakarta 10310', '31928105, 3914533', 'paulus.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB PETRUS', 'Jln. Musi No. 19; Jakarta 10510', '3446879, 3843586, 3850058', 'petrus.jakpus@gpib.or.id'),
  ('JAKPUS(Jakarta Pusat)', 'GPIB PNIEL', 'Jln. H. Samanhudi No. 12; Jakarta Pusat - 10710', '3807621, 3864036', 'pniel.jakpus@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB EIRENE', 'Jln. Kebon Bawang XIV No. 1; Tanjung Priok; Jakarta 14320', '43934215, 43913580, 4374812', 'eirene.jakut@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB GETSEMANI', 'Jln. Kesatriaan No. 50; Asrama Polisi Cilincing; Jakarta 14120', '4405325, 4403324', 'getsemani.jakut@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB KELAPA GADING', 'Jln. Janur Asri VII / VIII; Blok QK 15 - 16; No. 1 Jakarta 14240', '4523758, 45847221 ext 200, 4531467', 'kelapagading.jakut@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB MENABUR KASIH', 'Perum Green Garden Blok C 20; No.26 Rorotan Cilincing; Jakarta 14140', '44853244, 44853923, 4403389', 'menaburkasih.jakut@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB PETRA', 'Jln. Jampea No. 44; Tanjung Priok; Jakarta 14220', '4304547, 4303447', 'petra.jakut@gpib.or.id'),
  ('JAKUT(Jakarta Utara)', 'GPIB TUGU', 'Jln. Raya Tugu Semper No. 20; RT. 010/06, Kel. Semper Barat; Jakarta 14130', '4403767, 4407223', 'tugu.jakut@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB BUKIT MORIA', 'Jln. Prof. Supomo, SH No. 4; Tebet; Jakarta Selatan - 12870', '8294544, 831118, 8294414', 'bukitmoria.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB EFFATHA', 'Jln. Melawai I No. 2; Kebayoran Baru; Jakarta Selatan - 12160', '7222220, 72791735, 739457', 'effatha.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB EKKLESIA', 'Jln. Kalibata Timur No. 41; Jakarta 12740', '7974249, 9154288', 'ekklesia.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB GIBEON', 'Jln. Pesangrahan No. 1A; Kodam Bintaro; Jakarta 12320', '7342124, 7372871', 'gibeon.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB KHARISMA', 'Jln. Cendrawasih Raya No. 42 A; Kompleks Kodam Jaya, Tanah Kusir; Kebayoran Lama Jakarta - 12240', '7261054, 7238744', 'kharisma.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB MARKUS', 'Jln. Raya Cilandak KKO No. 52; Jakarta 12560', '7800072, 7456271', 'markus.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB PASAR MINGGU', 'Jln. AUP No. 10, Ps. Minggu; Jakarta 12520', '7806687, 7828416 EXT 106, 7803744', 'pasarminggu.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB SEJAHTERA', 'Jln. Durian No. 15; Petukangan Utara, Pesangrahan; Kebayoran Lama Jakarta 12260', '5853488, 7362238', 'sejahtera.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB SETIABUDI', 'Jln. Setiabudi V Gg.II No. 2; Jakarta 12910', '5223655', 'setiabudi.jaksel@gpib.or.id'),
  ('JAKSEL(Jakarta Selatan)', 'GPIB SUMBER KASIH', 'Jln. Lebak Bulus III No. 50; Jakarta 12440', '7655527, 7655578, 7500085', 'sumberkasih.jaksel@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB SANGKAKALA', 'Jln. Teratai Ujung No. 55 A; Kompleks Kodam Jaya, Kebun Jeruk; Jakarta 11530', '5491545, 9208387', 'sangkakala.jakbar@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB SHALOM', 'Jln. Anggrek Cendrawasih II Blok J/13; Slipi Jakarta 11480', '5480405, 5355944', 'shalom.jakbar@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB SILO', 'Jln. Akik No. 13 A; Cengkareng Jakarta 11710', '5401373, 5447943', 'silo.jakbar@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB SILOAM', 'Kompleks HUBAD; Jln. Arteri Pos Pengumben; Sukabumi Utara; Jakarta 11540', '5306405, 5349387', 'siloam.jakbar@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB SION', 'Jln. P. Jayakarta No. 1; Jakarta 11110', '6267457, 6598616', 'sion.jakbar@gpib.or.id'),
  ('JAKBAR(Jakarta Barat)', 'GPIB YAHYA', 'Jln. Dr. Sumeru I No. 50; Grogol; Jakarta 11450', '5671195, 56943675', 'yahya.jakbar@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB AGAPE', 'Jln. Kelapa Dua Wetan; RT. 007/05 No. 2 Cibubur; Jakarta 13730', '8700067, 8719764', 'agape.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB BETHANIA', 'Jln. SMA 14 Barat II RT.003/04 No. 21 A Cililitan; Jakarta Timur - 13640', '8094257, 9198302', 'bethania.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB CAWANG BARU', 'Jln. Cipinang Cempedak II / 8 A; Jakarta 13340', '8196054, 85908994, 8191581', 'cawangbaru.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB HOREB', 'Jln. Raya Bogor No. 2 B; Kramat Jati; Jakarta 13510', '8090723, 8093719, 8002067', 'horeb.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB KHARIS', 'Pulo Gebang Permai; Blok A 2 No.9, Pulo Gebang; Jakarta 13950', '4803806, 4600490', 'kharis.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB KOINONIA', 'Jln. Matraman Raya No. 216; Jakarta Timur', '8191365, 85906439, 8560540', 'koinonia.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB MARTIN LUTHER', 'Jln. Bangunan Barat Kav. 7-8; Kel. Kayu Putih; Jakarta 13210', '4893165, 4714340', 'martinluther.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB MARTURIA', 'Jln. Raya Cipinang Jaya Kav. 455; Jakarta 13410', '8573113, 8506136', 'marturia.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB MENARA IMAN', 'Jln. Lingkar Timur Blok S II; PTB Duren Sawit; Jakarta 13440', '8620504, 86609638, 86602407', 'menaraiman.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB NAZARETH', 'Jln. Sunan Drajat No. 27-29; Kel. Jati Rawamangun; Jakarta 13220', '47860866, 4895702', 'nazareth.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB PELITA', 'Jln. Pelita No. 13 RT.001/012; Kel. Lubang Buaya; Jakarta 13810', '8402602, 8467201', 'pelita.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB PENABUR', 'Jln. Otto Iskandardinata No. 82; Jakarta 13330', '8192449, 85905520', 'penabur.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB TAMAN HARAPAN', 'Jln. Dewi Sartika, Gg. Budi No. 10; RT.0013/03, Kel. Cawang; Jakarta Timur - 13630', '80870888', 'tamanharapan.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB TORSINA', 'Jln. Cipinang Lontar II/36; Jakarta 13240', '4891981, 47884905', 'torsina.jaktim@gpib.or.id'),
  ('JAKTIM(Jakarta Timur)', 'GPIB SURYA KASIH', 'Jl. Terusan I Gusti Ngurah Rai Kav. 10; Bojong Rangkong Pondok Kopi; Jakarta - 13460', null, 'suryakasih.jaktim@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB ABRAHAM', 'Perum Taman Alam Lestari; Blok B 6 No.8; SERANG - BANTEN', '0254.8242096', 'abraham.serang@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB BAHTERA IMAN', 'Jln. Petunia Kav. 415 A; Kompleks Bukit Nusa Indah Serua - Ciputat; Jakarta Selatan - 15414', '7417484, 74702937, 7406632', 'bahteraiman.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB FILADELFIA', 'Jln. Camar XIII No. 5; Bintar Jaya - Sektor III; Tangerang Selatan', '7357126, 73886206, 7365050', 'filadelfia.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB KARUNIA', 'Jln. Kesatrian POLRI BRIMOB; Ciputat; Jakarta Selatan', '7490525, 7410249', 'karunia.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB KASIH KARUNIA', 'Jln. Karya Agung No. 19; Parung Serab; Ciledug - Tangerang 15153', '7302108, 7311862', 'kasihkarunia.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB KASIH SETIA', 'Perum Palem Ganda Asri I Blok B2 A No. 3; Ciledug - Tangerang 15157', '28910122, 4440867, 7307542, 7315853', 'kasihsetia.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB KINASIH', 'Jln. Benda Barat XIV Blok C 30; Ujung Serua, Ciputat; Tangerang Selatan - 14514', '74638724, 77883582', 'kinasih.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB OBOR BANTEN', 'Jln. Palapa I Blok A - 82 No. 4; Sudirman Pinang; Tangerang Selatan', '021 - 37307388', 'oborbanten.tangsel@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB ORA ET LABORA', 'Jalan Palem Kuning II Blok BC 11 - 12; Griya Loka Sektor 1.3.; Tangerang', '021-29011735, 021-53166065', 'oel.serpong@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB PATMOS', 'Jln. Pinus V No. 1, Pondok Rejeki; TANGERANG 15561', '5922902, 5923939, 59311631', 'patmos.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB SAMARIA', 'Jln. TMP Taruna No. 32; Tangerang 15111', '5524323, 55794881, 55793781', 'samaria.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB YUDEA', 'Jln. Cijujung Raya No. 7; Perumnas I, Karawaci Baru; Tangerang 15116', '5916196, 5584604, 55730417', 'yudea.banten@gpib.or.id'),
  ('BANTEN(Banten)', 'GPIB SINAR KASIH', 'Desa Dadap, Lebak RT.21/RW.05; Kecamatan Kosambi; Tangerang - Banten', '085213304497', 'sinarkasih.dadap@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB ANUGERAH', 'Jln. Perumahan P & K Blok B; Lambang Sari, Tambun; BEKASI 17510', '8253794, 8251345', 'anugerah.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB BAHTERA KASIH', 'Jln. Borobudur Blok S.5/6 RT.013 RW. 015; BEKASI 17433', '8441960, 8440895', 'bahterakasih.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB DIAN KASIH', 'Jln. Raya Hankam, (Belakang Pos Jati Rahayu) Pondok Melati; BEKASI 17414', '8466654, 84996479, 8480358', 'diankasih.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB GALILEA', 'Jln. Gardenia Utara Blok BA 2 Kav. 45-46 Villa Galaxi; BEKASI SELATAN', '82410100', 'galilea.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB GLORIA', 'Jln. Kenanga IV Kav. 38; Perumahan Jaka Permai; Kelurahan Jaka Sampurna; BEKASI BARAT 17145', '8841983, 88960519, 8209595', 'gloria.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB GRATIA', 'Ruko L No. 12 A - 14; Taman Wisma Asri; BEKASI UTARA 17121', '8856186, 8842377', 'gratia.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB HARAPAN BARU', 'Jln. Harapan Baru Regency Selatan; BEKASI BARAT 17133', '4801877, 8863130', 'harapanbaru.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB HARAPAN INDAH', 'Jln. Melati Indah Blok AB No. 5; Perumahan Harapan Indah; BEKASI 17131', '8878534, 70994487', 'harapanindah.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB HARAPAN KASIH', 'Jln. Brantas Blok E RW.19; Perumahan Harapan Jaya; BEKASI UTARA 17124; Ruangan Pendeta 88963911', '8851310, 88852128; Ruangan Pendeta 88963911', 'harapankasih.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB IMMANUEL', 'Jln. Skyvan Blok C I No. 9; Kompleks TNI AU Jaladhapura; BEKASI 17113', '8808154, 88356637, 88351755', 'immanuel.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB JATIPON', 'Jln. Sekolah KAPIN RT.009/04; Kel. Jatibening Baru; Kec. Pondok Gede BEKASI 17412', '8648688', 'jatipon.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB MENARA KASIH', 'Jln. Raya Pondok Gede Permai No.55 RT. 005 / 04, Jatiasih; BEKASI 17424', '8224440, 8228503', 'menarakasih.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB PILAR ASIH', 'Ruko Taman Narogong Indah; Blok TE No.4; BEKASI TIMUR 17115', '82433439, 82421470, 8212578', 'pilarasih.bekasi@gpib.or.id'),
  ('BEKASI(Bekasi)', 'GPIB PONDOK UNGU', 'Ruko Taman Harapan Baru; Blok N 17-18 BEKASI BARAT', '33622366, 88970035, 88987946', 'pondokungu.bekasi@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB BETHEL', 'Jln. Wastukencana, 1; BANDUNG 40117', '022.4201794, 022.4209236', 'bethel.bandung@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB EFATA', 'Jln. Raya Batujajar, 296; BATUJAJAR 40561 - BANDUNG', '022.6868613', 'efata.batujajar@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB GETSEMANI', 'Jln. Pembangunan VI; CIREBON 45131', '023.231143, 023.200383', 'getsemani.cirebon@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB IMMANUEL', 'Jln. Pasir Kumeli, 149 A; CIMAHI 40521', '022.6659144, 022.6631864', 'immanuel.cimahi@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB MARANATHA (Bandung)', 'Jln. Taman Cibeunying Utara, 2; BANDUNG 40114', '022.7271563, 022.7206005', 'maranatha.bandung@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB MARANATHA (Subang)', 'Jln. S. Parman, 2; Kotak Pos 3 SUBANG 41214', '0260.413835, 0260.7424773', 'maranatha.subang@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB PNIEL YUDHA WIYOGRHA', 'Jln. Moch. Rachmat Djayadinata; Komp. Yon Sipur 3; DAM Siliwangi Dayeuhkolot; BANDUNG 40258', '022.5224274', 'pniel.yudhawiyogrha@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB SEJAHTERA', 'Jln. Malabar, 49 - 51; BANDUNG 40263', '022.7303668, 022.7321076, 022.7303280', 'sejahtera.bandung@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB SILIH ASIH', 'Kompleks Taman Sakura Indah; Jln. Taman Kaktus, 15; BANDUNG 40221', '022.6077368, 022.5413867', 'silihasih.bandung@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB SYALOOM', 'Jln. Kamojing, Gg. Bina Pemuda, 3; Kotak Pos 15; CIKAMPEK 41373', '0264.313621', 'syaloom.cikampek@gpib.or.id'),
  ('JABAR I(Jawa Barat I)', 'GPIB WISMA ASIH', 'Jln. Maribaya, 93; LEMBANG - BANDUNG 40391', '022.2787320', 'wismaasih.lembang@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB CIMANGGIS', 'Jln. Raya Pondok Duta, 3 A; Kampung Areman; CIMANGGIS - DEPOK', '021.8729917', 'cimanggis.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB CINERE', 'Jln. Jakarta No. 86 Blok M; CINERE - DEPOK', '021.7540758, 021.7548928', 'cinere.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB DAMAI SEJAHTERA', 'Gedung Serba Guna Pasar Lama Cileungsi. Jln. Kampung Pasar Lama RT 01/01 No. 55 BOGOR 16820', '021.82491169, 021.8231072', 'damaisejahtera.cileungsi@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB GALILEA', 'Jln. Kidang Kencana, 25 - 27; Pelabuhan Ratu JAWA BARAT 43364', '0266.431224, 0266.431860', 'galilea.pelabuhanratu@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB GIDEON', 'Jln. Akses UI; Asrama BRIMOB Kelapadua; CIMANGGIS 16951', '021.8700251, 021.8724726, 021.8716559', 'gideon.kelapadua@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB IMMANUEL', 'Jln. Pemuda, 70; DEPOK 16431', '021.77210338, 021.7520416', 'immanuel.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB KARTIKA SEJAHTERA', 'Perum Kartika Sejahtera; Blok L, Desa Sasak Panjang; Kec. TAJURHALANG - BOGOR', '0251.8556074', 'kartikasejahtera.bogor@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB KORNELIUS', 'Kompleks SPN LIDO; Jln. Raya Bogor - Sukabumi KM.20; BOGOR 16740', '0251.220606, 0251.376660', 'kornelius.lido@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB NEHEMIA', 'Jln. Raya Puncak KM. 14; CIBOGO - BOGOR', '0251.253893', 'nehemia.cibogo@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB PANCARAN KASIH', 'Jln. Let. Tolle Iskandar, 27; Sukmajaya - Kotip Depok; DEPOK 16415', '021.8741519, 021.8744862', 'pancarankasih.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB PANCORAN RAHMAT', 'Kompleks ARCO Rangkapan Jaya Baru Blok A 71, RT. 03/RW. 05; Jln. Raya Keadilan, Pancoran Mas; DEPOK 16434', '021.77883338, 021.7788318', 'pancoranrahmat.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB PELITA HIDUP', 'Jln. Melati Ujung RT.002/01, 1 A (Kampung Melati); DEPOK II TENGAH 16411', '021.7716296', 'pelitahidup.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB PENGHARAPAN', 'Jln. Raya Bogor KM. 44; Kompleks DITBEKANG TNI - AD; CIBINONG - BOGOR', '021.8756407, 021.87900104', 'pengharapan.cibinong@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB SAWANGAN', 'Jln. Arco Raya, 30; Kompleks ARCO - Duren Seribu; SAWANGAN - DEPOK - 16518', '0251.611290, 0251.611114', 'sawangan.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB SHALOM', 'Jln. Kembang Lio, 9; RT.01/03, Kelurahan Beji; DEPOK 16421', '021.7774871, 021.7522025', 'shalom.depok@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB SOLA GRATIA', 'Jln. RS TNI - AU Blok B XI, 5; Atang Sendjaja - Semplak; BOGOR 16310', '0251.7538942', 'solagratia.semplak@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB TRINITAS', 'Ruko Madisson Square Blok SHC I No. 1-2; Jl. Transyogi KM 6 Gunung Putri; Perumahan Kota Wisata; Kab. BOGOR 16968', null, 'trinitas.kotawisata@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB ZEBAOTH', 'Jln. Ir H. Juanda, 3; P.O. BOX 332; BOGOR 16122', '0251.324403, 0251.345127, 0251.333122', 'zebaoth.bogor@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB GPIB Bojong Gede', 'Blok A 4 No. 17-19 Perumahan Pondok Bambu Kuning Desa Bojong Gede; Kec. Bojong Gede Kab. BOGOR', null, 'bojonggede.bogor@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB BUKIT SENTUL Bogor', 'Jl. M.H Thamrin, Plaza Niaga I Blok D-1, Sentul City, Babakan Madang, Kab. Bogor 16810', null, null),
  ('JABAR II(Jawa Barat II)', 'GPIB PETRA', 'Jl. K. S Tubun KM. 7, BOGOR 16710', null, 'petra.bogor@gpib.or.id'),
  ('JABAR II(Jawa Barat II)', 'GPIB CIPEUCANG Jonggol', 'Jl. Raya Cileungsi - Jonggol KM. 15, Desa Cipeucang, Kec. Cileungsi - Jonggol', null, 'cipeucang.jonggol@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB AMBARAWA TAMBAKREJO KEBONDOWO', 'Jl. Mgr. Sugiopranoto 1, PO. BOX 116, Kab. Semarang Jawa-Tengah, Ambarawa 50601', '0298.594153, 0298.593976', 'atk.salatiga@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB AYALON', 'Jln. Dr. Soetomo No. 39 - 41, TEGAL - 52113', '0283.351989', 'ayalon.tegal@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB EFFATHA', 'Jln. Jangli Perbalan No. 53 - 55, SEMARANG 50261', '024.7478782, 024.7471190', 'effatha.semarang@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB FILADELFIA', 'Jln. Wonodri Baru Timur, SEMARANG 50242', '024.8413997, 024.8452030', 'filadelfia.semarang@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB GALILEA', 'Jln. Rinjani, P.O. BOX 17, CILACAP 53223', '0282.542269, 0282.533040', 'galilea.cilacap@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB IMMANUEL', 'Jln. Letjen. Suprapto No. 32, SEMARANG 50174', '024.3554271, 024.354103', 'immanuel.semarang@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB BETHEL', 'Jln. Aloon-aloon Utara No. 4, MAGELANG 56117', '0293.363476, 0293.366260', 'bethel.magelang@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB MARGA MULYA', 'Jln. Jend. A. Yani No. 5, YOGYAKARTA 55122', '0274.563841, 0274.562183', 'margamulya.yogyakarta@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB PENABUR', 'Jln. Jend. Sudirman No. 12, SURAKARTA 57111', '0271.636013, 0271.43570, 0271.666141', 'penabur.surakarta@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB GRIYA MULYA', 'Jln. Jend. Urip Sumoharjo No. 24, PURWOREJO 54111', '0275.321756, 0275.323513', 'griyamulya.purworejo@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB SION', 'Jln. Cendana Timur No. 22, BANYUMANIK - SEMARANG - 50263', '024.7465006', 'sion.semarang@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB SOLO UTARA', 'Jln. Sumbing III / 5, Dukuh Kendal RT.02/10, MOJOSONGO - SURAKARTA - 57127', '0271.851058, 0271.858182, 0271.7051368', 'soloutara.surakarta@gpib.or.id'),
  ('JATENG-DIY(Jawa Tengah dan D.I. Yogyakarta)', 'GPIB TAMAN SARI', 'Jln. Jend. Sudirman No. 1, SALATIGA 50711', '0298.321510, 0298.329471', 'tamansari.salatiga@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB AIR HIDUP', 'Jln. Jambur Raya No. 114 A (Perumnas) KAMAL - MADURA', '031.3014436, 031.5993701', 'airhidup.kamal@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB AIR KEHIDUPAN', 'Jln. Kotak Pos 3 - Kesamben, KESAMBEN - BLITAR 66191', '0341.712183', 'airkehidupan.blitar@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BAHTERA HAYAT', 'Jln. Teluk Tomini (gereja) Tg. Perak, SURABAYA 60165', '031.3291502, 031.3299029', 'bahterahayat.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BAHTERA KASIH', 'Jln. Veteran Segoromadu I No. 1 A GRESIK', '031.3973767', 'bahterakasih.gresik@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BENOWO', 'Jln. Griya Benowo Indah Blok R No. 3 - 7, SURABAYA 60197', '031.79430192', 'benowo.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BHASKARA', 'Jln. Bhaskara Sari No. 47, SURABAYA - 60112', '031.5934322, 031.5925756', 'bhaskara.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BETHESDA', 'Jln. Untung Suropati No. 29, SIDOARJO 61218', '031.8922088', 'bethesda.sidoarjo@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BUKIT HARAPAN', 'Jln. Sutedi Senoputro No. 38, Karangpilang SURABAYA 60221', '031.7662129, 031.7662525', 'bukitharapan.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BUKIT KASIH', 'Jln. Garuda Kuwukan No. 2, Manukan Kulon, SURABAYA 60185', '031.7412422, 031.7419591, 031.7405755', 'bukitkasih.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BUKIT SION', 'Jln. Ketintang Baru IV B Kav. 27, SURABAYA 60231', '031.8280539, 031.8280769, 031.8289887', 'bukitsion.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB BUKIT ZAITUN', 'Jln. Pucang Anom Timur III No. 27, SURABAYA 60282', '031.5026190, 031.5028304', 'bukitzaitun.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB CAHAYA ANUGERAH', 'Jln. Bangkingan VIII/9, Wisma Lidah Kulon, SURABAYA - 60214', '031.7523080, 031.7533383', 'cahayanuagerah.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB CAHAYA KASIH', 'Jln. Randu No. 5 - 7, SURABAYA 60112', '031.3716232, 031.3718688', 'cahayakasih.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB EBENHAEZER', 'Jln. Taman Bintoro No. 6, SURABAYA 60264', '031.5676385, 031.5611669, 031.5677454', 'ebenhaezer.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB EBENHAEZER Blitar', 'Jln. Jend. Sudirman No. 2, BLITAR 66112', '0342.803040', 'ebenhaezer.blitar@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB EF RATA', 'Jln. Ngagel Mulyo I / 6, SURABAYA 60245', '031.5010717', 'efrata.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB EFFATHA', 'Jln. Pasar Ds. Sepanjang RT.02/RW.11, Glenmore, BANYUWANGI 68466', '033.3821758', 'effatha.banyuwangi@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB GALILEA', 'Jln. Olah Raga No. 6 Pasiran DBAL Ujung, SURABAYA 60155', '033.3293524, 031.3990666', 'galilea.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB GAMALIEL', 'Jln. Jawa No. 10, MADIUN 63122', '033.3293524, 031.3990666', 'gamaliel.madiun@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB GENTA KASIH', 'Jln. Rungkut Asri Utara IX/25, SURABAYA - 60293', '0351.8701634, 0351.8784194, 0351.8715016', 'gentakasih.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB GETSEMANI (Jember)', 'Jln. P.B. Sudirman No. 1, JEMBER 68101', '0331.487800, 0336.884998', 'getsemani.jember@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB GETSEMANI (Malang)', 'Komplek Perum Pondok Blimbing Indah Blok N I No.1-2 MALANG 65125', '0341.417775, 0341.483195', 'getsemani.malang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB HOSEA', 'Jln. Mananggal IV / 9, SURABAYA 60234', '031.8286806, 031.8535792', 'hosea.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Surabaya)', 'Jln. Bubutan No. 69, SURABAYA 60174', '031.5344046, 031.5454145', 'immanuel.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Banyuwangi)', 'Jln. Dr. Sutomo No. 56, BANYUWANGI 68411', '033.420262, 0333.424204', 'immanuel.banyuwangi@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Bangil)', 'Jln. J.A. Suprapto No. 6, BANGIL - JATIM', '0343.741175, 0343.639872', 'immanuel.bangil@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Bondowoso)', 'Jln. Letjen Sudiono No. 18-22, BONDOWOSO', '0332.421193', 'immanuel.bondowoso@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Kediri)', 'Jln. KDP Slamet No. 43, KEDIRI JATIM - 64114', '0354.771977, 0354.772346', 'immanuel.kediri@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Malang)', 'Jln. A.R. Hakim No. 1, MALANG 65119', '0341.325850', 'immanuel.malang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Mojokerto)', 'Jln. Jend. A. Yani No. 1, MOJOKERTO 61311', '0321.322295, 0321.324267', 'immanuel.mojokerto@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB IMMANUEL (Probolinggo)', 'Jln. Suroyo No. 32, PROBOLINGGO 67211', '0335.421357', 'immanuel.probolinggo@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB MARANATHA (Surabaya)', 'Jln. Kom. Yos Sudarso No. 2 - 4, SURABAYA 60272', '031.5341719, 031.5467566, 031.5341730 / 031.5480138', 'maranatha.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB MARANATHA (Bojonegoro)', 'Jln. Hayam Wuruk No. 37 B, P.O. BOX 103, BOJONEGORO 62116', '0353.886833', 'maranatha.bojonegoro@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB MAHKOTA HAYAT', 'Jln. Jokotole No. 85, PAMEKASAN 69311 - MADURA', '0324.332597, 0324.33026', 'mahkotahayat.pamekasan@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB MARGO MULYO', 'Jln. Trunojoyo No. 2, P.O. BOX 28, BATU MALANG 65312', '0341.593328, 0341.590722', 'margomulyo.batumalang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB NAZARETH', 'Jln. Wiratno No. 40, Kompleks TNI - AL Kenjeran, SURABAYA - 60121', '031.3821254, 031.3813782', 'nazareth.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB PANCARAN KASIH (Kalianget)', 'Jln. Sam Ratulangi No. 12 KALIANGET, Sumenep MADURA - 69471', null, 'pancarankasih.kalianget@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB PANCARAN KASIH (Lumajang)', 'Jln. Mayjen Panjaitan No. 69, LUMAJANG 67312', '0334.891139, 0334.882330', 'pancarankasih.lumajang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB PELANGI KASIH', 'Jln. Argopuro No. 1, LAWANG 65211', '0341.426330, 0341.428734, 0341.425387', 'pelangikasih.lawang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB PNIEL (Surabaya)', 'Jln. Rajawali No.80 - 82, SURABAYA', '031.3521600, 031.3535797', 'pniel.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB PNIEL (Pasuruan)', 'Jln. Anjasmoro No. 6, PASURUAN 67125', '0343.426213, 0343.428856', 'pniel.pasuruan@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB SEJAHTERA (Surabaya)', 'Jln. Kutisari Dalam No. 2, SURABAYA 60291', '031.8436096', 'sejahtera.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB SEJAHTERA (Malang)', 'Jln. Nakula No.3, MALANG 65124', '031.8436096', 'sejahtera.malang@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB SINAI', 'Jln. Albatros No. 5 A, Kompleks TNI AU Simogunung, SURABAYA 60255', '031.5671430, 031.7315377', 'sinai.surabaya@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB SHALOM', 'Perum Griya Mapan Sentosa Blok BH - 12, WARU - SIDOARJO - 61256', '031.8673568, 031.8665386, 031.8673561', 'shalom.sidoarjo@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB SURYA KASIH', 'Jln. P.B. Sudirman No. 35, SITUBONDO - 68312', '0338.672580', 'suryakasih.situbondo@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB TIBERIAS', 'Jln. Pepelagi Indah Blok K 3 - 5, WARU - SIDOARJO', '031.8553117, 031.8545031', 'tiberias.sidoarjo@gpib.or.id'),
  ('JATIM(Jawa Timur)', 'GPIB TORSINA', 'Jln. Gubeng Kertajaya XIII-C / 19, SURABAYA 60286', '031.5031279, 031.5325657', 'torsina.surabaya@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB BETH TEFILAH', 'Jln. Way Ratai No. 1, Desa Hanura - Pesawaran, LAMPUNG 35454', '(G) 0721.4001471', 'bethtefilah.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB EFFATHA', 'Kotak Pos 1041 - Pahoman, BANDAR LAMPUNG 35010', null, 'effatha.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB IMMANUEL', 'Kotak Pos No.20, TANJUNG KARANG - LAMPUNG - 35010', '(G) 0721.895637', 'immanuel.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB KANAAN', 'Desa Sidoharjo, Kec. Selagai Lingga, Kab. Lampung Tengah, PROPINSI LAMPUNG 34176', null, 'kanaan.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB MARTURIA', 'Jln. Imam Bonjol No. 1, BANDAR LAMPUNG 35111', '(G) 0721.252337, (F) 0721.254079, (P) 0721.270477', 'marturia.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB MARANATHA', 'Jln. Imam Bonjol No. 1 TJ. KARANG -, BANDAR LAMPUNG 35111', '(G) 0721.7479477', 'maranatha.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB PANCARAN KASIH', 'Desa Bangunsari Kec. Negeri Katon, Kabupaten Pesawaran, Po. Box. 07 Pringsewu 35373', null, 'pancarankasih.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB PETRA', 'Kotak Pos No. 8, KOTA BUMI - LAMPUNG UTARA', null, 'petra.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB SILO', 'Jln. Laks. Yos Sudarso No. 1, PANJANG 35243 - BANDAR LAMPUNG', '(G) 0721.31621', 'silo.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB TIBERIAS', 'Jln. Udara No. 1 Desa Bandar Agung,, Kec. Terusan Nunyai, LAMPUNG TENGAH 34163', '(G) 0725.7572371', 'tiberias.lampung@gpib.or.id'),
  ('LAMPUNG(Lampung)', 'GPIB ZEBAOTH', 'Tromol Pos 1 / BRJ, Kec. Bangunrejo, LAMPUNG TENGAH 34173', null, 'zebaoth.lampung@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB ANUGERAH', 'Jln. By Pass Alur Dua No. 253, Kotak Pos 2, PANGKALAN BERANDAN 20857', '(G) 0620.21433, (P) 0620.21433', 'anugerah.pangkalanbrandan@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB BANDA ACEH', 'Jln. Pocut Baren No. 1 Kel. Mulia, Kec. Kuta Alam BANDA ACEH - 23351', '(G) 0651.24909, (F) 0651.24909', 'bandaaceh.bandaaceh@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB EFATA Tanjung Morawa', 'Jln. Madirsan No. 22, Tanjung Morawa, Deli Serdang, SUMATERA UTARA 20362', '(G) 061. 7943557', 'efata.tanjungmorawa@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB FILADELFIA', 'Jln. Gunung Krakatau 14 A, MEDAN - 20238', '(G) 061.6623242, (F) 061.6640124, (P) 061.6640124', 'filadelfia.medan@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB IMMANUEL', 'Jln. P. Diponegoro No. 25 - 27, MEDAN 20152', '(G) 061.4515537, (F) 061.4147370, (P) 061.4527337', 'immanuel.medan@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB KASIH KARUNIA', 'Jln. Kapten Muslim No. 94 A, MEDAN 20123', '(G) 061.8451505', 'kasihkarunia.medan@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB MARANATHA', 'Jln. Simbolon No. 2, PEMATANG SIANTAR - SUMUT 21115', '(G) 0622.22333', 'maranatha.pematangsiantar@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB MITRA PARSINGGURAN NAULI', 'Desa Parsingguran II, Kec. Pollung,, Kabupaten Humbang Hasundutan, SUMATERA UTARA - 22457', null, 'mitra.parsinggurannauli@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB PATMOS', 'Jln. Prof. A. Madjid Ibrahim, SABANG 23511', '(G) 0652.21087, (F) 0652.21333', 'patmos.sabang@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB PNIEL Kampung Kolam', 'Jln. Bakti Luhur Gang Baru No. 169H, MEDAN 20123', '(G) 061.7943557, (F) 061.7943557', 'pniel.kampungkolam@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB SILOAM', 'Jln. Jend. Sudirman No. 5, Tugu Ikan - Parombunan SIBOLGA', '(G) 0631.25967', 'siloam.sibolga@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB SYALOM Bangun Purba', 'Jln. Tiga Juhar, Dusun II Desa Perguroan, Kec. Bangun Purba, Kab. Deli Serdang, SUMATERA UTARA 20581', null, 'syalom.bangunpurba@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB YOPE', 'Jln. Selebes Purwodadi Ling No. 43, BELAWAN 20412', '(G) 061.6945359, (F) 061.6945359, (P) 061.6941502', 'yope.belawan@gpib.or.id'),
  ('SUMUT-ACEH(Sumatera Utara dan Aceh)', 'GPIB PAULUS Binjai', 'Jln. Soekarno-Hatta Km 17/Jln. Danau, Jempang Lk 1 Binjai', null, null),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB ANUGERAH', 'Jln. Lintas Timur, P.O. BOX 03, Kompleks Gereja Engkolan, SOREKSATU 28382 - RIAU', '(G) 0748.351063', 'anugerah.sorek@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB BUKIT ZAITUN', 'Komp. Singgalang, PT Chevron Pasific Indonesia (CPI), P.O. BOX 339, DURI - RIAU 28884', '(G) 0765.999011, 0765.993213, (F) 0765.823287', 'bukitzaitun.duri@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB EFRATA', 'Jln. Bagindo Aziz Chan No. 19, PADANG - 25111 -SUMBAR', '(G) 0751.26330, (F) 0751.37675, (P) 0751.37675', 'efrata.padang@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB EFRATA Taluk Kuantan', 'Jln. Abdoer Rauf RT 05/RW 01 LK II, Kel. Sei Jering Kec. Kuantan Tengah, Kab. Kuantan- Singingi - RIAU', null, 'efrata.talukkuantan@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB EFFATA', 'Ophir Sekunder I Jorong Sarik, Nagari Koto Baru, Kec. Luhak Nan Duo, Kab. Pasaman Barat, SIMPANG III 26368 - SUMBAR', null, 'effata.pasaman@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB EKKLESIA', 'Jln. Air Bersih No. 1, DUMAI 28813', '(G) 0765.31348, (F) 0765.31348, (P) 0765.7008182', 'ekklesia.dumai@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB GIBEON', 'Kompleks Flamboyan No. 120, PT. C P I, RUMBAI - PEKANBARU 28271', '(G) 0761.943520, (F) 0761.943947, (P) 0761.943947', 'gibeon.rumbai@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB IMMANUEL', 'Jln. Sumatera No.21 - 23, PEKANBARU - RIAU', '(G) 0761.21180, (F) 0761.21180, (P) 0761.47893', 'immanuel.pekanbaru@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB KASIH ABADI', 'Jln. Bintara No. 62 - 63, P.O. BOX 11, PERAWANG 28772 - RIAU', '(G) 0761.693520, (P) 0761.693520, (P) 0761.91148', 'kasihabadi.perawang@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB MARTURIA', 'Jln. Jend. Sudirman No. 10, Desa Langsat Hulu, Kec. Benai, Kab. Kuansing, PROVINSI RIAU', null, 'marturia.kuansing@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB SILOAM Kota Baru Riau', 'd/a Bpk. Agus Wahyudi, Kompleks Pembangunan Indah, Jln. Pembangunan Blok B No. 1, RUMBAI - PEKANBARU', null, 'siloam.kotabaru@gpib.or.id'),
  ('SUMBAR-RIAU(Sumatera Barat dan Riau)', 'GPIB SUMBER KASIH Indrapuri', 'Jln. Anggrek VII DS, Indrapuri Kec. Tapung Kab. Kampar, Riau - 28464', null, 'sumberkasih.duri@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB EFRATA Bangun Jaya', 'Jln. Bangun Jaya, Kotak Pos 112, LUBUK LINGGAU 31601', null, 'efrata.bangunjaya@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB IMMANUEL', 'Jln. P.A.K. Abdurrochim No. 1, PALEMBANG 30143', '(G) 0711.350909, (F) 0711.350909, (P) 0711.317273', 'immanuel.palembang@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB KARUNIA', 'Komp. Yon Kav. 5 Serbu, Karang Endah - Kec. Gelumbang, Kabupaten Muara Enim, SUMATERA SELATAN', null, 'karunia.karangendah@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB PLAJU SUNGAI GERONG', 'Jln. Lontar No. 000 Komperta Plaju, SEKOJO - PALEMBANG 30268', '(G) 0711.595572, (F) 0711.595572, (P) 0711.598461', 'plajusungaigerong.plaju@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB PNIEL', 'Jln. Urip Sumoharjo No. 135 A, SEKOJO - PALEMBANG 30118', '(G) 0711.711213, (P) 0711.7047300', 'pniel.palembang@gpib.or.id'),
  ('SUMSEL(Sumatera Selatan)', 'GPIB SANGKAKALA', 'Jln. Lintas Timur Km. 163, Ds. Bumiarjo - Kec. Lempuing, Kab. Ogan Komering Ilir - Palembang', null, 'sangkakala.bumiarjo@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB ALFA OMEGA', 'd.a. Kantor Pos Sungai Bahar, Desa Marga Mulya RT 11/RW 4, Sungai Bahar - JAMBI 36365', '(G) 0711.412005', 'alfaomega.jambi@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB BUKIT DIAN KASIH', 'd.a Emplasmen PTPN VI Kebun, Kayu Aro KERINCI - JAMBI 37163', null, 'bukitdiankasih.kayuaro@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB BUKIT KASIH', 'Jln. Jend. A. Yani No. 5, Sungai Penuh, KERINCI 37117 - JAMBI', null, 'bukitkasih.kerinci@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB EKKLESIA', 'Jln. 100 Km. 3 Tebing Tinggi, Kec. Tebing Tinggi, Kab. Tanjung, Jabung Barat JAMBI 36556', '(G) 0742.57205, (P) 0812.68216079', 'ekklesia.tebingtinggi@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB IMMANUEL Tempino', 'Jln. Jambi - Tempino Km.26, Sebapo KABUPATEN MUARA JAMBI', null, 'immanuel.tempino@gpib.or.id'),
  ('JAMBI(Jambi)', 'GPIB MARTURIA', 'Jln. Otto Iskandardinata No. 12, JAMBI 36144', '(G) 0741.24810, (P) 0741.4129', 'marturia.jambi@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB BETHESDA', 'Jln. Kapten P. Tendean No. 1, Muntok, BANGKA - BELITUNG 33313', '(G) 0716.21313, (F) 0716.21002, (P) 0716.21002', 'bethesda.mentok@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB EFRATA', 'Jln. A. Yani - Toboali, BANGKA SELATAN 33183', '(G) 0718.41554, (F) 0718.41380', 'efrata.toboali@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB IMMANUEL (Belinyu)', 'Jln. Suramenggala 1, Kotak Pos 1 - Belinyu, BANGKA 33254', null, 'immanuel.belinyu@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB IMMANUEL (Tanjung Pandan)', 'Jln. Melati A 2, TANJUNGPANDAN - BELITUNG - 33416', '(G) 0719.21894', 'immanuel.tanjungpandan@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB KARUNIA', 'Jln. Kantor Pajak, BELITUNG TIMUR 33472', null, 'karunia.belitung@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB MARANATHA', 'Jln. Jend. Sudirman No. 17 - 19, PANGKALPINANG 33128', '(G) 0717.421321', 'maranatha.pangkalpinang@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB ORA ET LABORA', 'Jln. Jend. Sudirman No. 308, SUNGAILIAT - BANGKA 33211', '(G) 0717.92361', 'oraetlabora.sungailiat@gpib.or.id'),
  ('BABEL(Bangka Belitung)', 'GPIB SION', 'Jln. Pos Koba, BANGKA TENGAH 33181', '(G) 0718.61263', 'sion.koba@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB BAITANI', 'Kompleks Pertamina, PULAU SAMBU - BATAM 29411', '(G) 0778.310059', 'baitani.pulausambu@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB BAHTERA HAYAT', 'Gg. Sempurna II,, RT. 03/RW. 05 Blok E No. 81 - 85, Kelurahan Sungai Lekop, Kec. Sagalung, B A T A M', '(G) 0778.391554, (F) 0778.391554, (P) 0778.391554', 'bahterahayat.batam@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB BETHEL', 'Jln. Gereja No. 1, TANJUNG PINANG 29111', '(G) 0771.21863, (F) 0771.22073, (P) 0771.21886', 'bethel.tanjungpinang@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB BUKIT KARMEL', 'Jln. Pemandian No. 1, Kotak Pos 1, DABO SINGKEP 29871', '(G) 0776.21331 ext. 213', 'bukitkarmel.dabosingkep@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB BUKIT KASIH', 'Jln. Adisucipto, Kompleks Pangkalan TNI - AU, RANAI - NATUNA', '(G) 0773.31472', 'bukitkasih.ranai@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB EBENHAEZER', 'Jln. Usman Harun No. 1, Tanjung Batu Kundur 29662, KEPULAUAN RIAU', '(G) 0779.21845', 'ebenhaezer.pulaukundur@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB HOSANNA', 'Jln. Hang Tuah No. 35, TANJUNG UBAN 29152 - KEP. RIAU', '(G) 0771.81177, (F) 0771.81604', 'hosanna.tanjunguban@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB IMMANUEL (Tarempa)', 'Jln. Kampung Baru No. 1 Tarempa, Kabupaten Kep. Anambas 29791', '(G) 0772.31278', 'immanuel.tarempa@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB IMMANUEL (Batam)', 'Jln. Raja Ali Haji No. 1, P.O. BOX 1, BATU AMPAR - BATAM 29432', '(G) 0778.424836, (F) 0778.424836, (P) 0778.452310', 'immanuel.batam@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB ORA ET LABORA', 'Jln. Jend. A. Yani No. 10 Tj Balai, Meral Tanjung Balai - KEPULAUAN RIAU', '(G) 0777.325940, (F) 0777.325940, (P) 0777.21052', 'oraetlabora.karimun@gpib.or.id'),
  ('KEPRI(Kepulauan Riau)', 'GPIB ZEBULON', 'Jln. Kartini III Sei Harapan, SEKUPANG - BATAM 29422', '(G) 0778.324921, (F) 0778.324921, (P) 0778.323057, 0778.7005060', 'zebulon.sekupang@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB BUKIT BENUAS', 'Jln. Kol. H. Syarifuddin Yoes, Gg. Duatan B. Sakai RT. 45 No. 83, Kel. Sepinggan Baru Balikpapan 76115', '(G) 0542.7028896, (F) 0542.8870020', 'bukitbenuas.balikpapan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB BUKIT SION', 'Jln. Bukit Sion RT. 44 No. 58, BALIKPAPAN 76121 - KALTIM', '(G) 0542.426017, (F) 0542.737507, (P) 0542.424510', 'bukitsion.balikpapan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB EBEN - HAEZER', 'Tana Paser, Jln. Jend. Sudirman No. 13, Kabupaten Paser - KALTIM 76211', '(G) 0543.21616, (F) 0543.21616', 'ebenhaezer.tanahgrogot@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB EFFATHA', 'Jln. Boyan Belanda, Gang Batu Petra Desa Batu Kajang, Kecamatan Batu Sopang, Kabupaten Paser - KALTIM 76211', '(G) 0543.5230614, (P) 0543.5230614', 'effatha.batukajang@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB GETSEMANI', 'Jln. Soekarno Hatta KM. 11, Karang Joang BALIKPAPAN - KALTIM', '(G) 0542.860667, (F) 0542.860667', 'getsemani.karangjoang@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB IMMANUEL', 'Jln. Milono RT. 40, 38, Kelurahan Gunung Sari Ilir, BALIKPAPAN - 76121', '(G) 0542.440358, (F) 0542.440358, (P) 0542.415629', 'immanuel.balikpapan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB KANAAN', 'Komplek Perum PT. ITTCI, KM.5, P.O. BOX 132, KENANGAN 76146 - KALTIM', '(G) 0542.840481, (F) 0542.840481, (P) 0542.840014', 'kanaan.kenangan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB MARANATHA', 'Jln. Yos Sudarso No. 1, BALIKPAPAN 76123 - KALTIM', '(G) 0542.7516026, (F) 0542.7516026', 'maranatha.balikpapan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB PNIEL', 'Jln. Gereja, 28 Kel. Prapatan, BALIKPAPAN - KALTIM - 76111', '(G) 0542.731069, 0542.749254, (F) 0542.731069, (P) 0542.419527', 'pniel.balikpapan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB SILOAM', 'Jln. Gereja Desa Krayan Sentosa RT XII, RW IV Kec. Long Ikis, Kab. Paser, KALIMANTAN TIMUR - 76282', '(G) 0543.2707883, (F) 0543.8879233', 'siloam.krayan@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB SION Sandeley', 'Jln. Negara KM. 95, Gedung Gereja Oikoumene, PTPN XIII, Desa Sandeley, Kec. Long Ikis, KABUPATEN PASER - KALTIM', null, 'sion.semuntai@gpib.or.id'),
  ('KALTIM I(Kalimantan Timur I)', 'GPIB SYALOOM', 'Jln. Marsma R. Iswahyudi RT.15, 17, Kelurahan Sepinggan, BALIKPAPAN', '(G) 0542.7029061, (F) 0542.761277, (P) 0542.7072301', 'syalom.balikpapan@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB ANUGERAH', 'Jln. Toha, Gg. Sentral RT.XIX/04, 43, Handil - Muara Jawa,, Kab.Kutai Kertanegara, KALTIM 75261', '(G) 0541.691441, (F) 0541.691441', 'anugerah.handil@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB EBEN - HAEZER', 'Jln. Limau No. 50 VORVO, SAMARINDA - KALTIM', '(G) 0541.742918, (F) 0541.742918', 'ebenhaezer.samarinda@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB EFATA', 'Jln. Maduningrat, 31 - 33, TENGGARONG 75512 - KALTIM', '(G) 0541.661497, (F) 0541.661497', 'efata.tenggarong@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB GLORIA Tenggarong', 'Jln. Bontang, 129 RT 3, Kelurahan Maluhu - Tenggarong, KALIMANTAN TIMUR', '(G) 0541.6667246', 'gloria.tenggarong@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB IMMANUEL', 'Jln. Jend. Sudirman, 7, Kotak Pos 1123, SAMARINDA 75122', '(G) 0542.671511, 0541.742036', 'immanuel.samarinda@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB MARANATHA', 'Jln. HOS Tjokroaminoto, P.O. BOX 13 Sanga Sanga 75254', '(G) 0542.671511', 'maranatha.sangasanga@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB MARTURIA', 'Jln. Soekarno Hatta KM. 5, Desa Purwajaya, Kec. Loa Janan, Kab. Kutai Kartanegara, KALIMANTAN TIMUR - 75391', '(G) 0541.7269142', 'marturia.loajanan@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB PELITA KASIH', 'Jln. Sepakat RT.17 No. 2, Sangatta - Kutai Timur, KALIMANTAN TIMUR', '(G) 0549.21883', 'pelitakasih.sanggata@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB "SION" JAHAB', 'Jln. Etam KM. 5, Kel. Jahab, Tenggarong, Kutai Kertanegara, KALIMANTAN TIMUR', null, 'sion.jahab@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB SOLA GRACIA', 'Jln. Kemakmuran Desa Sebuntal,, Kec. Marang Kayu, Kabupaten Kutai Kertanegara, KALIMANTAN TIMUR', '(F) 0542.7568210', 'solagratia.marangkayu@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB SOLA FIDE', 'd.a Kampung Manado Tanjung Limau, MUARA BADAK 75382 - KALTIM', '(G) 0542.525828', 'solafide.muarabadak@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB SUMBER KASIH', 'Jln. Alexander RT. 10. Kel. Berebas Tengah, BONTANG 75324 - KALTIM', '(G) 0548.22895, (P) 0548.21384', 'sumberkasih.bontang@gpib.or.id'),
  ('KALTIM II(Kalimantan Timur II)', 'GPIB HEBRON', 'Jln. Selat Makasar RT. 35 Mangkupalas, Kel. Mesjid, Kec. Samarinda Seberang, KOTA SAMARINDA. Prop. KALTIM 75133', null, 'hebron.mangkupalas@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB BETLEHEM', 'Jln. GPIB, 27 RT.VI Kuala Lapang, Kecamatan Malinau Barat,, Prop. KALTARA 77554', '(G) 0553.21332, (F) 0553.21332', 'betlehem.malinau@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB EFFATHA', 'Jln. Bunyu Raya, P.O. BOX 14, PULAU BUNYU 77181 - KALTIM', '(G) 0551.2055229', 'effatha.pulaubunyu@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB HOSIANA', 'Jln. Mangga I, 6. Po. Box 102, Tanjung Redeb - Berau, KALTIM 77301', '(G) 0554.21633, (F) 0554.26636', 'hosiana.berau@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB IMMANUEL Apau Kayan', 'd.a. GPIB Immanuel Samarinda, Jln. Jend. Sudirman No. 7, Kotak Pos 1123, SAMARINDA 75122', null, 'immanuel.apaukayan@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB IMMANUEL', 'Jln. Danau Semayang No.13 - 14, TARAKAN 77121 - KALTIM', '(G) 0551.51029, (F) 0551.51434', 'immanuel.tarakan@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB MARANATHA', 'Jln. D.I. Panjaitan, 35, Kabupaten Bulungan - KALTARA, TANJUNG SELOR 77212', '(G) 0552.21415, (F) 0552.23204, (P) 0552.22300', 'maranatha.tanjungselor@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB SION', 'Jln. Pasir Putih No. 74 RT 03, NUNUKAN 77182 - KALTIM', '(G) 0556.21178, (F) 0556.21178, (P) 0556.24679', 'sion.nunukan@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB UUNG PENGELESAU Pujungan', 'd.a GPIB Maranatha Tanjung SELOR. Jl. DI, Panjaitan 35 Tanjung Selor Kab Bulungan -, KALTARA Tanjung Selor 77211', null, 'uungpenglesau.pujungan@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB ANUGERAH Tarakan', 'Jl. P. Aji Iskandar, Gg Kakap RT 08, Juata Laut - TARAKAN UTARA', null, 'anugerah.tarakan@gpib.or.id'),
  ('KALTARA-BERKAT(Kalimantan Utara dan Berau/Kaltim bagian utara)', 'GPIB BETHEL Teras Nawang', 'Desa Teras Nawang Ke. Tanjung Palas Kab., Bulungan Propinsi KALIMANTAN UTARA', null, null),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB EBENHAEZER', 'Jln. Baban, 30, PALANGKA RAYA 73111 - KALTENG', '(G) 0536.3223155, (F) 0536.3223155', 'ebenhaezer.palangkaraya@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB EFFATHA', 'Jln. Jend. A. Yani KM. 31, Guntung Payung 70721 - Banjarbaru, KALIMANTAN SELATAN', '(G) 0511.4773310', 'effatha.banjarbaru@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB IMMANUEL (Kotabaru)', 'Jln. Veteran, 5, KOTABARU 72116 - KALSEL', '(G) 0518.21209, (F) 0518.21209', 'immanuel.kotabaru@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB IMMANUEL (Landasan Ulin)', 'Landasan Ulin. Komp Pangkalan TNI AU, Syamsudin Noor. Jln Rajawali, 3, Landasan Ulin Banjar Baru 70724 KALSEL', '(G) 0511.4705843, (F) 0511.4705843', 'immanuel.landasanulin@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB MARANATHA', 'Jln. A.S. Musaffa, 2 (Jln. Gereja), BANJARMASIN 70114 - KALSEL', '(G) 0511.4368795, (F) 0511.4368795, (P) 0511.7480998, 0511.33565816', 'maranatha.banjarmasin@gpib.or.id'),
  ('KALSELTENG(Kalimantan Selatan dan Kalimantan Tengah)', 'GPIB SOLA GRATIA Batulicin', 'Jln. Transmigrasi KM 4, Komp Perumahan Citra Mega Permai, Blok C 2 Batu Licin - Tanah Bumbu, Kalimantan Selatan 72171', '(G) 0518.74762, (F) 0518.71479', 'solagratia.batulicin@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB ANUGERAH', 'Jln. Raya Beduai RT.III/RW.II, 104, Dusun Muara Beduai, Desa Kasromego, Kecamatan Beduai, Kabupaten Sanggau, KALBAR 78555', null, 'anugerah.beduai@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB BETHESDA', 'Jln. Daeng Utih No.39, Dusun Tempayak, Desa Suka Karya, Kec. Marau, Kab Ketapang, KALBAR 78863', null, 'bethesda.marau@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB BETLEHEM', 'Jln. Trans Kalimantan, Desa Lingga, Kec. Sei Ambawang - Kab. Kubu Raya, Kotak Pos 1246, KALIMANTAN BARAT - 78001', null, 'betlehem.sungaiambawang@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB BUKIT AGAPE Entikong', 'Jalan Lintas Malindo, Dusun Semanget, Desa Semanget, Kecamatan Entikong - Kabupaten Sanggau, PROPINSI KALIMANTAN BARAT 78557', null, 'bukitagape.entikong@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB EBENHAEZER', 'Jln. Letkol M. Tohir, 39, KETAPANG 78817 - KALBAR', '(G) 0543.32516, (F) 0543.32516', 'ebenhaezer.ketapang@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB ICHTUS', 'Jln. Dusun Suka Bangun, Kec. Tumbang Titi, RT.10 / 02, KAB. KETAPANG - KALBAR', null, 'ichtus.tumbangtiti@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB IMMANUEL', 'Jln. Pemuda, 1. P.O BOX 159, SINGKAWANG 79111 - KALBAR', '(G) 0543.631998, (F) 0543.631998, (P) 0562.637424', 'immanuel.singkawang@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB MARANATHA', 'Jln. Jend. A. Yani, 43, SANGGAU - KALBAR - 78518', '(G) 0564.21332', 'maranatha.sanggau@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB MENARA IMAN', 'Jln. Lintas Sekayam, 39, Desa Kenaman, Kec. Sekayam, KABUPATEN SANGGAU - KALBAR 78556', '(G) 0564.31930, (F) 0564.31930', 'menaraiman.sekayam@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB ORA ET LABORA', 'Jln. Raya Kembayan, Dusun Semunte - Kec. Kembayan, SANGGAU - KALBAR 78553', null, 'oraetlabora.semunte@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB PANAMPA Kepayang', 'Dusun IV - Desa Kepayang, Kec. Anjongan, Kab. Pontianak, KALBAR 78354', null, 'panampa.kepayang@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB PANITAH', 'Jln. Raya Anjungan, Kec. Anjongan, 78354, KALIMANTAN BARAT', '(G) 0561.6695135', 'panitah.anjungan@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB SILOAM', 'Jln. R.A. Kartini, 1 P.O. BOX 1091, PONTIANAK 78117 - KALBAR', '(G) 0561.734235, (F) 0561.734235', 'siloam.pontianak@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB SEJAHTERA', 'Jln. Raya Sosok, 76 Simpang Tayan, Sosok 78562, SANGGAU - KALBAR', '(G) 0563.28773', 'sejahtera.sosok@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB SYALOOM Sei Kajang', 'Jln. Raya Sambas - Subah KM.22, (Madak) Kotak Pos 05, KAB. SAMBAS - KALBAR 79462', null, 'syaloom.seikajang@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB MARGAHAYU Rasau Jaya', 'Jln. Jend Sudirman No. 44 Dusun Damai, RT 05/RW 02 Desa Rasau Jaya I Kec., Rasau Jaya Kab. Kubu Jaya KALBAR', null, 'margahayu.rasaujaya@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB EKKLESIA Air Upas', 'Dusun Sengkuang, Desa Harapan Baru, Kec. Air Upas, Kab. Ketapang, Prov KALBAR 78865', null, 'ekklesia.airupas@gpib.or.id'),
  ('KALBAR(Kalimantan Barat)', 'GPIB MAMURAJA Sungai Raya', 'Jln. Arteri Supadio RT.006/RW.008, Desa Sungai Raya, Kabupaten Kubu Raya- KALBAR 78391', null, null),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB BAH TERA KASIH', 'Jln. Tidung X No. 18, Perumnas, MAKASSAR 90222', '(G) 0411.862512, (F) 0411.880402, (P) 0411.882064', 'bahterakasih.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB BETHANIA', 'Jln. Gunung Nona/S. Nuri No. 1, P. O. BOX 1647, MAKASSAR', '(G) 0411.3612991, (F) 0411.3612991, (P) 0411.873220', 'bethania.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB BETHEL', 'Jln. Jend. Sudirman No. 92 - 94, Raha 93611 (Kab. Muna), SULAWESI TENGGARA', '(G) 0403.2521215', 'bethel.raha@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB BUKIT ZAITUN', 'Jln. Cendrawasih No. 353, MAKASSAR 90134', '(G) 0411.837127, (F) 0411.871011, (P) 0411.876790', 'bukitzaitun.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB IMMANUEL (Baubau)', 'Jln. Pattimura No. 2, BauBau, SULAWESI TENGGARA 93713', '(G) 0402.2821566, (F) 0402.2825126', 'immanuel.baubau@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB IMMANUEL Majene', 'Jln. K.H.M. Saleh No. 73, Kotak Pos 21, MAJENE 91412 - SULAWESI BARAT', '(G) 0422.21056, (F) 0422.21222', 'immanuel.majene@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB IMMANUEL (Makassar)', 'Jln. Balai Kota No. 1, Kotak Pos 1625, MAKASSAR - 90111', '(G) 0411.3615749', 'immanuel.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB IMMANUEL (Parepare)', 'Jln. Bau Masape No.470, RT.01/RW.V, Kel. Ujung Sabbang, PAREPARE 91114 - SULAWESI', '(G) 0421.21081, 0421.233481, (F) 0421.21081, (P) 0421.448168', 'immanuel.parepare@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB IMMANUEL (Watampone)', 'Jln. Ahmad Yani No. 2, P.O. BOX 155, WATAMPONE 92700 - SULSEL', '(G) 0481.21953', 'immanuel.watampone@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB KANA TOJENG', 'Aspol Batang Kaluku Blok I No. 25, Sungguminasa, GOWA - MAKASSAR', '(G) 0411.8220475', 'kanatojeng.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB MANGNGAMASEANG', 'Jln. Urip Sumoharjo No. 75, Kotak Pos 1 - Tello Baru, MAKASSAR 90233', '(G) 0411.442253, (F) 0411.493205, 0411.445135, (P) 0411.451922', 'mangngamaseang.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB PAMMASE', 'Komp BTN Pepabri Blok C 3 No. 15, Sudiang, MAKASSAR - 90292', '(G) 0411.551204, (F) 0411.3611540, (P) 0411.551204', 'passareang.makassar@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB PELITA BARAS', 'd.a. PT Unggul Widya Teknologi Lestari, Jln. Setiabudi No. 67 B, PALU - SULTENG 94111', null, 'pelita.baras@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB SINAR KASIH BARAS', 'P.O BOX 03 Pasangkayu 91571', null, 'sinarkasih.baras@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB SOLAFIDE Sarudu', 'BTN LAGARUTU CPI 5 Blok A No. 14, Jln. Dayodara, PALU - SULTENG', null, 'solafide.sarudu@gpib.or.id'),
  ('SULSELBARA(Sulawesi Selatan, Sulawesi Barat, dan Sulawesi Tenggara)', 'GPIB SUMBER KASIH', 'Jln. Lakidende No. 11 - 13, KENDARI - SULAWESI', '(G) 0401.3126741', 'sumberkasih.kendari@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB EBEN - HAEZER', 'Jln. Patih Jelantik No.20, GIANYAR - DENPASAR - 80232', '(G) 0361.943270, (P) 0361.948710', 'ebenhaezer.gianyar@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB EKKLESIA', 'Bandar Udara Ngurah Rai, Jln. Sentani No. 1, TUBAN - KUTA BALI 80361', '(G) 0361.758104, (F) 0361.754424, (P) 0361.753674', 'ekklesia.kutabali@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB IMMANUEL Bung Karno Mataram', 'Jln. Bung Karno, MATARAM - NTB - 83127', '(G) 0370.635504, (F) 0370.622354, (P) 0370.645606', 'immanuel.bungkarno@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB MARANATHA', 'Jln. Suropati No. 11, DENPASAR 80232', '(G) 0362.22769', 'maranatha.denpasar@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB PNIEL Singaraja', 'Jln. I. Gusti Ngurah Rai No. 49, SINGARAJA - BALI', '(G) 0362.22769, (F) 0362.25202', 'pniel.singaraja@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB SYALOM', 'Jln. Gunung Resimuka Barat Gang III, No. 9 Perumahan Monang-Manang, Tegal Kerta, Denpasar Barat., Kode Pos 80119', '(G) 0361.481362', 'syalom.denpasar@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB KASIH KARUNIA', 'Denpasar Jln. Panji Gang Melati No. 1, Kwanji Dalung, Kuta Utara, Badung - Bali', null, 'kasihkarunia.denpasar@gpib.or.id'),
  ('BALI-NTB(Bali dan Nusa Tenggara Barat)', 'GPIB IMMANUEL', 'W. R Supratman, Mataram, Jl. W.R Supratman No. 1, MATARAM - NTB 83121', null, 'immanuel.wrsupratman@gpib.or.id');

create or replace view public.v_jemaat as
select
  j.id,
  j.mupel,
  m.nama as nama_mupel,
  m.email as email_mupel,
  j.nama,
  j.alamat,
  j.telepon,
  j.email
from public.jemaat j
join public.mupel_jemaat m on m.kode = j.mupel;

comment on view public.v_jemaat is 'Jemaat beserta email mupel asal.';

commit;
