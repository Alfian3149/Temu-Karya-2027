import React, { useEffect, useState } from "react"
import { Banner, Field, PrimaryButton, inputStyle, smallBtn } from "@/Account"
import {
  DEFAULT_MENUS,
  KONTEN,
  cloneIsi,
  kontenDef,
  type AkomodasiIsi,
  type BackgroundIsi,
  type ContactIsi,
  type DownloadsIsi,
  type FaqIsi,
  type FooterIsi,
  type GalleryIsi,
  type HeroIsi,
  type RegistrationIsi,
  type RundownIsi,
  type SectionHead,
  type SiteMenu,
  type SpeakersIsi,
  type ThemeIsi,
  type VenueIsi,
  type WelcomeIsi,
} from "@/siteDefaults"
import { loadAdminSite, missingTableMessage, saveKonten, saveMenu } from "@/siteContent"

const BB = "'Barlow', sans-serif"
const BC = "'Barlow Condensed', sans-serif"
const O = "#FF6D00"

type Draft = { terbit: boolean; isi: object }

const fieldStyle: React.CSSProperties = { ...inputStyle, padding: "10px 12px" }
const areaStyle: React.CSSProperties = { ...fieldStyle, minHeight: 96, resize: "vertical" }
const ghost: React.CSSProperties = { ...smallBtn, color: "#ddd", background: "transparent", border: "1px solid #666" }
const danger: React.CSSProperties = { ...smallBtn, color: "#ff8a65", background: "transparent", border: "1px solid #ff8a65" }

function move<T>(items: T[], index: number, dir: -1 | 1) {
  const next = items.slice()
  const target = index + dir
  if (target < 0 || target >= next.length) return items
  const [row] = next.splice(index, 1)
  next.splice(target, 0, row)
  return next
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "none", border: "1px solid #555", color: on ? "#fff" : "#888", padding: "8px 12px", cursor: "pointer", fontFamily: BC, letterSpacing: 1, fontWeight: 700 }}>
      <span aria-hidden style={{ width: 36, height: 20, background: on ? O : "#444", position: "relative", flex: "none" }}>
        <span style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16, background: "#fff" }} />
      </span>
      {label}
    </button>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <input className="tks-input" style={fieldStyle} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}

