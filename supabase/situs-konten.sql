begin;

-- Menu dan konten halaman publik.
-- Hanya superuser yang boleh mengubah. Pengunjung membaca menu aktif dan konten terbit.
-- Menjalankan ulang skrip ini tidak menimpa perubahan yang sudah disimpan.

create table if not exists public.situs_menu (
  id text primary key,
  induk_id text references public.situs_menu (id) on delete cascade,
  label text not null check (char_length(btrim(label)) > 0),
  jangkar text not null check (char_length(btrim(jangkar)) > 0),
  urutan integer not null,
  aktif boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.situs_konten (
  kunci text primary key,
  menu_id text references public.situs_menu (id) on delete set null,
  judul text not null check (char_length(btrim(judul)) > 0),
  isi jsonb not null check (jsonb_typeof(isi) = 'object'),
  terbit boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists situs_menu_updated_at on public.situs_menu;
create trigger situs_menu_updated_at
  before update on public.situs_menu
  for each row execute function public.set_updated_at();

drop trigger if exists situs_konten_updated_at on public.situs_konten;
create trigger situs_konten_updated_at
  before update on public.situs_konten
  for each row execute function public.set_updated_at();

comment on table public.situs_menu is 'Menu dan submenu situs publik. Hanya superuser yang mengubah.';
comment on table public.situs_konten is 'Teks halaman publik. Pengunjung hanya membaca baris yang diterbitkan.';

alter table public.situs_menu enable row level security;
alter table public.situs_konten enable row level security;

drop policy if exists situs_menu_baca on public.situs_menu;
create policy situs_menu_baca on public.situs_menu
  for select to anon, authenticated
  using (aktif or public.punya_peran('superuser'));

drop policy if exists situs_menu_tambah on public.situs_menu;
create policy situs_menu_tambah on public.situs_menu
  for insert to authenticated
  with check (public.punya_peran('superuser'));

drop policy if exists situs_menu_ubah on public.situs_menu;
create policy situs_menu_ubah on public.situs_menu
  for update to authenticated
  using (public.punya_peran('superuser'))
  with check (public.punya_peran('superuser'));

drop policy if exists situs_konten_baca on public.situs_konten;
create policy situs_konten_baca on public.situs_konten
  for select to anon, authenticated
  using (terbit or public.punya_peran('superuser'));

drop policy if exists situs_konten_tambah on public.situs_konten;
create policy situs_konten_tambah on public.situs_konten
  for insert to authenticated
  with check (public.punya_peran('superuser'));

drop policy if exists situs_konten_ubah on public.situs_konten;
create policy situs_konten_ubah on public.situs_konten
  for update to authenticated
  using (public.punya_peran('superuser'))
  with check (public.punya_peran('superuser'));

grant select on public.situs_menu to anon, authenticated;
grant insert, update on public.situs_menu to authenticated;
grant select on public.situs_konten to anon, authenticated;
grant insert, update on public.situs_konten to authenticated;

insert into public.situs_menu (id, induk_id, label, jangkar, urutan, aktif) values
  ('home', null, 'HOME', 'home', 10, true),
  ('about', null, 'ABOUT', 'about', 20, true),
  ('schedule', null, 'SCHEDULE', 'schedule', 30, true),
  ('information', null, 'INFORMATION', 'information', 40, true),
  ('registration', null, 'REGISTRATION', 'registration', 50, true),
  ('gallery', null, 'GALLERY', 'gallery', 60, true),
  ('contact', null, 'CONTACT', 'contact', 70, true)
on conflict (id) do nothing;

insert into public.situs_menu (id, induk_id, label, jangkar, urutan, aktif) values
  ('about.background', 'about', 'Background', 'background', 21, true),
  ('about.theme', 'about', 'Theme', 'theme', 22, true),
  ('about.welcome', 'about', 'Welcome', 'welcome', 23, true),
  ('schedule.rundown', 'schedule', 'Rundown', 'rundown', 31, true),
  ('schedule.speakers', 'schedule', 'Speakers', 'speakers', 32, true),
  ('schedule.venue', 'schedule', 'Venue', 'venue', 33, true),
  ('information.accommodation', 'information', 'Accommodation', 'accommodation', 41, true),
  ('information.faq', 'information', 'FAQ', 'faq', 42, true),
  ('information.downloads', 'information', 'Downloads', 'downloads', 43, true)
on conflict (id) do nothing;

insert into public.situs_konten (kunci, menu_id, judul, isi, terbit) values
  ('home', 'home', 'Beranda', $json${"judul":"TKS 2027 PKB GPIB","baris1":"TEMU KARYA SINODAL 2027","baris2":"PELKAT PKB GPIB","tombol":"DAFTAR SEKARANG","hitung":"MENGHITUNG MUNDUR","mulai":"2027-07-14T08:00:00+07:00","videoAktif":false,"youtube":"","tombolVideo":"TONTON TEASER"}$json$::jsonb, true),
  ('about', 'about', 'Judul About', $json${"kicker":"TENTANG TKS 2027","judul":"TEMU KARYA","judulAksen":"SINODAL"}$json$::jsonb, true),
  ('about.background', 'about.background', 'Latar belakang', $json${"heading":"LATAR BELAKANG TKS 2027","paragraf":["Temu Karya Sinodal (TKS) merupakan forum pertemuan resmi Pelkat PKB GPIB yang diselenggarakan secara periodik untuk membahas hasil pelayanan, berbagi pengalaman, dan merumuskan arah pelayanan ke depan bagi seluruh kaum bapak di lingkungan GPIB.","TKS 2027 menjadi momentum penting untuk mempererat tali persaudaraan antar kaum bapak dari seluruh klasis di Indonesia, sekaligus memperkuat spiritualitas, keilmuan, dan keterampilan sebagai wujud iman, doa, rasa syukur, dan kesaksian yang mendalam."],"pilar":[{"icon":"✝","title":"Iman","desc":"Memperkuat pondasi iman dalam Kristus"},{"icon":"🤝","title":"Persekutuan","desc":"Membangun persatuan antar klasis"},{"icon":"🌱","title":"Pelayanan","desc":"Mengembangkan jiwa melayani"},{"icon":"⚡","title":"Pembaruan","desc":"Transformasi diri dan gereja"}]}$json$::jsonb, true),
  ('about.theme', 'about.theme', 'Tema', $json${"kicker":"TEMA TKS 2027","baris1":"BERSATU DALAM IMAN,","baris2":"BERKARYA UNTUK BANGSA","deskripsi":"Tema ini mencerminkan semangat persatuan seluruh kaum bapak GPIB dalam satu tekad untuk melayani Tuhan melalui karya nyata bagi bangsa dan masyarakat Indonesia.","subtema":[{"num":"01","title":"Spiritualitas","sub":"Penguatan Iman dan Doa","desc":"Memperdalam kehidupan rohani dan spiritualitas kaum bapak sebagai fondasi pelayanan yang kuat"},{"num":"02","title":"Keilmuan","sub":"Pengembangan Kapasitas","desc":"Meningkatkan wawasan dan pengetahuan untuk mendukung pelayanan yang lebih efektif dan berdampak"},{"num":"03","title":"Keterampilan","sub":"Aksi Nyata Pelayanan","desc":"Mengembangkan keterampilan praktis untuk pelayanan diakonia dan misi gereja di tengah masyarakat"}]}$json$::jsonb, true),
  ('about.welcome', 'about.welcome', 'Sambutan', $json${"orang":[{"role":"Ketua Majelis Sinode GPIB","name":"Pdt. Dr. Marthen Leiwakabessy","initial":"ML","message":"Temu Karya Sinodal 2027 merupakan momentum yang sangat berharga bagi seluruh keluarga besar PKB GPIB. Saya mengajak semua peserta untuk hadir dengan hati yang terbuka, semangat yang membara, dan tekad yang kuat untuk bersama-sama merumuskan langkah pelayanan yang lebih bermakna bagi gereja dan masyarakat Indonesia."},{"role":"Ketua Umum TKS 2027","name":"Once Mekel","initial":"DS","message":"Dengan penuh syukur dan sukacita, kami menyambut seluruh peserta TKS 2027 dari berbagai penjuru Indonesia. Panitia telah menyiapkan seluruh rangkaian kegiatan dengan sepenuh hati agar setiap peserta dapat mengalami pertumbuhan iman, persekutuan yang hangat, dan kecakapan pelayanan yang semakin terasah."}]}$json$::jsonb, true),
  ('schedule', 'schedule', 'Judul Jadwal', $json${"kicker":"JADWAL & KEGIATAN","judul":"AGENDA","judulAksen":"TKS 2027"}$json$::jsonb, true),
  ('schedule.rundown', 'schedule.rundown', 'Rundown', $json${"hari":[{"date":"14 Juli 2027","day":"Hari 1","items":[{"time":"08.00 – 12.00","activity":"Registrasi & Check-in Hotel"},{"time":"13.00 – 15.00","activity":"Makan Siang & Orientasi Peserta"},{"time":"16.00 – 18.00","activity":"Pembukaan Resmi TKS 2027"},{"time":"19.00 – 21.00","activity":"Ibadah Pembukaan & Malam Perkenalan"}]},{"date":"15 Juli 2027","day":"Hari 2","items":[{"time":"07.00 – 08.00","activity":"Saat Teduh & Sarapan"},{"time":"08.30 – 12.00","activity":"Sesi Pleno I: Penguatan Spiritualitas"},{"time":"13.00 – 17.00","activity":"Sesi Pleno II: Kepemimpinan Kristen"},{"time":"19.00 – 21.00","activity":"Malam Kebersamaan & Kreasi Seni"}]},{"date":"16 Juli 2027","day":"Hari 3","items":[{"time":"07.00 – 08.00","activity":"Saat Teduh & Sarapan"},{"time":"08.30 – 12.00","activity":"Workshop: Pelayanan & Diakonia"},{"time":"13.00 – 17.00","activity":"Workshop: Pengembangan Diri & Skill"},{"time":"19.00 – 21.00","activity":"Perlombaan Antar Klasis"}]},{"date":"17 Juli 2027","day":"Hari 4","items":[{"time":"07.00 – 08.00","activity":"Saat Teduh & Sarapan"},{"time":"08.30 – 12.00","activity":"Sidang Kerja & Rekomendasi Sinodal"},{"time":"13.00 – 15.00","activity":"Kunjungan Wisata Rohani"},{"time":"19.00 – 21.00","activity":"Gala Dinner & Penghargaan"}]},{"date":"18 Juli 2027","day":"Hari 5","items":[{"time":"07.00 – 08.00","activity":"Saat Teduh & Sarapan"},{"time":"09.00 – 11.00","activity":"Pelantikan Pengurus Baru PKB"},{"time":"11.00 – 12.00","activity":"Ibadah Penutupan TKS 2027"},{"time":"13.00 – 15.00","activity":"Makan Siang & Check-out"}]}]}$json$::jsonb, true),
  ('schedule.speakers', 'schedule.speakers', 'Pembicara', $json${"pembicara":[{"name":"Pdt. Nitis Putrasana Harsono, M.Th","role":"Ketua Majelis Sinode GPIB","topic":"Penguatan Spiritualitas Kaum Bapak di Era Modern","initial":"ML"},{"name":"Prof. Dr. Ir. Samuel Tobing","role":"Pakar Kepemimpinan Kristen","topic":"Kepemimpinan Berbasis Iman dan Integritas","initial":"ST"},{"name":"Pdt. Yeremia Sitohang, M.Th","role":"Fasilitator Workshop","topic":"Pemuridan dalam Keluarga Kristen","initial":"YS"},{"name":"Dr. Hendra Wattimena","role":"Pembicara Tamu","topic":"Pelayanan Diakonia Kontemporer","initial":"HW"}]}$json$::jsonb, true),
  ('schedule.venue', 'schedule.venue', 'Venue', $json${"judulVenue":"VENUE UTAMA","nama":"Hotel Grand Clarion Makassar","peran":"VENUE UTAMA TKS 2027","alamat":"Jl. A. Pettarani No. 3, Makassar, Sulawesi Selatan 90231","fasilitas":["Ballroom 1500 Orang","WiFi Gratis","Shuttle Bus","Parkir Luas"],"fakta":[{"label":"Tanggal","value":"14 – 18 Juli 2027"},{"label":"Kota","value":"Makassar, Sulsel"},{"label":"Kapasitas","value":"1.500 Peserta"},{"label":"Klasis","value":"Seluruh Indonesia"}],"judulRute":"RUTE & TRANSPORTASI","rute":[{"icon":"✈","title":"Dari Bandara","desc":"Bandara Sultan Hasanuddin — 45 menit dengan taksi/GoCar. Shuttle bus panitia tersedia pukul 08.00–14.00."},{"icon":"🚢","title":"Dari Pelabuhan","desc":"Pelabuhan Soekarno-Hatta Makassar — 20 menit ke venue utama. Transportasi online tersedia 24 jam."},{"icon":"🚌","title":"Shuttle Panitia","desc":"Shuttle gratis dari hotel rekanan ke venue utama, setiap 30 menit mulai pukul 06.30 WIT."}]}$json$::jsonb, true),
  ('information', 'information', 'Judul Informasi', $json${"kicker":"INFORMASI PESERTA","judul":"PANDUAN","judulAksen":"PESERTA"}$json$::jsonb, true),
  ('information.accommodation', 'information.accommodation', 'Akomodasi', $json${"hotel":[{"name":"Hotel Grand Clarion Jakarta","type":"Venue Utama","stars":5,"note":"Hotel penyelenggaraan utama TKS 2027 — akomodasi termasuk dalam paket peserta."},{"name":"Hotel Horison Ultima Jakarta","type":"Akomodasi Alternatif","stars":4,"note":"10 menit dari venue utama. Tarif khusus tersedia bagi peserta TKS 2027."},{"name":"Whiz Prime Hotel Makassar","type":"Akomodasi Ekonomis","stars":3,"note":"Pilihan hemat, 15 menit dari venue. Layanan shuttle disediakan panitia."}],"transportJudul":"TRANSPORTASI LOKAL","transport":[{"title":"Shuttle Resmi","desc":"Layanan shuttle antar hotel rekanan ke venue, berangkat setiap 30 menit"},{"title":"Transportasi Online","desc":"Gojek dan Grab tersedia 24 jam di seluruh kota Jakarta"},{"title":"Taksi Resmi","desc":"Taksi ber-argometer tersedia di bandara, pelabuhan, dan hotel utama"}]}$json$::jsonb, true),
  ('information.faq', 'information.faq', 'FAQ', $json${"items":[{"q":"Siapa yang dapat mengikuti TKS 2027?","a":"TKS 2027 terbuka untuk seluruh anggota Pelkat PKB GPIB dari berbagai klasis di seluruh Indonesia. Setiap jemaat dapat mengirimkan delegasi sesuai kuota yang ditetapkan panitia."},{"q":"Apa saja dokumen yang perlu disiapkan untuk registrasi?","a":"Peserta wajib menyiapkan: Surat Rekomendasi dari Majelis Jemaat, KTP/Identitas Diri, bukti transfer biaya pendaftaran, dan pas foto terbaru 3x4. Foto dan KTP diunggah pada formulir peserta. Surat tugas dan bukti transfer diunggah melalui portal pendaftaran."},{"q":"Berapa biaya pendaftaran TKS 2027?","a":"Biaya pendaftaran adalah Rp 2.000.000 per peserta, mencakup akomodasi (4 malam), konsumsi selama acara, seminar kit, dan transportasi antar venue. Biaya belum termasuk transportasi ke dan dari lokasi acara."},{"q":"Di mana lokasi penyelenggaraan TKS 2027?","a":"TKS 2027 diselenggarakan di KotaJ akarta. Venue utama adalah Hotel Millenium, dengan kegiatan lapangan di kawasan wisata sekitar kota."},{"q":"Apakah tersedia beasiswa atau subsidi untuk peserta?","a":"Panitia menyediakan subsidi terbatas bagi jemaat kecil atau yang berada di wilayah terpencil. Pengajuan subsidi dilakukan melalui surat resmi kepada panitia pusat sebelum 1 April 2027."},{"q":"Apa yang perlu dibawa selama acara berlangsung?","a":"Peserta disarankan membawa: Alkitab, buku nyanyian GPIB, pakaian resmi dan kasual, obat-obatan pribadi, dan perlengkapan ibadah. Detail lengkap tersedia di Petunjuk Teknis yang dapat diunduh pada halaman Informasi."}]}$json$::jsonb, true),
  ('information.downloads', 'information.downloads', 'Unduhan', $json${"catatan":"* Berkas unduhan tersedia setelah registrasi dikonfirmasi. Hubungi sekretariat panitia untuk informasi lebih lanjut.","berkas":[{"title":"Surat Edaran TKS 2027","type":"PDF","size":"1.2 MB","desc":"Surat resmi pemberitahuan penyelenggaraan TKS 2027"},{"title":"Petunjuk Teknis (Juknis)","type":"PDF","size":"3.4 MB","desc":"Panduan lengkap teknis pelaksanaan kegiatan"},{"title":"Proposal Kegiatan","type":"PDF","size":"5.8 MB","desc":"Proposal resmi TKS 2027 PKB GPIB"},{"title":"Formulir Pendaftaran Offline","type":"PDF","size":"0.8 MB","desc":"Formulir cetak untuk jemaat tanpa akses internet"},{"title":"Jadwal Lengkap Kegiatan","type":"PDF","size":"1.1 MB","desc":"Rundown acara lengkap selama 5 hari pelaksanaan"}]}$json$::jsonb, true),
  ('registration', 'registration', 'Registrasi', $json${"kicker":"REGISTRASI / REGISTRATION","judulBaris1":"DAFTAR","judulBaris2":"SEKARANG","paragraf":"Jadilah bagian dari Temu Karya Sinodal 2027. Pendaftaran dibuka hingga 30 Juni 2027. Jangan lewatkan kesempatan bersejarah ini bersama ribuan kaum bapak GPIB dari seluruh Indonesia.","statistik":[{"label":"Batas Daftar","value":"30 Juni 2027"},{"label":"Kuota","value":"1.500 Peserta"},{"label":"Biaya","value":"Rp 2.000.000"}],"langkahJudul":"LANGKAH PENDAFTARAN","langkah":[{"step":"01","title":"Buat Akun & Login","desc":"Daftar akun baru atau masuk dengan akun yang sudah ada"},{"step":"02","title":"Isi Formulir Online","desc":"Lengkapi data peserta, unggah foto, KTP, dan surat tugas"},{"step":"03","title":"Kirim Pendaftaran","desc":"Dapatkan nomor pendaftaran dan pantau status verifikasi"},{"step":"04","title":"Konfirmasi Pembayaran","desc":"Transfer biaya dan kirim bukti ke sekretariat"},{"step":"05","title":"Terima ID Peserta","desc":"Panitia mengirimkan nomor ID dan informasi acara"}],"panduanAktif":false,"panduanJudul":"PANDUAN PENDAFTARAN","panduanAkunLabel":"Cara membuat akun","panduanAkunYoutube":"","panduanPesertaLabel":"Cara mendaftarkan peserta","panduanPesertaYoutube":""}$json$::jsonb, true),
  ('gallery', 'gallery', 'Galeri', $json${"kicker":"DOKUMENTASI","judul":"GALERI","judulAksen":"KEGIATAN","catatan":"Foto & video dokumentasi pra-acara akan diperbarui secara berkala. Kilas balik TKS sebelumnya tersedia di media sosial resmi panitia.","item":[{"label":"Ibadah Bersama","bg":"#505050"},{"label":"Seminar","bg":"#484848"},{"label":"Workshop","bg":"#525252"},{"label":"Paduan Suara","bg":"#464646"},{"label":"Olahraga","bg":"#545454"},{"label":"Penutupan","bg":"#505050"}]}$json$::jsonb, true),
  ('contact', 'contact', 'Kontak', $json${"kicker":"HUBUNGI KAMI","judul":"ADA","judulAksen":"PERTANYAAN?","paragraf":"Kami siap menjawab setiap pertanyaan Anda tentang Temu Karya Sinodal 2027. Jangan ragu menghubungi kami melalui saluran resmi berikut.","saluran":[{"label":"Email","value":"tkspkbgpib2027@gmail.com"},{"label":"WhatsApp Sekretariat","value":"+62 812-0000-2027"},{"label":"WhatsApp Ketua Panitia","value":"+62 811-0000-2027"},{"label":"Instagram","value":"@tkspkbgpib2027"}],"sosialJudul":"MEDIA SOSIAL RESMI","sosial":[{"nama":"Instagram","link":""},{"nama":"Facebook","link":""},{"nama":"YouTube","link":""}]}$json$::jsonb, true),
  ('footer', null, 'Footer', $json${"hakCipta":"© 2027 Pelkat PKB GPIB.","tambahan":"All rights reserved.","lokasi":"DKI Jakarta· 14 – 18 Juli 2027"}$json$::jsonb, true)
on conflict (kunci) do nothing;

commit;
