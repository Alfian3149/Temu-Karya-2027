export type SubItem = { label: string; tab: string }
export type NavItem = { label: string; anchor: string; sub?: SubItem[] }

export type SiteMenu = {
  id: string
  indukId: string | null
  label: string
  jangkar: string
  urutan: number
  aktif: boolean
}

export type SectionHead = { kicker: string; judul: string; judulAksen: string }

export type HeroIsi = {
  judul: string
  baris1: string
  baris2: string
  tombol: string
  tanggal: string
  hitung: string
  mulai: string
  videoAktif: boolean
  youtube: string
  tombolVideo: string
  iklan: string
}

export type BackgroundIsi = {
  heading: string
  paragraf: string[]
  pilar: { icon: string; title: string; desc: string }[]
}

export type ThemeIsi = {
  kicker: string
  baris1: string
  baris2: string
  deskripsi: string
  subtema: { num: string; title: string; sub: string; desc: string }[]
}

export type WelcomeIsi = {
  orang: { role: string; name: string; initial: string; message: string }[]
}

export type RundownIsi = {
  hari: { date: string; day: string; items: { time: string; activity: string }[] }[]
}

export type SpeakersIsi = {
  pembicara: { name: string; role: string; topic: string; initial: string }[]
}

export type VenueIsi = {
  judulVenue: string
  nama: string
  peran: string
  alamat: string
  fasilitas: string[]
  fakta: { label: string; value: string }[]
  judulRute: string
  rute: { icon: string; title: string; desc: string }[]
}

export type AkomodasiIsi = {
  hotel: { name: string; type: string; stars: number; note: string }[]
  transportJudul: string
  transport: { title: string; desc: string }[]
}

export type FaqIsi = { items: { q: string; a: string }[] }

export type DownloadsIsi = {
  catatan: string
  berkas: { title: string; type: string; size: string; desc: string }[]
}

export type RegistrationIsi = {
  kicker: string
  judulBaris1: string
  judulBaris2: string
  paragraf: string
  statistik: { label: string; value: string }[]
  langkahJudul: string
  langkah: { step: string; title: string; desc: string }[]
  panduanAktif: boolean
  panduanJudul: string
  panduanAkunLabel: string
  panduanAkunYoutube: string
  panduanPesertaLabel: string
  panduanPesertaYoutube: string
}

export type PanduanBab = { id: string; label: string }

export type Panduan = {
  judul: string
  akun: PanduanBab | null
  peserta: PanduanBab | null
}

export type GalleryIsi = {
  kicker: string
  judul: string
  judulAksen: string
  catatan: string
  driveLabel: string
  driveUrl: string
  item: { label: string; bg: string; foto: string }[]
}

export type ContactIsi = {
  kicker: string
  judul: string
  judulAksen: string
  paragraf: string
  saluran: { label: string; value: string }[]
  sosialJudul: string
  sosial: { nama: string; link: string }[]
}

export type FooterIsi = { hakCipta: string; tambahan: string; lokasi: string }

export type KontenKind = "body" | "chrome"

export type KontenDef = {
  kunci: string
  menuId: string | null
  judul: string
  kind: KontenKind
  isi: object
  parse: (value: unknown) => object | null
}

export const PARENT_IDS = ["about", "schedule", "information"] as const

export const DEFAULT_MENUS: SiteMenu[] = [
  { id: "home", indukId: null, label: "HOME", jangkar: "home", urutan: 10, aktif: true },
  { id: "about", indukId: null, label: "ABOUT", jangkar: "about", urutan: 20, aktif: true },
  { id: "about.background", indukId: "about", label: "Background", jangkar: "background", urutan: 21, aktif: true },
  { id: "about.theme", indukId: "about", label: "Theme", jangkar: "theme", urutan: 22, aktif: true },
  { id: "about.welcome", indukId: "about", label: "Welcome", jangkar: "welcome", urutan: 23, aktif: true },
  { id: "schedule", indukId: null, label: "SCHEDULE", jangkar: "schedule", urutan: 30, aktif: true },
  { id: "schedule.rundown", indukId: "schedule", label: "Rundown", jangkar: "rundown", urutan: 31, aktif: true },
  { id: "schedule.speakers", indukId: "schedule", label: "Speakers", jangkar: "speakers", urutan: 32, aktif: true },
  { id: "schedule.venue", indukId: "schedule", label: "Venue", jangkar: "venue", urutan: 33, aktif: true },
  { id: "information", indukId: null, label: "INFORMATION", jangkar: "information", urutan: 40, aktif: true },
  { id: "information.accommodation", indukId: "information", label: "Accommodation", jangkar: "accommodation", urutan: 41, aktif: true },
  { id: "information.faq", indukId: "information", label: "FAQ", jangkar: "faq", urutan: 42, aktif: true },
  { id: "information.downloads", indukId: "information", label: "Downloads", jangkar: "downloads", urutan: 43, aktif: true },
  { id: "registration", indukId: null, label: "REGISTRATION", jangkar: "registration", urutan: 50, aktif: true },
  { id: "gallery", indukId: null, label: "GALLERY", jangkar: "gallery", urutan: 60, aktif: true },
  { id: "contact", indukId: null, label: "CONTACT", jangkar: "contact", urutan: 70, aktif: true },
]