function Area({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <textarea className="tks-input" style={areaStyle} value={value} onChange={(e) => onChange(e.target.value)} />
}

function Actions({ index, total, onMove, onRemove }: { index: number; total: number; onMove: (dir: -1 | 1) => void; onRemove: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      <button type="button" style={ghost} disabled={index === 0} onClick={() => onMove(-1)}>NAIK</button>
      <button type="button" style={ghost} disabled={index === total - 1} onClick={() => onMove(1)}>TURUN</button>
      <button type="button" style={danger} onClick={onRemove}>HAPUS</button>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid #4a4a4a", background: "#262626", padding: 16, marginBottom: 12 }}>{children}</div>
}

function StringList({ items, onChange, multiline }: { items: string[]; onChange: (items: string[]) => void; multiline?: boolean }) {
  return (
    <div>
      {items.map((item, index) => (
        <Card key={index}>
          {multiline ? <Area value={item} onChange={(value) => onChange(items.map((row, i) => i === index ? value : row))} /> : <TextInput value={item} onChange={(value) => onChange(items.map((row, i) => i === index ? value : row))} />}
          <Actions index={index} total={items.length} onMove={(dir) => onChange(move(items, index, dir))} onRemove={() => onChange(items.filter((_, i) => i !== index))} />
        </Card>
      ))}
      <button type="button" style={ghost} onClick={() => onChange([...items, ""])}>TAMBAH</button>
    </div>
  )
}

function HeadForm({ value, onChange }: { value: SectionHead; onChange: (value: SectionHead) => void }) {
  return (
    <>
      <Field label="Label kecil"><TextInput value={value.kicker} onChange={(kicker) => onChange({ ...value, kicker })} /></Field>
      <Field label="Judul"><TextInput value={value.judul} onChange={(judul) => onChange({ ...value, judul })} /></Field>
      <Field label="Judul aksen"><TextInput value={value.judulAksen} onChange={(judulAksen) => onChange({ ...value, judulAksen })} /></Field>
    </>
  )
}

function HeroForm({ value, onChange }: { value: HeroIsi; onChange: (value: HeroIsi) => void }) {
  return (
    <>
      <Field label="Judul"><TextInput value={value.judul} onChange={(judul) => onChange({ ...value, judul })} /></Field>
      <Field label="Baris keterangan 1"><TextInput value={value.baris1} onChange={(baris1) => onChange({ ...value, baris1 })} /></Field>
      <Field label="Baris keterangan 2"><TextInput value={value.baris2} onChange={(baris2) => onChange({ ...value, baris2 })} /></Field>
      <Field label="Teks tombol"><TextInput value={value.tombol} onChange={(tombol) => onChange({ ...value, tombol })} /></Field>
      <Field label="Label hitung mundur"><TextInput value={value.hitung} onChange={(hitung) => onChange({ ...value, hitung })} /></Field>
      <Field label="Mulai hitung mundur" hint="Format ISO, contoh 2027-07-14T08:00:00+07:00"><TextInput value={value.mulai} onChange={(mulai) => onChange({ ...value, mulai })} /></Field>
    </>
  )
}

function BackgroundForm({ value, onChange }: { value: BackgroundIsi; onChange: (value: BackgroundIsi) => void }) {
  return (
    <>
      <Field label="Judul bagian"><TextInput value={value.heading} onChange={(heading) => onChange({ ...value, heading })} /></Field>
      <Field label="Paragraf"><StringList multiline items={value.paragraf} onChange={(paragraf) => onChange({ ...value, paragraf })} /></Field>
      <Field label="Pilar">
        {value.pilar.map((item, index) => (
          <Card key={index}>
            <Field label="Ikon"><TextInput value={item.icon} onChange={(icon) => onChange({ ...value, pilar: value.pilar.map((row, i) => i === index ? { ...row, icon } : row) })} /></Field>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, pilar: value.pilar.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Keterangan"><Area value={item.desc} onChange={(desc) => onChange({ ...value, pilar: value.pilar.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.pilar.length} onMove={(dir) => onChange({ ...value, pilar: move(value.pilar, index, dir) })} onRemove={() => onChange({ ...value, pilar: value.pilar.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, pilar: [...value.pilar, { icon: "", title: "", desc: "" }] })}>TAMBAH PILAR</button>
      </Field>
    </>
  )
}

function ThemeForm({ value, onChange }: { value: ThemeIsi; onChange: (value: ThemeIsi) => void }) {
  return (
    <>
      <Field label="Label tema"><TextInput value={value.kicker} onChange={(kicker) => onChange({ ...value, kicker })} /></Field>
      <Field label="Baris tema 1"><TextInput value={value.baris1} onChange={(baris1) => onChange({ ...value, baris1 })} /></Field>
      <Field label="Baris tema 2"><TextInput value={value.baris2} onChange={(baris2) => onChange({ ...value, baris2 })} /></Field>
      <Field label="Deskripsi"><Area value={value.deskripsi} onChange={(deskripsi) => onChange({ ...value, deskripsi })} /></Field>
      <Field label="Sub-tema">
        {value.subtema.map((item, index) => (
          <Card key={index}>
            <Field label="Nomor"><TextInput value={item.num} onChange={(num) => onChange({ ...value, subtema: value.subtema.map((row, i) => i === index ? { ...row, num } : row) })} /></Field>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, subtema: value.subtema.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Subjudul"><TextInput value={item.sub} onChange={(sub) => onChange({ ...value, subtema: value.subtema.map((row, i) => i === index ? { ...row, sub } : row) })} /></Field>
            <Field label="Deskripsi"><Area value={item.desc} onChange={(desc) => onChange({ ...value, subtema: value.subtema.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.subtema.length} onMove={(dir) => onChange({ ...value, subtema: move(value.subtema, index, dir) })} onRemove={() => onChange({ ...value, subtema: value.subtema.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, subtema: [...value.subtema, { num: "", title: "", sub: "", desc: "" }] })}>TAMBAH SUB-TEMA</button>
      </Field>
    </>
  )
}

function WelcomeForm({ value, onChange }: { value: WelcomeIsi; onChange: (value: WelcomeIsi) => void }) {
  return (
    <Field label="Sambutan">
      {value.orang.map((item, index) => (
        <Card key={index}>
          <Field label="Nama"><TextInput value={item.name} onChange={(name) => onChange({ ...value, orang: value.orang.map((row, i) => i === index ? { ...row, name } : row) })} /></Field>
          <Field label="Jabatan"><TextInput value={item.role} onChange={(role) => onChange({ ...value, orang: value.orang.map((row, i) => i === index ? { ...row, role } : row) })} /></Field>
          <Field label="Inisial"><TextInput value={item.initial} onChange={(initial) => onChange({ ...value, orang: value.orang.map((row, i) => i === index ? { ...row, initial } : row) })} /></Field>
          <Field label="Pesan"><Area value={item.message} onChange={(message) => onChange({ ...value, orang: value.orang.map((row, i) => i === index ? { ...row, message } : row) })} /></Field>
          <Actions index={index} total={value.orang.length} onMove={(dir) => onChange({ ...value, orang: move(value.orang, index, dir) })} onRemove={() => onChange({ ...value, orang: value.orang.filter((_, i) => i !== index) })} />
        </Card>
      ))}
      <button type="button" style={ghost} onClick={() => onChange({ ...value, orang: [...value.orang, { name: "", role: "", initial: "", message: "" }] })}>TAMBAH SAMBUTAN</button>
    </Field>
  )
}

function RundownForm({ value, onChange }: { value: RundownIsi; onChange: (value: RundownIsi) => void }) {
  const setDay = (index: number, day: RundownIsi["hari"][number]) => onChange({ hari: value.hari.map((row, i) => i === index ? day : row) })
  return (
    <Field label="Hari kegiatan">
      {value.hari.map((day, index) => (
        <Card key={index}>
          <Field label="Nama hari"><TextInput value={day.day} onChange={(name) => setDay(index, { ...day, day: name })} /></Field>
          <Field label="Tanggal"><TextInput value={day.date} onChange={(date) => setDay(index, { ...day, date })} /></Field>
          {day.items.map((item, itemIndex) => (
            <div key={itemIndex} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 8, marginBottom: 8 }}>
              <TextInput value={item.time} onChange={(time) => setDay(index, { ...day, items: day.items.map((row, i) => i === itemIndex ? { ...row, time } : row) })} />
              <TextInput value={item.activity} onChange={(activity) => setDay(index, { ...day, items: day.items.map((row, i) => i === itemIndex ? { ...row, activity } : row) })} />
              <button type="button" style={danger} onClick={() => setDay(index, { ...day, items: day.items.filter((_, i) => i !== itemIndex) })}>HAPUS</button>
            </div>
          ))}
          <button type="button" style={{ ...ghost, marginBottom: 8 }} onClick={() => setDay(index, { ...day, items: [...day.items, { time: "", activity: "" }] })}>TAMBAH KEGIATAN</button>
          <Actions index={index} total={value.hari.length} onMove={(dir) => onChange({ hari: move(value.hari, index, dir) })} onRemove={() => onChange({ hari: value.hari.filter((_, i) => i !== index) })} />
        </Card>
      ))}
      <button type="button" style={ghost} onClick={() => onChange({ hari: [...value.hari, { day: "", date: "", items: [] }] })}>TAMBAH HARI</button>
    </Field>
  )
}

function SpeakersForm({ value, onChange }: { value: SpeakersIsi; onChange: (value: SpeakersIsi) => void }) {
  return (
    <Field label="Pembicara">
      {value.pembicara.map((item, index) => (
        <Card key={index}>
          <Field label="Nama"><TextInput value={item.name} onChange={(name) => onChange({ pembicara: value.pembicara.map((row, i) => i === index ? { ...row, name } : row) })} /></Field>
          <Field label="Peran"><TextInput value={item.role} onChange={(role) => onChange({ pembicara: value.pembicara.map((row, i) => i === index ? { ...row, role } : row) })} /></Field>
          <Field label="Inisial"><TextInput value={item.initial} onChange={(initial) => onChange({ pembicara: value.pembicara.map((row, i) => i === index ? { ...row, initial } : row) })} /></Field>
          <Field label="Topik"><Area value={item.topic} onChange={(topic) => onChange({ pembicara: value.pembicara.map((row, i) => i === index ? { ...row, topic } : row) })} /></Field>
          <Actions index={index} total={value.pembicara.length} onMove={(dir) => onChange({ pembicara: move(value.pembicara, index, dir) })} onRemove={() => onChange({ pembicara: value.pembicara.filter((_, i) => i !== index) })} />
        </Card>
      ))}
      <button type="button" style={ghost} onClick={() => onChange({ pembicara: [...value.pembicara, { name: "", role: "", topic: "", initial: "" }] })}>TAMBAH PEMBICARA</button>
    </Field>
  )
}

function VenueForm({ value, onChange }: { value: VenueIsi; onChange: (value: VenueIsi) => void }) {
  return (
    <>
      <Field label="Judul venue"><TextInput value={value.judulVenue} onChange={(judulVenue) => onChange({ ...value, judulVenue })} /></Field>
      <Field label="Nama venue"><TextInput value={value.nama} onChange={(nama) => onChange({ ...value, nama })} /></Field>
      <Field label="Peran venue"><TextInput value={value.peran} onChange={(peran) => onChange({ ...value, peran })} /></Field>
      <Field label="Alamat"><Area value={value.alamat} onChange={(alamat) => onChange({ ...value, alamat })} /></Field>
      <Field label="Fasilitas"><StringList items={value.fasilitas} onChange={(fasilitas) => onChange({ ...value, fasilitas })} /></Field>
      <Field label="Fakta">
        {value.fakta.map((item, index) => (
          <Card key={index}>
            <Field label="Label"><TextInput value={item.label} onChange={(label) => onChange({ ...value, fakta: value.fakta.map((row, i) => i === index ? { ...row, label } : row) })} /></Field>
            <Field label="Nilai"><TextInput value={item.value} onChange={(next) => onChange({ ...value, fakta: value.fakta.map((row, i) => i === index ? { ...row, value: next } : row) })} /></Field>
            <Actions index={index} total={value.fakta.length} onMove={(dir) => onChange({ ...value, fakta: move(value.fakta, index, dir) })} onRemove={() => onChange({ ...value, fakta: value.fakta.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, fakta: [...value.fakta, { label: "", value: "" }] })}>TAMBAH FAKTA</button>
      </Field>
      <Field label="Judul rute"><TextInput value={value.judulRute} onChange={(judulRute) => onChange({ ...value, judulRute })} /></Field>
      <Field label="Rute">
        {value.rute.map((item, index) => (
          <Card key={index}>
            <Field label="Ikon"><TextInput value={item.icon} onChange={(icon) => onChange({ ...value, rute: value.rute.map((row, i) => i === index ? { ...row, icon } : row) })} /></Field>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, rute: value.rute.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Keterangan"><Area value={item.desc} onChange={(desc) => onChange({ ...value, rute: value.rute.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.rute.length} onMove={(dir) => onChange({ ...value, rute: move(value.rute, index, dir) })} onRemove={() => onChange({ ...value, rute: value.rute.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, rute: [...value.rute, { icon: "", title: "", desc: "" }] })}>TAMBAH RUTE</button>
      </Field>
    </>
  )
}

function StayForm({ value, onChange }: { value: AkomodasiIsi; onChange: (value: AkomodasiIsi) => void }) {
  return (
    <>
      <Field label="Hotel">
        {value.hotel.map((item, index) => (
          <Card key={index}>
            <Field label="Nama"><TextInput value={item.name} onChange={(name) => onChange({ ...value, hotel: value.hotel.map((row, i) => i === index ? { ...row, name } : row) })} /></Field>
            <Field label="Jenis"><TextInput value={item.type} onChange={(type) => onChange({ ...value, hotel: value.hotel.map((row, i) => i === index ? { ...row, type } : row) })} /></Field>
            <Field label="Bintang" hint="Angka 0 sampai 5"><TextInput value={String(item.stars)} onChange={(stars) => onChange({ ...value, hotel: value.hotel.map((row, i) => i === index ? { ...row, stars: Math.max(0, Math.min(5, Number(stars) || 0)) } : row) })} /></Field>
            <Field label="Catatan"><Area value={item.note} onChange={(note) => onChange({ ...value, hotel: value.hotel.map((row, i) => i === index ? { ...row, note } : row) })} /></Field>
            <Actions index={index} total={value.hotel.length} onMove={(dir) => onChange({ ...value, hotel: move(value.hotel, index, dir) })} onRemove={() => onChange({ ...value, hotel: value.hotel.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, hotel: [...value.hotel, { name: "", type: "", stars: 0, note: "" }] })}>TAMBAH HOTEL</button>
      </Field>
      <Field label="Judul transportasi"><TextInput value={value.transportJudul} onChange={(transportJudul) => onChange({ ...value, transportJudul })} /></Field>
      <Field label="Transportasi lokal">
        {value.transport.map((item, index) => (
          <Card key={index}>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, transport: value.transport.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Keterangan"><Area value={item.desc} onChange={(desc) => onChange({ ...value, transport: value.transport.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.transport.length} onMove={(dir) => onChange({ ...value, transport: move(value.transport, index, dir) })} onRemove={() => onChange({ ...value, transport: value.transport.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, transport: [...value.transport, { title: "", desc: "" }] })}>TAMBAH TRANSPORTASI</button>
      </Field>
    </>
  )
}

function FaqForm({ value, onChange }: { value: FaqIsi; onChange: (value: FaqIsi) => void }) {
  return (
    <Field label="Pertanyaan">
      {value.items.map((item, index) => (
        <Card key={index}>
          <Field label="Pertanyaan"><TextInput value={item.q} onChange={(q) => onChange({ items: value.items.map((row, i) => i === index ? { ...row, q } : row) })} /></Field>
          <Field label="Jawaban"><Area value={item.a} onChange={(a) => onChange({ items: value.items.map((row, i) => i === index ? { ...row, a } : row) })} /></Field>
          <Actions index={index} total={value.items.length} onMove={(dir) => onChange({ items: move(value.items, index, dir) })} onRemove={() => onChange({ items: value.items.filter((_, i) => i !== index) })} />
        </Card>
      ))}
      <button type="button" style={ghost} onClick={() => onChange({ items: [...value.items, { q: "", a: "" }] })}>TAMBAH FAQ</button>
    </Field>
  )
}

function DownloadsForm({ value, onChange }: { value: DownloadsIsi; onChange: (value: DownloadsIsi) => void }) {
  return (
    <>
      <Field label="Catatan"><Area value={value.catatan} onChange={(catatan) => onChange({ ...value, catatan })} /></Field>
      <Field label="Daftar berkas cadangan" hint="Dipakai bila belum ada dokumen publik di tab Dokumen. Berkas yang sudah diunggah tetap tampil dari portal dokumen.">
        {value.berkas.map((item, index) => (
          <Card key={index}>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, berkas: value.berkas.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Jenis"><TextInput value={item.type} onChange={(type) => onChange({ ...value, berkas: value.berkas.map((row, i) => i === index ? { ...row, type } : row) })} /></Field>
            <Field label="Ukuran"><TextInput value={item.size} onChange={(size) => onChange({ ...value, berkas: value.berkas.map((row, i) => i === index ? { ...row, size } : row) })} /></Field>
            <Field label="Deskripsi"><Area value={item.desc} onChange={(desc) => onChange({ ...value, berkas: value.berkas.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.berkas.length} onMove={(dir) => onChange({ ...value, berkas: move(value.berkas, index, dir) })} onRemove={() => onChange({ ...value, berkas: value.berkas.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, berkas: [...value.berkas, { title: "", type: "PDF", size: "", desc: "" }] })}>TAMBAH BERKAS</button>
      </Field>
    </>
  )
}

function RegistrationForm({ value, onChange }: { value: RegistrationIsi; onChange: (value: RegistrationIsi) => void }) {
  return (
    <>
      <Field label="Label kecil"><TextInput value={value.kicker} onChange={(kicker) => onChange({ ...value, kicker })} /></Field>
      <Field label="Judul baris 1"><TextInput value={value.judulBaris1} onChange={(judulBaris1) => onChange({ ...value, judulBaris1 })} /></Field>
      <Field label="Judul baris 2"><TextInput value={value.judulBaris2} onChange={(judulBaris2) => onChange({ ...value, judulBaris2 })} /></Field>
      <Field label="Paragraf"><Area value={value.paragraf} onChange={(paragraf) => onChange({ ...value, paragraf })} /></Field>
      <Field label="Angka ringkas" hint="Teks tampilan di halaman publik. Nominal tagihan peserta tetap mengikuti biaya pendaftaran di sistem.">
        {value.statistik.map((item, index) => (
          <Card key={index}>
            <Field label="Label"><TextInput value={item.label} onChange={(label) => onChange({ ...value, statistik: value.statistik.map((row, i) => i === index ? { ...row, label } : row) })} /></Field>
            <Field label="Nilai"><TextInput value={item.value} onChange={(next) => onChange({ ...value, statistik: value.statistik.map((row, i) => i === index ? { ...row, value: next } : row) })} /></Field>
            <Actions index={index} total={value.statistik.length} onMove={(dir) => onChange({ ...value, statistik: move(value.statistik, index, dir) })} onRemove={() => onChange({ ...value, statistik: value.statistik.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, statistik: [...value.statistik, { label: "", value: "" }] })}>TAMBAH ANGKA</button>
      </Field>
      <Field label="Judul langkah"><TextInput value={value.langkahJudul} onChange={(langkahJudul) => onChange({ ...value, langkahJudul })} /></Field>
      <Field label="Langkah">
        {value.langkah.map((item, index) => (
          <Card key={index}>
            <Field label="Nomor"><TextInput value={item.step} onChange={(step) => onChange({ ...value, langkah: value.langkah.map((row, i) => i === index ? { ...row, step } : row) })} /></Field>
            <Field label="Judul"><TextInput value={item.title} onChange={(title) => onChange({ ...value, langkah: value.langkah.map((row, i) => i === index ? { ...row, title } : row) })} /></Field>
            <Field label="Keterangan"><Area value={item.desc} onChange={(desc) => onChange({ ...value, langkah: value.langkah.map((row, i) => i === index ? { ...row, desc } : row) })} /></Field>
            <Actions index={index} total={value.langkah.length} onMove={(dir) => onChange({ ...value, langkah: move(value.langkah, index, dir) })} onRemove={() => onChange({ ...value, langkah: value.langkah.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, langkah: [...value.langkah, { step: "", title: "", desc: "" }] })}>TAMBAH LANGKAH</button>
      </Field>
    </>
  )
}

function GalleryForm({ value, onChange }: { value: GalleryIsi; onChange: (value: GalleryIsi) => void }) {
  return (
    <>
      <HeadForm value={{ kicker: value.kicker, judul: value.judul, judulAksen: value.judulAksen }} onChange={(head) => onChange({ ...value, ...head })} />
      <Field label="Catatan"><Area value={value.catatan} onChange={(catatan) => onChange({ ...value, catatan })} /></Field>
      <Field label="Kotak galeri" hint="Foto pada kotak 1 dan 3 tetap dari berkas situs. Yang diubah di sini adalah judul dan warna latar.">
        {value.item.map((item, index) => (
          <Card key={index}>
            <Field label="Judul"><TextInput value={item.label} onChange={(label) => onChange({ ...value, item: value.item.map((row, i) => i === index ? { ...row, label } : row) })} /></Field>
            <Field label="Warna latar" hint="Kode warna, contoh #505050"><TextInput value={item.bg} onChange={(bg) => onChange({ ...value, item: value.item.map((row, i) => i === index ? { ...row, bg } : row) })} /></Field>
            <Actions index={index} total={value.item.length} onMove={(dir) => onChange({ ...value, item: move(value.item, index, dir) })} onRemove={() => onChange({ ...value, item: value.item.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, item: [...value.item, { label: "", bg: "#505050" }] })}>TAMBAH KOTAK</button>
      </Field>
    </>
  )
}

function ContactForm({ value, onChange }: { value: ContactIsi; onChange: (value: ContactIsi) => void }) {
  return (
    <>
      <HeadForm value={{ kicker: value.kicker, judul: value.judul, judulAksen: value.judulAksen }} onChange={(head) => onChange({ ...value, ...head })} />
      <Field label="Paragraf"><Area value={value.paragraf} onChange={(paragraf) => onChange({ ...value, paragraf })} /></Field>
      <Field label="Saluran">
        {value.saluran.map((item, index) => (
          <Card key={index}>
            <Field label="Label"><TextInput value={item.label} onChange={(label) => onChange({ ...value, saluran: value.saluran.map((row, i) => i === index ? { ...row, label } : row) })} /></Field>
            <Field label="Nilai"><TextInput value={item.value} onChange={(next) => onChange({ ...value, saluran: value.saluran.map((row, i) => i === index ? { ...row, value: next } : row) })} /></Field>
            <Actions index={index} total={value.saluran.length} onMove={(dir) => onChange({ ...value, saluran: move(value.saluran, index, dir) })} onRemove={() => onChange({ ...value, saluran: value.saluran.filter((_, i) => i !== index) })} />
          </Card>
        ))}
        <button type="button" style={ghost} onClick={() => onChange({ ...value, saluran: [...value.saluran, { label: "", value: "" }] })}>TAMBAH SALURAN</button>
      </Field>
      <Field label="Judul media sosial"><TextInput value={value.sosialJudul} onChange={(sosialJudul) => onChange({ ...value, sosialJudul })} /></Field>
      <Field label="Media sosial"><StringList items={value.sosial} onChange={(sosial) => onChange({ ...value, sosial })} /></Field>
    </>
  )
}

function FooterForm({ value, onChange }: { value: FooterIsi; onChange: (value: FooterIsi) => void }) {
  return (
    <>
      <Field label="Hak cipta"><TextInput value={value.hakCipta} onChange={(hakCipta) => onChange({ ...value, hakCipta })} /></Field>
      <Field label="Baris tambahan"><TextInput value={value.tambahan} onChange={(tambahan) => onChange({ ...value, tambahan })} /></Field>
      <Field label="Lokasi dan tanggal"><TextInput value={value.lokasi} onChange={(lokasi) => onChange({ ...value, lokasi })} /></Field>
    </>
  )
}

function ContentFields({ kunci, isi, onChange }: { kunci: string; isi: object; onChange: (isi: object) => void }) {
  switch (kunci) {
    case "home": return <HeroForm value={isi as HeroIsi} onChange={onChange} />
    case "about":
    case "schedule":
    case "information": return <HeadForm value={isi as SectionHead} onChange={onChange} />
    case "about.background": return <BackgroundForm value={isi as BackgroundIsi} onChange={onChange} />
    case "about.theme": return <ThemeForm value={isi as ThemeIsi} onChange={onChange} />
    case "about.welcome": return <WelcomeForm value={isi as WelcomeIsi} onChange={onChange} />
    case "schedule.rundown": return <RundownForm value={isi as RundownIsi} onChange={onChange} />
    case "schedule.speakers": return <SpeakersForm value={isi as SpeakersIsi} onChange={onChange} />
    case "schedule.venue": return <VenueForm value={isi as VenueIsi} onChange={onChange} />
    case "information.accommodation": return <StayForm value={isi as AkomodasiIsi} onChange={onChange} />
    case "information.faq": return <FaqForm value={isi as FaqIsi} onChange={onChange} />
    case "information.downloads": return <DownloadsForm value={isi as DownloadsIsi} onChange={onChange} />
    case "registration": return <RegistrationForm value={isi as RegistrationIsi} onChange={onChange} />
    case "gallery": return <GalleryForm value={isi as GalleryIsi} onChange={onChange} />
    case "contact": return <ContactForm value={isi as ContactIsi} onChange={onChange} />
    case "footer": return <FooterForm value={isi as FooterIsi} onChange={onChange} />
    default: return null
  }
}

function mergeMenus(loaded: SiteMenu[]) {
  return DEFAULT_MENUS.map((item) => {
    const row = loaded.find((menu) => menu.id === item.id)
    return row ? { ...item, label: row.label, aktif: row.aktif } : { ...item }
  })
}

function draftsFrom(rows: { kunci: string; isi: unknown; terbit: boolean }[]) {
  return Object.fromEntries(KONTEN.map((item) => {
    const row = rows.find((entry) => entry.kunci === item.kunci)
    const parsed = row ? item.parse(row.isi) : null
    return [item.kunci, { terbit: row?.terbit ?? true, isi: cloneIsi(parsed ?? item.isi) }]
  })) as Record<string, Draft>
}

export function SiteAdmin() {
  const [menus, setMenus] = useState<SiteMenu[]>(DEFAULT_MENUS)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFrom([]))
  const [pick, setPick] = useState("menu")
  const [err, setErr] = useState("")
  const [ok, setOk] = useState("")
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    setErr("")
    const data = await loadAdminSite()
    setMenus(mergeMenus(data.menus))
    setDrafts(draftsFrom(data.konten))
  }

  useEffect(() => {
    void refresh().catch((error: Error) => setErr(error.message || missingTableMessage())).finally(() => setLoading(false))
  }, [])

  const saveMenus = async () => {
    setBusy(true)
    setErr("")
    setOk("")
    try {
      const cleaned = menus.map((menu) => ({ ...menu, label: menu.label.trim() }))
      if (cleaned.some((menu) => !menu.label)) throw new Error("Label menu tidak boleh kosong.")
      for (const menu of cleaned) await saveMenu(menu)
      setMenus(cleaned)
      setOk("Menu disimpan. Pengunjung melihat menu yang aktif.")
    } catch (error) {
      setErr((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const saveDraft = async (kunci: string) => {
    const draft = drafts[kunci]
    if (!draft) return
    setBusy(true)
    setErr("")
    setOk("")
    try {
      await saveKonten(kunci, draft.isi, draft.terbit)
      setOk("Konten disimpan. Pengunjung melihat konten yang diterbitkan.")
    } catch (error) {
      setErr((error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const draft = drafts[pick]
  const definition = KONTEN.find((item) => item.kunci === pick)

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, letterSpacing: 1, color: "#fff", margin: "0 0 8px" }}>SITUS PUBLIK</h2>
      <p style={{ fontFamily: BB, fontSize: 14, color: "#aaa", lineHeight: 1.6, marginTop: 0 }}>
        Hanya superuser yang dapat mengubah menu dan teks halaman publik. Bagian tampil bila menunya aktif dan kontennya diterbitkan. Judul bagian serta footer memakai teks bawaan bila belum diterbitkan.
      </p>
      {err && <Banner tone="error">{err}</Banner>}
      {ok && <Banner tone="ok">{ok}</Banner>}
      {loading ? <div style={{ fontFamily: BB, color: "#aaa" }}>Memuat pengaturan situs…</div> : (
        <>
          <Field label="Yang diubah">
            <select className="tks-input" style={fieldStyle} value={pick} onChange={(e) => { setPick(e.target.value); setOk(""); setErr("") }}>
              <option value="menu">Menu dan submenu</option>
              {KONTEN.map((item) => <option key={item.kunci} value={item.kunci}>{item.judul}</option>)}
            </select>
          </Field>

          {pick === "menu" ? (
            <div>
              {menus.map((menu) => (
                <div key={menu.id} style={{ display: "grid", gridTemplateColumns: menu.indukId ? "28px 1fr" : "1fr", gap: 8, marginBottom: 10 }}>
                  {menu.indukId && <span />}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", border: "1px solid #4a4a4a", padding: 12, background: "#262626" }}>
                    <Switch on={menu.aktif} label={menu.aktif ? "AKTIF" : "NONAKTIF"} onChange={(aktif) => setMenus(menus.map((row) => row.id === menu.id ? { ...row, aktif } : row))} />
                    <input className="tks-input" aria-label={`Label ${menu.id}`} style={{ ...fieldStyle, flex: 1, minWidth: 180 }} value={menu.label} onChange={(e) => setMenus(menus.map((row) => row.id === menu.id ? { ...row, label: e.target.value } : row))} />
                  </div>
                </div>
              ))}
              <PrimaryButton type="button" style={{ width: "auto", marginTop: 8 }} disabled={busy} onClick={() => void saveMenus()}>{busy ? "MENYIMPAN…" : "SIMPAN MENU"}</PrimaryButton>
            </div>
          ) : definition && draft ? (
            <div>
              <div style={{ marginBottom: 18 }}>
                <Switch
                  on={draft.terbit}
                  label={draft.terbit ? "DITERBITKAN" : "TIDAK DITERBITKAN"}
                  onChange={(terbit) => setDrafts({ ...drafts, [pick]: { ...draft, terbit } })}
                />
              </div>
              {definition.kind === "chrome" && (
                <p style={{ fontFamily: BB, fontSize: 13, color: "#888", marginTop: 0 }}>Kalau tidak diterbitkan, halaman memakai teks bawaan untuk bagian ini.</p>
              )}
              <ContentFields kunci={pick} isi={draft.isi} onChange={(isi) => setDrafts({ ...drafts, [pick]: { ...draft, isi } })} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                <PrimaryButton type="button" style={{ width: "auto" }} disabled={busy} onClick={() => void saveDraft(pick)}>{busy ? "MENYIMPAN…" : "SIMPAN KONTEN"}</PrimaryButton>
                <button type="button" style={ghost} onClick={() => setDrafts({ ...drafts, [pick]: { terbit: true, isi: cloneIsi(kontenDef(pick).isi) } })}>TEKS BAWAAN</button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