const ABOUT_HEAD: SectionHead = { kicker: "TENTANG TKS 2027", judul: "TEMU KARYA", judulAksen: "SINODAL" }
const SCHEDULE_HEAD: SectionHead = { kicker: "JADWAL & KEGIATAN", judul: "AGENDA", judulAksen: "TKS 2027" }
const INFO_HEAD: SectionHead = { kicker: "INFORMASI PESERTA", judul: "PANDUAN", judulAksen: "PESERTA" }

const HERO: HeroIsi = {
  judul: "TKS 2027 PKB GPIB",
  baris1: "TEMU KARYA SINODAL 2027",
  baris2: "PELKAT PKB GPIB",
  tombol: "DAFTAR SEKARANG",
  tanggal: "7 – 11 Juli 2027",
  hitung: "MENGHITUNG MUNDUR",
  mulai: "2027-07-14T08:00:00+07:00",
  videoAktif: false,
  youtube: "",
  tombolVideo: "TONTON TEASER",
  iklan: "https://youtu.be/qCxSJXF8ex4",
}

const BACKGROUND: BackgroundIsi = {
  heading: "LATAR BELAKANG TKS 2027",
  paragraf: [
    "Temu Karya Sinodal (TKS) merupakan forum pertemuan resmi Pelkat PKB GPIB yang diselenggarakan secara periodik untuk membahas hasil pelayanan, berbagi pengalaman, dan merumuskan arah pelayanan ke depan bagi seluruh kaum bapak di lingkungan GPIB.",
    "TKS 2027 menjadi momentum penting untuk mempererat tali persaudaraan antar kaum bapak dari seluruh klasis di Indonesia, sekaligus memperkuat spiritualitas, keilmuan, dan keterampilan sebagai wujud iman, doa, rasa syukur, dan kesaksian yang mendalam.",
  ],
  pilar: [
    { icon: "✝", title: "Iman", desc: "Memperkuat pondasi iman dalam Kristus" },
    { icon: "🤝", title: "Persekutuan", desc: "Membangun persatuan antar klasis" },
    { icon: "🌱", title: "Pelayanan", desc: "Mengembangkan jiwa melayani" },
    { icon: "⚡", title: "Pembaruan", desc: "Transformasi diri dan gereja" },
  ],
}

const THEME: ThemeIsi = {
  kicker: "TEMA TKS 2027",
  baris1: "BERSATU DALAM IMAN,",
  baris2: "BERKARYA UNTUK BANGSA",
  deskripsi: "Tema ini mencerminkan semangat persatuan seluruh kaum bapak GPIB dalam satu tekad untuk melayani Tuhan melalui karya nyata bagi bangsa dan masyarakat Indonesia.",
  subtema: [
    { num: "01", title: "Spiritualitas", sub: "Penguatan Iman dan Doa", desc: "Memperdalam kehidupan rohani dan spiritualitas kaum bapak sebagai fondasi pelayanan yang kuat" },
    { num: "02", title: "Keilmuan", sub: "Pengembangan Kapasitas", desc: "Meningkatkan wawasan dan pengetahuan untuk mendukung pelayanan yang lebih efektif dan berdampak" },
    { num: "03", title: "Keterampilan", sub: "Aksi Nyata Pelayanan", desc: "Mengembangkan keterampilan praktis untuk pelayanan diakonia dan misi gereja di tengah masyarakat" },
  ],
}

const WELCOME: WelcomeIsi = {
  orang: [
    {
      role: "Ketua Majelis Sinode GPIB",
      name: "Pdt. Dr. Marthen Leiwakabessy",
      initial: "ML",
      message: "Temu Karya Sinodal 2027 merupakan momentum yang sangat berharga bagi seluruh keluarga besar PKB GPIB. Saya mengajak semua peserta untuk hadir dengan hati yang terbuka, semangat yang membara, dan tekad yang kuat untuk bersama-sama merumuskan langkah pelayanan yang lebih bermakna bagi gereja dan masyarakat Indonesia.",
    },
    {
      role: "Ketua Umum TKS 2027",
      name: "Once Mekel",
      initial: "DS",
      message: "Dengan penuh syukur dan sukacita, kami menyambut seluruh peserta TKS 2027 dari berbagai penjuru Indonesia. Panitia telah menyiapkan seluruh rangkaian kegiatan dengan sepenuh hati agar setiap peserta dapat mengalami pertumbuhan iman, persekutuan yang hangat, dan kecakapan pelayanan yang semakin terasah.",
    },
  ],
}

export const DEFAULT_RUNDOWN: RundownIsi = {
  hari: [
    {
      date: "14 Juli 2027",
      day: "Hari 1",
      items: [
        { time: "08.00 – 12.00", activity: "Registrasi & Check-in Hotel" },
        { time: "13.00 – 15.00", activity: "Makan Siang & Orientasi Peserta" },
        { time: "16.00 – 18.00", activity: "Pembukaan Resmi TKS 2027" },
        { time: "19.00 – 21.00", activity: "Ibadah Pembukaan & Malam Perkenalan" },
      ],
    },
    {
      date: "15 Juli 2027",
      day: "Hari 2",
      items: [
        { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
        { time: "08.30 – 12.00", activity: "Sesi Pleno I: Penguatan Spiritualitas" },
        { time: "13.00 – 17.00", activity: "Sesi Pleno II: Kepemimpinan Kristen" },
        { time: "19.00 – 21.00", activity: "Malam Kebersamaan & Kreasi Seni" },
      ],
    },
    {
      date: "16 Juli 2027",
      day: "Hari 3",
      items: [
        { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
        { time: "08.30 – 12.00", activity: "Workshop: Pelayanan & Diakonia" },
        { time: "13.00 – 17.00", activity: "Workshop: Pengembangan Diri & Skill" },
        { time: "19.00 – 21.00", activity: "Perlombaan Antar Klasis" },
      ],
    },
    {
      date: "17 Juli 2027",
      day: "Hari 4",
      items: [
        { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
        { time: "08.30 – 12.00", activity: "Sidang Kerja & Rekomendasi Sinodal" },
        { time: "13.00 – 15.00", activity: "Kunjungan Wisata Rohani" },
        { time: "19.00 – 21.00", activity: "Gala Dinner & Penghargaan" },
      ],
    },
    {
      date: "18 Juli 2027",
      day: "Hari 5",
      items: [
        { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
        { time: "09.00 – 11.00", activity: "Pelantikan Pengurus Baru PKB" },
        { time: "11.00 – 12.00", activity: "Ibadah Penutupan TKS 2027" },
        { time: "13.00 – 15.00", activity: "Makan Siang & Check-out" },
      ],
    },
  ],
}

const SPEAKERS: SpeakersIsi = {
  pembicara: [
    { name: "Pdt. Nitis Putrasana Harsono, M.Th", role: "Ketua Majelis Sinode GPIB", topic: "Penguatan Spiritualitas Kaum Bapak di Era Modern", initial: "ML" },
    { name: "Prof. Dr. Ir. Samuel Tobing", role: "Pakar Kepemimpinan Kristen", topic: "Kepemimpinan Berbasis Iman dan Integritas", initial: "ST" },
    { name: "Pdt. Yeremia Sitohang, M.Th", role: "Fasilitator Workshop", topic: "Pemuridan dalam Keluarga Kristen", initial: "YS" },
    { name: "Dr. Hendra Wattimena", role: "Pembicara Tamu", topic: "Pelayanan Diakonia Kontemporer", initial: "HW" },
  ],
}

const VENUE: VenueIsi = {
  judulVenue: "VENUE UTAMA",
  nama: "Hotel Grand Clarion Makassar",
  peran: "VENUE UTAMA TKS 2027",
  alamat: "Jl. A. Pettarani No. 3, Makassar, Sulawesi Selatan 90231",
  fasilitas: ["Ballroom 1500 Orang", "WiFi Gratis", "Shuttle Bus", "Parkir Luas"],
  fakta: [
    { label: "Tanggal", value: "14 – 18 Juli 2027" },
    { label: "Kota", value: "Makassar, Sulsel" },
    { label: "Kapasitas", value: "1.500 Peserta" },
    { label: "Klasis", value: "Seluruh Indonesia" },
  ],
  judulRute: "RUTE & TRANSPORTASI",
  rute: [
    { icon: "✈", title: "Dari Bandara", desc: "Bandara Sultan Hasanuddin — 45 menit dengan taksi/GoCar. Shuttle bus panitia tersedia pukul 08.00–14.00." },
    { icon: "🚢", title: "Dari Pelabuhan", desc: "Pelabuhan Soekarno-Hatta Makassar — 20 menit ke venue utama. Transportasi online tersedia 24 jam." },
    { icon: "🚌", title: "Shuttle Panitia", desc: "Shuttle gratis dari hotel rekanan ke venue utama, setiap 30 menit mulai pukul 06.30 WIT." },
  ],
}

const AKOMODASI: AkomodasiIsi = {
  hotel: [
    { name: "Hotel Grand Clarion Jakarta", type: "Venue Utama", stars: 5, note: "Hotel penyelenggaraan utama TKS 2027 — akomodasi termasuk dalam paket peserta." },
    { name: "Hotel Horison Ultima Jakarta", type: "Akomodasi Alternatif", stars: 4, note: "10 menit dari venue utama. Tarif khusus tersedia bagi peserta TKS 2027." },
    { name: "Whiz Prime Hotel Makassar", type: "Akomodasi Ekonomis", stars: 3, note: "Pilihan hemat, 15 menit dari venue. Layanan shuttle disediakan panitia." },
  ],
  transportJudul: "TRANSPORTASI LOKAL",
  transport: [
    { title: "Shuttle Resmi", desc: "Layanan shuttle antar hotel rekanan ke venue, berangkat setiap 30 menit" },
    { title: "Transportasi Online", desc: "Gojek dan Grab tersedia 24 jam di seluruh kota Jakarta" },
    { title: "Taksi Resmi", desc: "Taksi ber-argometer tersedia di bandara, pelabuhan, dan hotel utama" },
  ],
}

const FAQ: FaqIsi = {
  items: [
    { q: "Siapa yang dapat mengikuti TKS 2027?", a: "TKS 2027 terbuka untuk seluruh anggota Pelkat PKB GPIB dari berbagai klasis di seluruh Indonesia. Setiap jemaat dapat mengirimkan delegasi sesuai kuota yang ditetapkan panitia." },
    { q: "Apa saja dokumen yang perlu disiapkan untuk registrasi?", a: "Peserta wajib menyiapkan: Surat Rekomendasi dari Majelis Jemaat, KTP/Identitas Diri, bukti transfer biaya pendaftaran, dan pas foto terbaru 3x4. Foto dan KTP diunggah pada formulir peserta. Surat tugas dan bukti transfer diunggah melalui portal pendaftaran." },
    { q: "Berapa biaya pendaftaran TKS 2027?", a: "Biaya pendaftaran adalah Rp 2.000.000 per peserta, mencakup akomodasi (4 malam), konsumsi selama acara, seminar kit, dan transportasi antar venue. Biaya belum termasuk transportasi ke dan dari lokasi acara." },
    { q: "Di mana lokasi penyelenggaraan TKS 2027?", a: "TKS 2027 diselenggarakan di KotaJ akarta. Venue utama adalah Hotel Millenium, dengan kegiatan lapangan di kawasan wisata sekitar kota." },
    { q: "Apakah tersedia beasiswa atau subsidi untuk peserta?", a: "Panitia menyediakan subsidi terbatas bagi jemaat kecil atau yang berada di wilayah terpencil. Pengajuan subsidi dilakukan melalui surat resmi kepada panitia pusat sebelum 1 April 2027." },
    { q: "Apa yang perlu dibawa selama acara berlangsung?", a: "Peserta disarankan membawa: Alkitab, buku nyanyian GPIB, pakaian resmi dan kasual, obat-obatan pribadi, dan perlengkapan ibadah. Detail lengkap tersedia di Petunjuk Teknis yang dapat diunduh pada halaman Informasi." },
  ],
}

const DOWNLOADS: DownloadsIsi = {
  catatan: "* Berkas unduhan tersedia setelah registrasi dikonfirmasi. Hubungi sekretariat panitia untuk informasi lebih lanjut.",
  berkas: [
    { title: "Surat Edaran TKS 2027", type: "PDF", size: "1.2 MB", desc: "Surat resmi pemberitahuan penyelenggaraan TKS 2027" },
    { title: "Petunjuk Teknis (Juknis)", type: "PDF", size: "3.4 MB", desc: "Panduan lengkap teknis pelaksanaan kegiatan" },
    { title: "Proposal Kegiatan", type: "PDF", size: "5.8 MB", desc: "Proposal resmi TKS 2027 PKB GPIB" },
    { title: "Formulir Pendaftaran Offline", type: "PDF", size: "0.8 MB", desc: "Formulir cetak untuk jemaat tanpa akses internet" },
    { title: "Jadwal Lengkap Kegiatan", type: "PDF", size: "1.1 MB", desc: "Rundown acara lengkap selama 5 hari pelaksanaan" },
  ],
}

const REGISTRATION: RegistrationIsi = {
  kicker: "REGISTRASI / REGISTRATION",
  judulBaris1: "DAFTAR",
  judulBaris2: "SEKARANG",
  paragraf: "Jadilah bagian dari Temu Karya Sinodal 2027. Pendaftaran dibuka hingga 30 Juni 2027. Jangan lewatkan kesempatan bersejarah ini bersama ribuan kaum bapak GPIB dari seluruh Indonesia.",
  statistik: [
    { label: "Batas Daftar", value: "30 Juni 2027" },
    { label: "Kuota", value: "1.500 Peserta" },
    { label: "Biaya", value: "Rp 2.000.000" },
  ],
  langkahJudul: "LANGKAH PENDAFTARAN",
  langkah: [
    { step: "01", title: "Buat Akun & Login", desc: "Daftar akun baru atau masuk dengan akun yang sudah ada" },
    { step: "02", title: "Isi Formulir Online", desc: "Lengkapi data peserta, unggah foto, KTP, dan surat tugas" },
    { step: "03", title: "Kirim Pendaftaran", desc: "Dapatkan nomor pendaftaran dan pantau status verifikasi" },
    { step: "04", title: "Konfirmasi Pembayaran", desc: "Transfer biaya dan kirim bukti ke sekretariat" },
    { step: "05", title: "Terima ID Peserta", desc: "Panitia mengirimkan nomor ID dan informasi acara" },
  ],
  panduanAktif: false,
  panduanJudul: "PANDUAN PENDAFTARAN",
  panduanAkunLabel: "Cara membuat akun",
  panduanAkunYoutube: "",
  panduanPesertaLabel: "Cara mendaftarkan peserta",
  panduanPesertaYoutube: "",
}

const GALLERY: GalleryIsi = {
  kicker: "DOKUMENTASI",
  judul: "GALERI",
  judulAksen: "KEGIATAN",
  catatan: "Foto pilihan panitia. Dokumentasi lengkap, termasuk video, ada di tautan arsip.",
  driveLabel: "LIHAT SEMUA FOTO",
  driveUrl: "",
  item: [
    { label: "Ibadah Bersama", bg: "#505050", foto: "" },
    { label: "Seminar", bg: "#484848", foto: "" },
    { label: "Workshop", bg: "#525252", foto: "" },
    { label: "Paduan Suara", bg: "#464646", foto: "" },
    { label: "Olahraga", bg: "#545454", foto: "" },
    { label: "Penutupan", bg: "#505050", foto: "" },
  ],
}

const CONTACT: ContactIsi = {
  kicker: "HUBUNGI KAMI",
  judul: "ADA",
  judulAksen: "PERTANYAAN?",
  paragraf: "Kami siap menjawab setiap pertanyaan Anda tentang Temu Karya Sinodal 2027. Jangan ragu menghubungi kami melalui saluran resmi berikut.",
  saluran: [
    { label: "Email", value: "tkspkbgpib2027@gmail.com" },
    { label: "WhatsApp Sekretariat", value: "+62 812-0000-2027" },
    { label: "WhatsApp Ketua Panitia", value: "+62 811-0000-2027" },
    { label: "Instagram", value: "@tkspkbgpib2027" },
  ],
  sosialJudul: "MEDIA SOSIAL RESMI",
  sosial: [
    { nama: "Instagram", link: "" },
    { nama: "Facebook", link: "" },
    { nama: "YouTube", link: "" },
  ],
}

const FOOTER: FooterIsi = {
  hakCipta: "© 2027 Pelkat PKB GPIB.",
  tambahan: "All rights reserved.",
  lokasi: "DKI Jakarta· 14 – 18 Juli 2027",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

export function galleryImageUrl(value: string) {
  const href = httpUrl(value)
  if (!href) return ""
  try {
    const url = new URL(href)
    const host = url.hostname.replace(/^www\./, "")
    if (host === "drive.google.com") {
      const fromPath = url.pathname.match(/\/d\/([^/]+)/)?.[1]
      const id = fromPath || url.searchParams.get("id")
      if (id && /^[\w-]+$/.test(id)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`
    }
  } catch {
    return href
  }
  return href
}

export function httpUrl(value: string) {
  const raw = value.trim()
  if (!raw) return ""
  try {
    const url = new URL(raw)
    if (url.protocol !== "http:" && url.protocol !== "https:") return ""
    return url.href
  } catch {
    return ""
  }
}

function panduanBab(label: string, fallback: string, youtube: string): PanduanBab | null {
  const id = youtubeId(youtube)
  if (!id) return null
  return { id, label: label.trim() || fallback }
}

export function panduanFrom(value: RegistrationIsi | null): Panduan | null {
  if (!value?.panduanAktif) return null
  const akun = panduanBab(value.panduanAkunLabel, REGISTRATION.panduanAkunLabel, value.panduanAkunYoutube)
  const peserta = panduanBab(value.panduanPesertaLabel, REGISTRATION.panduanPesertaLabel, value.panduanPesertaYoutube)
  if (!akun && !peserta) return null
  return {
    judul: value.panduanJudul.trim() || REGISTRATION.panduanJudul,
    akun,
    peserta,
  }
}

export function youtubeId(value: string) {
  const raw = value.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return ""
  }
  const host = url.hostname.replace(/^www\./, "")
  const id = (candidate: string | undefined) => (candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : "")
  if (host === "youtu.be") return id(url.pathname.split("/").filter(Boolean)[0])
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    const fromQuery = id(url.searchParams.get("v") ?? undefined)
    if (fromQuery) return fromQuery
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") return id(parts[1])
  }
  return ""
}

function texts(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  return value.filter((item): item is string => typeof item === "string")
}

function rows<T>(value: unknown, map: (row: Record<string, unknown>) => T, fallback: T[]) {
  if (!Array.isArray(value)) return fallback
  return value.filter(isRecord).map(map)
}

function parseHead(value: unknown, fallback: SectionHead): SectionHead | null {
  if (!isRecord(value)) return null
  return {
    kicker: text(value.kicker, fallback.kicker),
    judul: text(value.judul, fallback.judul),
    judulAksen: text(value.judulAksen, fallback.judulAksen),
  }
}

function parseHero(value: unknown): HeroIsi | null {
  if (!isRecord(value)) return null
  return {
    judul: text(value.judul, HERO.judul),
    baris1: text(value.baris1, HERO.baris1),
    baris2: text(value.baris2, HERO.baris2),
    tombol: text(value.tombol, HERO.tombol),
    tanggal: text(value.tanggal, HERO.tanggal),
    hitung: text(value.hitung, HERO.hitung),
    mulai: text(value.mulai, HERO.mulai),
    videoAktif: flag(value.videoAktif, HERO.videoAktif),
    youtube: text(value.youtube, HERO.youtube),
    tombolVideo: text(value.tombolVideo, HERO.tombolVideo),
    iklan: text(value.iklan, HERO.iklan),
  }
}

function parseBackground(value: unknown): BackgroundIsi | null {
  if (!isRecord(value)) return null
  return {
    heading: text(value.heading, BACKGROUND.heading),
    paragraf: texts(value.paragraf, BACKGROUND.paragraf),
    pilar: rows(value.pilar, (row) => ({
      icon: text(row.icon, ""),
      title: text(row.title, ""),
      desc: text(row.desc, ""),
    }), BACKGROUND.pilar),
  }
}

function parseTheme(value: unknown): ThemeIsi | null {
  if (!isRecord(value)) return null
  return {
    kicker: text(value.kicker, THEME.kicker),
    baris1: text(value.baris1, THEME.baris1),
    baris2: text(value.baris2, THEME.baris2),
    deskripsi: text(value.deskripsi, THEME.deskripsi),
    subtema: rows(value.subtema, (row) => ({
      num: text(row.num, ""),
      title: text(row.title, ""),
      sub: text(row.sub, ""),
      desc: text(row.desc, ""),
    }), THEME.subtema),
  }
}

function parseWelcome(value: unknown): WelcomeIsi | null {
  if (!isRecord(value)) return null
  return {
    orang: rows(value.orang, (row) => ({
      role: text(row.role, ""),
      name: text(row.name, ""),
      initial: text(row.initial, ""),
      message: text(row.message, ""),
    }), WELCOME.orang),
  }
}

function parseRundown(value: unknown): RundownIsi | null {
  if (!isRecord(value)) return null
  return {
    hari: rows(value.hari, (row) => ({
      date: text(row.date, ""),
      day: text(row.day, ""),
      items: rows(row.items, (item) => ({
        time: text(item.time, ""),
        activity: text(item.activity, ""),
      }), []),
    }), DEFAULT_RUNDOWN.hari),
  }
}

function parseSpeakers(value: unknown): SpeakersIsi | null {
  if (!isRecord(value)) return null
  return {
    pembicara: rows(value.pembicara, (row) => ({
      name: text(row.name, ""),
      role: text(row.role, ""),
      topic: text(row.topic, ""),
      initial: text(row.initial, ""),
    }), SPEAKERS.pembicara),
  }
}

function parseVenue(value: unknown): VenueIsi | null {
  if (!isRecord(value)) return null
  return {
    judulVenue: text(value.judulVenue, VENUE.judulVenue),
    nama: text(value.nama, VENUE.nama),
    peran: text(value.peran, VENUE.peran),
    alamat: text(value.alamat, VENUE.alamat),
    fasilitas: texts(value.fasilitas, VENUE.fasilitas),
    fakta: rows(value.fakta, (row) => ({ label: text(row.label, ""), value: text(row.value, "") }), VENUE.fakta),
    judulRute: text(value.judulRute, VENUE.judulRute),
    rute: rows(value.rute, (row) => ({
      icon: text(row.icon, ""),
      title: text(row.title, ""),
      desc: text(row.desc, ""),
    }), VENUE.rute),
  }
}

function parseAkomodasi(value: unknown): AkomodasiIsi | null {
  if (!isRecord(value)) return null
  return {
    hotel: rows(value.hotel, (row) => ({
      name: text(row.name, ""),
      type: text(row.type, ""),
      stars: typeof row.stars === "number" && row.stars >= 0 ? Math.min(5, Math.round(row.stars)) : 0,
      note: text(row.note, ""),
    }), AKOMODASI.hotel),
    transportJudul: text(value.transportJudul, AKOMODASI.transportJudul),
    transport: rows(value.transport, (row) => ({ title: text(row.title, ""), desc: text(row.desc, "") }), AKOMODASI.transport),
  }
}

function parseFaq(value: unknown): FaqIsi | null {
  if (!isRecord(value)) return null
  return {
    items: rows(value.items, (row) => ({ q: text(row.q, ""), a: text(row.a, "") }), FAQ.items),
  }
}

function parseDownloads(value: unknown): DownloadsIsi | null {
  if (!isRecord(value)) return null
  return {
    catatan: text(value.catatan, DOWNLOADS.catatan),
    berkas: rows(value.berkas, (row) => ({
      title: text(row.title, ""),
      type: text(row.type, "PDF"),
      size: text(row.size, ""),
      desc: text(row.desc, ""),
    }), DOWNLOADS.berkas),
  }
}

function parseRegistration(value: unknown): RegistrationIsi | null {
  if (!isRecord(value)) return null
  return {
    kicker: text(value.kicker, REGISTRATION.kicker),
    judulBaris1: text(value.judulBaris1, REGISTRATION.judulBaris1),
    judulBaris2: text(value.judulBaris2, REGISTRATION.judulBaris2),
    paragraf: text(value.paragraf, REGISTRATION.paragraf),
    statistik: rows(value.statistik, (row) => ({ label: text(row.label, ""), value: text(row.value, "") }), REGISTRATION.statistik),
    langkahJudul: text(value.langkahJudul, REGISTRATION.langkahJudul),
    langkah: rows(value.langkah, (row) => ({
      step: text(row.step, ""),
      title: text(row.title, ""),
      desc: text(row.desc, ""),
    }), REGISTRATION.langkah),
    panduanAktif: flag(value.panduanAktif, REGISTRATION.panduanAktif),
    panduanJudul: text(value.panduanJudul, REGISTRATION.panduanJudul),
    panduanAkunLabel: text(value.panduanAkunLabel, REGISTRATION.panduanAkunLabel),
    panduanAkunYoutube: text(value.panduanAkunYoutube, text(value.panduanYoutube, REGISTRATION.panduanAkunYoutube)),
    panduanPesertaLabel: text(value.panduanPesertaLabel, REGISTRATION.panduanPesertaLabel),
    panduanPesertaYoutube: text(value.panduanPesertaYoutube, REGISTRATION.panduanPesertaYoutube),
  }
}

function parseGallery(value: unknown): GalleryIsi | null {
  if (!isRecord(value)) return null
  return {
    kicker: text(value.kicker, GALLERY.kicker),
    judul: text(value.judul, GALLERY.judul),
    judulAksen: text(value.judulAksen, GALLERY.judulAksen),
    catatan: text(value.catatan, GALLERY.catatan),
    driveLabel: text(value.driveLabel, GALLERY.driveLabel),
    driveUrl: text(value.driveUrl, GALLERY.driveUrl),
    item: rows(value.item, (row) => ({ label: text(row.label, ""), bg: text(row.bg, "#505050"), foto: text(row.foto, "") }), GALLERY.item),
  }
}

function parseContact(value: unknown): ContactIsi | null {
  if (!isRecord(value)) return null
  return {
    kicker: text(value.kicker, CONTACT.kicker),
    judul: text(value.judul, CONTACT.judul),
    judulAksen: text(value.judulAksen, CONTACT.judulAksen),
    paragraf: text(value.paragraf, CONTACT.paragraf),
    saluran: rows(value.saluran, (row) => ({ label: text(row.label, ""), value: text(row.value, "") }), CONTACT.saluran),
    sosialJudul: text(value.sosialJudul, CONTACT.sosialJudul),
    sosial: parseSosial(value.sosial),
  }
}

function parseSosial(value: unknown) {
  if (!Array.isArray(value)) return CONTACT.sosial
  return value.flatMap((item) => {
    if (typeof item === "string") return [{ nama: item, link: "" }]
    if (!isRecord(item)) return []
    return [{ nama: text(item.nama, ""), link: text(item.link, "") }]
  })
}

function parseFooter(value: unknown): FooterIsi | null {
  if (!isRecord(value)) return null
  return {
    hakCipta: text(value.hakCipta, FOOTER.hakCipta),
    tambahan: text(value.tambahan, FOOTER.tambahan),
    lokasi: text(value.lokasi, FOOTER.lokasi),
  }
}

function def(kunci: string, menuId: string | null, judul: string, kind: KontenKind, isi: object, parse: (value: unknown) => object | null): KontenDef {
  return { kunci, menuId, judul, kind, isi, parse }
}

export const KONTEN: KontenDef[] = [
  def("home", "home", "Beranda", "body", HERO, parseHero),
  def("about", "about", "Judul About", "chrome", ABOUT_HEAD, (value) => parseHead(value, ABOUT_HEAD)),
  def("about.background", "about.background", "Latar belakang", "body", BACKGROUND, parseBackground),
  def("about.theme", "about.theme", "Tema", "body", THEME, parseTheme),
  def("about.welcome", "about.welcome", "Sambutan", "body", WELCOME, parseWelcome),
  def("schedule", "schedule", "Judul Jadwal", "chrome", SCHEDULE_HEAD, (value) => parseHead(value, SCHEDULE_HEAD)),
  def("schedule.rundown", "schedule.rundown", "Rundown", "body", DEFAULT_RUNDOWN, parseRundown),
  def("schedule.speakers", "schedule.speakers", "Pembicara", "body", SPEAKERS, parseSpeakers),
  def("schedule.venue", "schedule.venue", "Venue", "body", VENUE, parseVenue),
  def("information", "information", "Judul Informasi", "chrome", INFO_HEAD, (value) => parseHead(value, INFO_HEAD)),
  def("information.accommodation", "information.accommodation", "Akomodasi", "body", AKOMODASI, parseAkomodasi),
  def("information.faq", "information.faq", "FAQ", "body", FAQ, parseFaq),
  def("information.downloads", "information.downloads", "Unduhan", "body", DOWNLOADS, parseDownloads),
  def("registration", "registration", "Registrasi", "body", REGISTRATION, parseRegistration),
  def("gallery", "gallery", "Galeri", "body", GALLERY, parseGallery),
  def("contact", "contact", "Kontak", "body", CONTACT, parseContact),
  def("footer", null, "Footer", "chrome", FOOTER, parseFooter),
]

export function kontenDef(kunci: string) {
  const found = KONTEN.find((item) => item.kunci === kunci)
  if (!found) throw new Error(`Konten ${kunci} tidak dikenal.`)
  return found
}

export function cloneIsi<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const PARENT_SET = new Set<string>(PARENT_IDS)

export function projectNav(fromDb: boolean, menus: SiteMenu[], published: Set<string>) {
  const active = new Set(fromDb ? menus.filter((menu) => menu.aktif).map((menu) => menu.id) : DEFAULT_MENUS.map((menu) => menu.id))
  const byId = new Map((fromDb ? menus : DEFAULT_MENUS).map((menu) => [menu.id, menu]))
  const show = (id: string): boolean => {
    if (!fromDb) return true
    if (!active.has(id)) return false
    if (PARENT_SET.has(id)) return DEFAULT_MENUS.some((menu) => menu.indukId === id && show(menu.id))
    const item = KONTEN.find((entry) => entry.kunci === id)
    if (item?.kind === "body") return published.has(id)
    return true
  }
  const nav: NavItem[] = DEFAULT_MENUS.filter((menu) => !menu.indukId).flatMap((top) => {
    if (!show(top.id)) return []
    const row = byId.get(top.id) ?? top
    const sub = DEFAULT_MENUS.filter((menu) => menu.indukId === top.id && show(menu.id)).map((menu) => {
      const child = byId.get(menu.id) ?? menu
      return { label: child.label, tab: child.jangkar }
    })
    return [{ label: row.label, anchor: row.jangkar, sub: sub.length ? sub : undefined }]
  })
  const children = (parentId: string) => {
    const parent = DEFAULT_MENUS.find((menu) => menu.id === parentId)
    if (!parent) return []
    return nav.find((item) => item.anchor === parent.jangkar)?.sub ?? []
  }
  return { show, nav, children }
}

export function readKonten<T>(fromDb: boolean, blocks: Record<string, unknown>, kunci: string, fallback: T): T | null {
  const item = kontenDef(kunci)
  if (!fromDb) return fallback
  if (!(kunci in blocks)) return item.kind === "body" ? null : fallback
  return (item.parse(blocks[kunci]) as T | null) ?? fallback
}

export function isMissingSiteTable(error: { code?: string; message?: string } | null) {
  if (!error) return false
  return error.code === "PGRST205" || error.code === "42P01" || /situs_menu|situs_konten|schema cache/i.test(error.message ?? "")
}
