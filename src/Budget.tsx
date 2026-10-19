import React, { useState } from "react"
import {
  read,
  write,
  randomId,
  Field,
  PrimaryButton,
  Chip,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  rupiah,
  type FileInfo,
  type User,
} from "@/Account"
import { ProofPicker, ProofLinks, ReportPrint } from "@/Finance"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export const BUDGET_KEY = "tks27_budgets"
export const BIDANG = ["Panitia Inti", "Sekretariat", "Bendahara", "Acara & Ibadah", "Perlombaan", "Registrasi", "Akomodasi", "Transportasi", "Konsumsi", "Perlengkapan & Dekorasi", "Dokumentasi & Publikasi", "Kesehatan", "Keamanan", "Humas & Sponsor", "Lainnya"]
export const BUDGET_KAT = ["Honorarium & Transport Pembicara", "Akomodasi", "Transportasi", "Konsumsi", "Sewa Tempat & Peralatan", "Perlengkapan & ATK", "Cetak & Publikasi", "Dekorasi", "Hadiah & Piagam", "Dokumentasi", "Kesehatan", "Lain-lain"]
export const SATUAN = ["unit", "paket", "orang", "hari", "malam", "kali", "lembar", "buah", "set", "bulan"]
const STATUSES = ["Draf", "Diajukan", "Revisi", "Disetujui", "Disetujui Sebagian", "Ditolak"] as const
type BStatus = (typeof STATUSES)[number]

type Item = { id: string; uraian: string; kategori: string; qty: number; satuan: string; harga: number }
type Review = { by: string; at: string; aksi: string; catatan: string; jumlah?: number }
export type Budget = {
  id: string
  nomor: string
  judul: string
  bidang: string
  tujuan: string
  tglKegiatan: string
  tglButuh: string
  items: Item[]
  kontingensi: number
  lampiran: FileInfo[]
  status: BStatus
  pengaju: string
  pengajuEmail: string
  createdAt: string
  disetujui?: number
  reviews: Review[]
}

const list = () => read<Budget[]>(BUDGET_KEY, []).map((b) => ({ ...b, lampiran: b.lampiran ?? [], reviews: b.reviews ?? [] }))
const subtotal = (b: Pick<Budget, "items">) => b.items.reduce((n, i) => n + i.qty * i.harga, 0)
const kontin = (b: Pick<Budget, "items" | "kontingensi">) => Math.round((subtotal(b) * b.kontingensi) / 100)
export const totalOf = (b: Pick<Budget, "items" | "kontingensi">) => subtotal(b) + kontin(b)
const save = (b: Budget) => {
  const all = list()
  write(BUDGET_KEY, all.some((x) => x.id === b.id) ? all.map((x) => (x.id === b.id ? b : x)) : [...all, b])
}

export function budgetStats() {
  const all = list()
  return {
    menunggu: all.filter((b) => b.status === "Diajukan").length,
    disetujui: all.filter((b) => b.status === "Disetujui" || b.status === "Disetujui Sebagian").reduce((n, b) => n + (b.disetujui ?? 0), 0),
    diajukan: all.filter((b) => b.status !== "Draf").reduce((n, b) => n + totalOf(b), 0),
    revisi: (email: string) => all.filter((b) => b.status === "Revisi" && b.pengajuEmail === email).length,
  }
}

const tone = (s: BStatus) => (s === "Disetujui" ? "green" : s === "Ditolak" ? "red" : s === "Draf" ? "gray" : "orange") as "green" | "red" | "gray" | "orange"
const ghost: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }
const solid: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }
const dateStyle = { ...inputStyle, colorScheme: "dark" } as React.CSSProperties
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)
const num = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0)

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Form ───────────────────────────────────────────────────────────────────────
type Row = { id: string; uraian: string; kategori: string; qty: string; satuan: string; harga: string }
const blankRow = (): Row => ({ id: randomId(), uraian: "", kategori: BUDGET_KAT[0], qty: "1", satuan: "unit", harga: "" })

function BudgetForm({ initial, me, onDone, onCancel }: { initial: Budget | null; me: User; onDone: (id: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    judul: initial?.judul ?? "",
    bidang: initial?.bidang ?? "",
    tujuan: initial?.tujuan ?? "",
    tglKegiatan: initial?.tglKegiatan ?? "",
    tglButuh: initial?.tglButuh ?? "",
    kontingensi: String(initial?.kontingensi ?? 0),
  })
  const [rows, setRows] = useState<Row[]>(initial?.items.map((i) => ({ id: i.id, uraian: i.uraian, kategori: i.kategori, qty: String(i.qty), satuan: i.satuan, harga: String(i.harga) })) ?? [blankRow()])
  const [files, setFiles] = useState<FileInfo[]>(initial?.lampiran ?? [])
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const setRow = (id: string, k: keyof Row, v: string) => setRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)))

  const items: Item[] = rows.map((r) => ({ id: r.id, uraian: r.uraian.trim(), kategori: r.kategori, qty: num(r.qty), satuan: r.satuan, harga: num(r.harga) }))
  const draft = { items, kontingensi: Number(f.kontingensi) }
  const sub = subtotal(draft)

  const submit = (send: boolean) => {
    const er: Record<string, string> = {}
    if (f.judul.trim().length < 3) er.judul = "Isi nama kegiatan / pos anggaran."
    if (!f.bidang) er.bidang = "Pilih bidang."
    if (f.tujuan.trim().length < 5) er.tujuan = "Jelaskan tujuan dan kebutuhan."
    if (!f.tglButuh) er.tglButuh = "Isi tanggal dana dibutuhkan."
    if (items.some((i) => !i.uraian || i.qty <= 0 || i.harga <= 0)) er.items = "Setiap rincian harus punya uraian, jumlah, dan harga lebih dari 0."
    setErrs(er)
    if (Object.keys(er).length) return
    const all = list()
    const year = new Date().getFullYear()
    const b: Budget = {
      id: initial?.id ?? randomId(),
      nomor: initial?.nomor ?? `BGT/${String(all.filter((x) => x.nomor.endsWith(`/${year}`)).length + 1).padStart(3, "0")}/${year}`,
      judul: f.judul.trim(),
      bidang: f.bidang,
      tujuan: f.tujuan.trim(),
      tglKegiatan: f.tglKegiatan,
      tglButuh: f.tglButuh,
      items,
      kontingensi: Number(f.kontingensi),
      lampiran: files,
      status: send ? "Diajukan" : initial?.status === "Revisi" ? "Revisi" : "Draf",
      pengaju: initial?.pengaju ?? me.name,
      pengajuEmail: initial?.pengajuEmail ?? me.email,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      reviews: [...(initial?.reviews ?? []), ...(send ? [{ by: me.name, at: new Date().toISOString(), aksi: initial?.status === "Revisi" ? "Mengajukan ulang" : "Mengajukan", catatan: "" }] : [])],
    }
    save(b)
    onDone(b.id)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(true) }} noValidate style={{ ...cardStyle, padding: 24, maxWidth: 900 }}>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: 1, margin: "0 0 20px" }}>{initial ? `UBAH ${initial.nomor}` : "PENGAJUAN ANGGARAN BARU"}</h2>
      <Field label="Nama Kegiatan / Pos Anggaran" htmlFor="b-judul" error={errs.judul}><input id="b-judul" className="tks-input" style={inputStyle} value={f.judul} onChange={(e) => set("judul", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Bidang / Seksi Pengaju" htmlFor="b-bidang" error={errs.bidang}>
          <select id="b-bidang" className="tks-input" style={inputStyle} value={f.bidang} onChange={(e) => set("bidang", e.target.value)}><option value="">Pilih bidang…</option>{BIDANG.map((b) => <option key={b}>{b}</option>)}</select>
        </Field>
        <Field label="Tanggal Pelaksanaan Kegiatan" htmlFor="b-tgl"><input id="b-tgl" type="date" className="tks-input" style={dateStyle} value={f.tglKegiatan} onChange={(e) => set("tglKegiatan", e.target.value)} /></Field>
        <Field label="Dana Dibutuhkan Paling Lambat" htmlFor="b-butuh" error={errs.tglButuh}><input id="b-butuh" type="date" className="tks-input" style={dateStyle} value={f.tglButuh} onChange={(e) => set("tglButuh", e.target.value)} /></Field>
        <Field label="Cadangan / Kontingensi" htmlFor="b-kon" hint="Persentase dari subtotal untuk biaya tak terduga.">
          <select id="b-kon" className="tks-input" style={inputStyle} value={f.kontingensi} onChange={(e) => set("kontingensi", e.target.value)}>{[0, 2, 5, 10].map((n) => <option key={n} value={n}>{n}%</option>)}</select>
        </Field>
      </div>
      <Field label="Tujuan & Justifikasi Kebutuhan" htmlFor="b-tujuan" error={errs.tujuan}><textarea id="b-tujuan" rows={3} className="tks-input" style={{ ...inputStyle, resize: "vertical" }} value={f.tujuan} onChange={(e) => set("tujuan", e.target.value)} /></Field>

      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, margin: "8px 0 10px" }}>RINCIAN ANGGARAN (RAB)</div>
      {errs.items && <div role="alert" style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", marginBottom: 8 }}>{errs.items}</div>}
      <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
        {rows.map((r, idx) => {
          const q = num(r.qty), h = num(r.harga)
          return (
            <div key={r.id} style={{ border: "1px solid #555", background: "#222", padding: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr", gap: 10 }} className="card-grid">
                <input aria-label={`Uraian ${idx + 1}`} placeholder="Uraian barang / jasa" className="tks-input" style={inputStyle} value={r.uraian} onChange={(e) => setRow(r.id, "uraian", e.target.value)} />
                <select aria-label={`Kategori ${idx + 1}`} className="tks-input" style={inputStyle} value={r.kategori} onChange={(e) => setRow(r.id, "kategori", e.target.value)}>{BUDGET_KAT.map((k) => <option key={k}>{k}</option>)}</select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginTop: 10, alignItems: "center" }}>
                <input aria-label={`Jumlah ${idx + 1}`} inputMode="decimal" placeholder="Jumlah" className="tks-input" style={inputStyle} value={r.qty} onChange={(e) => setRow(r.id, "qty", e.target.value)} />
                <select aria-label={`Satuan ${idx + 1}`} className="tks-input" style={inputStyle} value={r.satuan} onChange={(e) => setRow(r.id, "satuan", e.target.value)}>{SATUAN.map((s) => <option key={s}>{s}</option>)}</select>
                <input aria-label={`Harga satuan ${idx + 1}`} inputMode="numeric" placeholder="Harga satuan (Rp)" className="tks-input" style={inputStyle} value={r.harga} onChange={(e) => setRow(r.id, "harga", e.target.value)} />
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 18, color: "#fff", textAlign: "right" }}>{rupiah(q * h)}</div>
                {rows.length > 1 && <button type="button" aria-label={`Hapus rincian ${idx + 1}`} className="tks-btn" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} style={{ ...ghost, color: "#ef9a9a", justifySelf: "end" }}>HAPUS</button>}
              </div>
            </div>
          )
        })}
      </div>
      <button type="button" className="tks-btn" onClick={() => setRows((r) => [...r, blankRow()])} style={{ ...ghost, color: O, borderColor: O, marginBottom: 16 }}>+ TAMBAH RINCIAN</button>

      <div style={{ borderTop: "1px solid #555", paddingTop: 12, marginBottom: 20, fontFamily: BB, fontSize: 14, color: "#ccc", display: "grid", gap: 4, justifyContent: "end", textAlign: "right" }}>
        <div>Subtotal: {rupiah(sub)}</div>
        <div>Kontingensi {f.kontingensi}%: {rupiah(kontin(draft))}</div>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 26, color: "#fff" }}>TOTAL {rupiah(sub + kontin(draft))}</div>
      </div>

      <Field label="Lampiran Pendukung (opsional)" hint="Penawaran vendor, RAB detail, proposal. JPG, PNG, atau PDF."><ProofPicker files={files} onChange={setFiles} /></Field>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">AJUKAN SEKARANG</PrimaryButton>
        <button type="button" className="tks-btn" onClick={() => submit(false)} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>SIMPAN SEBAGAI DRAF</button>
        <button type="button" className="tks-btn" onClick={onCancel} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

// ── Printable RAB ──────────────────────────────────────────────────────────────
function BudgetPaper({ b }: { b: Budget }) {
  const last = [...b.reviews].reverse().find((r) => ["Menyetujui", "Menyetujui sebagian"].includes(r.aksi))
  const th: React.CSSProperties = { border: "1px solid #999", padding: "3px 6px", background: "#f2f2f2", textAlign: "left" }
  const td: React.CSSProperties = { border: "1px solid #999", padding: "3px 6px" }
  return (
    <div className="tks-paper" style={{ background: "#fff", color: "#111", width: "210mm", maxWidth: "100%", margin: "24px auto", padding: "14mm", boxSizing: "border-box", fontFamily: BB, boxShadow: "0 4px 24px #0008", fontSize: 13, lineHeight: 1.6 }}>
      <div style={{ borderBottom: `3px solid ${O}`, paddingBottom: 8, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2 }}>PENGAJUAN ANGGARAN</div>
        <div style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, color: "#555" }}>PANITIA TKS 2027 PKB GPIB</div>
        <div style={{ fontSize: 12, color: "#555" }}>Nomor: {b.nomor} · Status: {b.status}</div>
      </div>
      <table style={{ width: "100%", marginBottom: 12 }}><tbody>
        {[["Kegiatan", b.judul], ["Bidang", b.bidang], ["Pengaju", b.pengaju], ["Tanggal Pengajuan", fmtDate(b.createdAt.slice(0, 10))], ["Pelaksanaan", b.tglKegiatan ? fmtDate(b.tglKegiatan) : "-"], ["Dana Dibutuhkan", fmtDate(b.tglButuh)], ["Tujuan", b.tujuan]].map(([k, v]) => (
          <tr key={k}><td style={{ width: 140, verticalAlign: "top", fontWeight: 700 }}>{k}</td><td>: {v}</td></tr>
        ))}
      </tbody></table>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr>{["No", "Uraian", "Kategori", "Jml", "Satuan", "Harga", "Subtotal"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>
          {b.items.map((i, n) => <tr key={i.id}><td style={td}>{n + 1}</td><td style={td}>{i.uraian}</td><td style={td}>{i.kategori}</td><td style={td}>{i.qty}</td><td style={td}>{i.satuan}</td><td style={{ ...td, textAlign: "right" }}>{rupiah(i.harga)}</td><td style={{ ...td, textAlign: "right" }}>{rupiah(i.qty * i.harga)}</td></tr>)}
          <tr><td colSpan={6} style={{ ...td, textAlign: "right" }}>Subtotal</td><td style={{ ...td, textAlign: "right" }}>{rupiah(subtotal(b))}</td></tr>
          <tr><td colSpan={6} style={{ ...td, textAlign: "right" }}>Kontingensi {b.kontingensi}%</td><td style={{ ...td, textAlign: "right" }}>{rupiah(kontin(b))}</td></tr>
          <tr><td colSpan={6} style={{ ...td, textAlign: "right", fontWeight: 700 }}>TOTAL DIAJUKAN</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{rupiah(totalOf(b))}</td></tr>
          {b.disetujui !== undefined && <tr><td colSpan={6} style={{ ...td, textAlign: "right", fontWeight: 700 }}>TOTAL DISETUJUI</td><td style={{ ...td, textAlign: "right", fontWeight: 700 }}>{rupiah(b.disetujui)}</td></tr>}
        </tbody>
      </table>
      {last?.catatan && <div style={{ marginTop: 10 }}><strong>Catatan persetujuan:</strong> {last.catatan}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44 }}>
        <div style={{ textAlign: "center" }}>Pengaju<br /><br /><br /><br /><u>{b.pengaju}</u></div>
        <div style={{ textAlign: "center" }}>Menyetujui (Panitia Inti)<br /><br /><br /><br /><u>{last?.by ?? "………………………"}</u></div>
      </div>
    </div>
  )
}

// ── Detail ─────────────────────────────────────────────────────────────────────
function BudgetDetail({ b, me, mode, onBack, onEdit, onChanged }: { b: Budget; me: User; mode: "own" | "review"; onBack: () => void; onEdit: () => void; onChanged: () => void }) {
  const [preview, setPreview] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [amount, setAmount] = useState(String(totalOf(b)))
  const [note, setNote] = useState("")
  const [err, setErr] = useState("")
  const total = totalOf(b)
  const mine = b.pengajuEmail === me.email
  const editable = mine && (b.status === "Draf" || b.status === "Revisi")

  const act = (patch: Partial<Budget>, aksi: string, catatan = "", jumlah?: number) => {
    save({ ...b, ...patch, reviews: [...b.reviews, { by: me.name, at: new Date().toISOString(), aksi, catatan, jumlah }] })
    setNote(""); setErr("")
    onChanged()
  }
  const decide = (kind: "ok" | "rev" | "no") => {
    const jumlah = Math.min(num(amount), total)
    if (kind !== "ok" && note.trim().length < 3) return setErr("Catatan wajib diisi untuk revisi atau penolakan.")
    if (kind === "ok") {
      if (jumlah <= 0) return setErr("Isi jumlah yang disetujui.")
      act({ status: jumlah < total ? "Disetujui Sebagian" : "Disetujui", disetujui: jumlah }, jumlah < total ? "Menyetujui sebagian" : "Menyetujui", note.trim(), jumlah)
    } else if (kind === "rev") act({ status: "Revisi" }, "Meminta revisi", note.trim())
    else act({ status: "Ditolak", disetujui: undefined }, "Menolak", note.trim())
  }

  const byKat = BUDGET_KAT.map((k) => [k, b.items.filter((i) => i.kategori === k).reduce((n, i) => n + i.qty * i.harga, 0)] as const).filter(([, v]) => v > 0)

  return (
    <div>
      <button className="tks-btn" onClick={onBack} style={{ ...ghost, marginBottom: 16 }}>← DAFTAR PENGAJUAN</button>
      <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 3, color: O }}>{b.nomor} · {b.bidang.toUpperCase()}</div>
          <Chip tone={tone(b.status)}>{b.status.toUpperCase()}</Chip>
        </div>
        <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 32, color: "#fff", letterSpacing: 1, margin: "0 0 10px" }}>{b.judul}</h2>
        <div style={{ fontFamily: BB, fontSize: 14, color: "#bbb", lineHeight: 1.8, marginBottom: 16 }}>
          Pengaju: <strong style={{ color: "#fff" }}>{b.pengaju}</strong> · Diajukan {fmtDate(b.createdAt.slice(0, 10))}<br />
          {b.tglKegiatan && <>Pelaksanaan {fmtDate(b.tglKegiatan)} · </>}Dana dibutuhkan paling lambat {fmtDate(b.tglButuh)}
        </div>
        <div style={{ fontFamily: BB, fontSize: 15, color: "#ddd", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 20 }}>{b.tujuan}</div>

        <div style={{ overflowX: "auto", marginBottom: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: BB, fontSize: 14, color: "#ddd", minWidth: 560 }}>
            <thead><tr>{["Uraian", "Kategori", "Jml", "Harga", "Subtotal"].map((h, i) => <th key={h} style={{ textAlign: i > 1 ? "right" : "left", padding: "8px 10px", borderBottom: "1px solid #666", fontFamily: BC, letterSpacing: 2, fontSize: 12, color: "#999" }}>{h.toUpperCase()}</th>)}</tr></thead>
            <tbody>
              {b.items.map((i) => (
                <tr key={i.id}>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #3a3a3a" }}>{i.uraian}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #3a3a3a", color: "#aaa" }}>{i.kategori}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #3a3a3a", textAlign: "right" }}>{i.qty} {i.satuan}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #3a3a3a", textAlign: "right" }}>{rupiah(i.harga)}</td>
                  <td style={{ padding: "8px 10px", borderBottom: "1px solid #3a3a3a", textAlign: "right" }}>{rupiah(i.qty * i.harga)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: "right", fontFamily: BB, fontSize: 14, color: "#ccc", display: "grid", gap: 2, marginBottom: 16 }}>
          <div>Subtotal {rupiah(subtotal(b))}</div>
          <div>Kontingensi {b.kontingensi}% {rupiah(kontin(b))}</div>
          <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff" }}>TOTAL DIAJUKAN {rupiah(total)}</div>
          {b.disetujui !== undefined && <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#66bb6a" }}>DISETUJUI {rupiah(b.disetujui)}</div>}
        </div>
        {byKat.length > 0 && <div style={{ fontFamily: BB, fontSize: 12, color: "#999", marginBottom: 16 }}>Per kategori: {byKat.map(([k, v]) => `${k} ${rupiah(v)}`).join(" · ")}</div>}
        {b.lampiran.length > 0 && <section style={{ marginBottom: 16 }}><div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O }}>LAMPIRAN</div><ProofLinks files={b.lampiran} /></section>}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #444", paddingTop: 16 }}>
          {editable && <button className="tks-btn" onClick={() => act({ status: "Diajukan" }, b.status === "Revisi" ? "Mengajukan ulang" : "Mengajukan")} style={solid}>{b.status === "Revisi" ? "AJUKAN ULANG" : "AJUKAN"}</button>}
          {editable && <button className="tks-btn" onClick={onEdit} style={ghost}>UBAH</button>}
          {mine && b.status === "Diajukan" && <button className="tks-btn" onClick={() => act({ status: "Draf" }, "Menarik kembali")} style={ghost}>TARIK KEMBALI</button>}
          {mine && b.status === "Draf" && <DeleteControl id={b.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus pengajuan?" onDelete={() => { write(BUDGET_KEY, list().filter((x) => x.id !== b.id)); onChanged(); onBack() }} />}
          <button className="tks-btn" onClick={() => setPreview(true)} style={ghost}>CETAK</button>
        </div>
      </div>

      {mode === "review" && b.status === "Diajukan" && (
        <div style={{ ...cardStyle, padding: 20, marginBottom: 20, borderLeft: `3px solid ${O}` }}>
          <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, marginBottom: 10 }}>KEPUTUSAN PANITIA INTI</div>
          {mine ? (
            <div style={{ fontFamily: BB, fontSize: 14, color: "#ffb74d" }}>Pengajuan ini dibuat oleh Anda sendiri, sehingga harus diputuskan oleh anggota panitia inti lain.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }} className="card-grid">
                <Field label="Jumlah Disetujui (Rp)" htmlFor="b-amt" hint={`Maksimal ${rupiah(total)}. Isi lebih kecil untuk persetujuan sebagian.`}><input id="b-amt" inputMode="numeric" className="tks-input" style={inputStyle} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
                <Field label="Catatan" htmlFor="b-note" error={err}><input id="b-note" className="tks-input" style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Wajib untuk revisi / penolakan" /></Field>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="tks-btn" onClick={() => decide("ok")} style={{ ...solid, background: "#2e7d32" }}>SETUJUI</button>
                <button className="tks-btn" onClick={() => decide("rev")} style={{ ...ghost, color: "#ffb74d", borderColor: "#ffb74d" }}>MINTA REVISI</button>
                <button className="tks-btn" onClick={() => decide("no")} style={{ ...ghost, color: "#ef9a9a", borderColor: "#c62828" }}>TOLAK</button>
              </div>
            </>
          )}
        </div>
      )}

      <H>RIWAYAT</H>
      {b.reviews.length === 0 ? <Empty>Belum ada aktivitas.</Empty> : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {[...b.reviews].reverse().map((r, i) => (
            <li key={i} style={{ ...cardStyle, padding: "10px 14px", fontFamily: BB, fontSize: 13, color: "#ccc" }}>
              <strong style={{ color: "#fff" }}>{r.aksi}</strong> oleh {r.by} · {new Date(r.at).toLocaleString("id-ID")}
              {r.jumlah !== undefined && ` · ${rupiah(r.jumlah)}`}
              {r.catatan && <div style={{ color: "#aaa", marginTop: 2 }}>“{r.catatan}”</div>}
            </li>
          ))}
        </ol>
      )}
      {preview && <ReportPrint title="PRATINJAU PENGAJUAN ANGGARAN" onClose={() => setPreview(false)}><BudgetPaper b={b} /></ReportPrint>}
    </div>
  )
}

// ── List tab (own requests / review queue) ────────────────────────────────────
export function BudgetsTab({ me, mode }: { me: User; mode: "own" | "review" }) {
  const [all, setAll] = useState(list)
  const [view, setView] = useState<{ m: "list" } | { m: "form"; edit: Budget | null } | { m: "detail"; id: string }>({ m: "list" })
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>(mode === "review" ? "Diajukan" : "")
  const [bidang, setBidang] = useState("")
  const reload = () => setAll(list())

  if (view.m === "form") {
    return <BudgetForm initial={view.edit} me={me} onCancel={() => setView(view.edit ? { m: "detail", id: view.edit.id } : { m: "list" })} onDone={(id) => { reload(); window.scrollTo({ top: 0 }); setView({ m: "detail", id }) }} />
  }
  if (view.m === "detail") {
    const b = all.find((x) => x.id === view.id)
    if (b) return <BudgetDetail b={b} me={me} mode={mode} onBack={() => setView({ m: "list" })} onEdit={() => setView({ m: "form", edit: b })} onChanged={reload} />
  }

  const base = mode === "own" ? all.filter((b) => b.pengajuEmail === me.email) : all.filter((b) => b.status !== "Draf")
  const rows = base
    .filter((b) => (!status || b.status === status) && (!bidang || b.bidang === bidang))
    .filter((b) => !q || [b.judul, b.nomor, b.pengaju, b.bidang].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const sum = (s: BStatus[]) => base.filter((b) => s.includes(b.status)).reduce((n, b) => n + (s.includes("Disetujui") ? b.disetujui ?? 0 : totalOf(b)), 0)

  return (
    <div>
      <H>{mode === "own" ? `PENGAJUAN ANGGARAN SAYA (${base.length})` : `PERSETUJUAN ANGGARAN (${base.filter((b) => b.status === "Diajukan").length} MENUNGGU)`}</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 10, marginBottom: 20 }}>
        {([["MENUNGGU KEPUTUSAN", sum(["Diajukan"]), "#fff"], ["DISETUJUI", sum(["Disetujui", "Disetujui Sebagian"]), "#66bb6a"], ["PERLU REVISI", sum(["Revisi"]), "#ffb74d"], ["DITOLAK", sum(["Ditolak"]), "#ef9a9a"]] as const).map(([l, v, c]) => (
          <div key={l} style={{ ...cardStyle, padding: "12px 16px" }}>
            <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 2.5, color: "#999" }}>{l}</div>
            <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: c }}>{rupiah(v)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        {mode === "own" && <PrimaryButton onClick={() => setView({ m: "form", edit: null })}>+ AJUKAN ANGGARAN</PrimaryButton>}
        <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kegiatan, nomor, pengaju…" />
        <select className="tks-input" aria-label="Filter status" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>{STATUSES.filter((s) => mode === "own" || s !== "Draf").map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="tks-input" aria-label="Filter bidang" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={bidang} onChange={(e) => setBidang(e.target.value)}>
          <option value="">Semua bidang</option>{BIDANG.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <Empty>{base.length ? "Tidak ada pengajuan yang cocok." : mode === "own" ? "Anda belum membuat pengajuan anggaran." : "Belum ada pengajuan masuk."}</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((b) => (
            <article key={b.id} style={{ ...cardStyle, padding: 16, display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{b.nomor} · {b.bidang.toUpperCase()}</div>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff" }}>{b.judul}</div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>{b.pengaju} · butuh {fmtDate(b.tglButuh)} · {b.items.length} rincian</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: "#fff" }}>{rupiah(totalOf(b))}</div>
                {b.disetujui !== undefined && <div style={{ fontFamily: BB, fontSize: 12, color: "#66bb6a" }}>disetujui {rupiah(b.disetujui)}</div>}
              </div>
              <Chip tone={tone(b.status)}>{b.status.toUpperCase()}</Chip>
              <button className="tks-btn" onClick={() => setView({ m: "detail", id: b.id })} style={solid}>{mode === "review" && b.status === "Diajukan" ? "TINJAU" : "BUKA"}</button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Recap ──────────────────────────────────────────────────────────────────────
export function BudgetRecapTab() {
  const all = list().filter((b) => b.status !== "Draf")
  const [preview, setPreview] = useState(false)
  const approved = (b: Budget) => (b.status === "Disetujui" || b.status === "Disetujui Sebagian" ? b.disetujui ?? 0 : 0)
  const rows = BIDANG.map((d) => {
    const bs = all.filter((b) => b.bidang === d)
    return { d, n: bs.length, ajuan: bs.reduce((n, b) => n + totalOf(b), 0), setuju: bs.reduce((n, b) => n + approved(b), 0), tunggu: bs.filter((b) => b.status === "Diajukan").length }
  }).filter((r) => r.n > 0)
  const tot = rows.reduce((a, r) => ({ n: a.n + r.n, ajuan: a.ajuan + r.ajuan, setuju: a.setuju + r.setuju, tunggu: a.tunggu + r.tunggu }), { n: 0, ajuan: 0, setuju: 0, tunggu: 0 })
  const okBudgets = all.filter((b) => b.status === "Disetujui" || b.status === "Disetujui Sebagian")
  const kat = BUDGET_KAT.map((k) => [k, okBudgets.reduce((n, b) => n + (b.items.filter((i) => i.kategori === k).reduce((m, i) => m + i.qty * i.harga, 0) * (b.disetujui ?? 0)) / (totalOf(b) || 1), 0)] as const).filter(([, v]) => v > 0)

  const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #666", fontFamily: BC, letterSpacing: 2, fontSize: 12, color: "#999" }
  const td: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #3a3a3a" }

  const paper = (
    <div className="tks-paper" style={{ background: "#fff", color: "#111", width: "210mm", maxWidth: "100%", margin: "24px auto", padding: "14mm", boxSizing: "border-box", fontFamily: BB, boxShadow: "0 4px 24px #0008", fontSize: 13 }}>
      <div style={{ borderBottom: `3px solid ${O}`, paddingBottom: 8, marginBottom: 14, textAlign: "center" }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2 }}>REKAP ANGGARAN PER BIDANG</div>
        <div style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, color: "#555" }}>PANITIA TKS 2027 PKB GPIB</div>
        <div style={{ fontSize: 12, color: "#555" }}>Per {fmtDate(new Date().toISOString().slice(0, 10))}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead><tr>{["Bidang", "Pengajuan", "Menunggu", "Diajukan", "Disetujui"].map((h) => <th key={h} style={{ border: "1px solid #999", padding: "3px 6px", background: "#f2f2f2", textAlign: "left" }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.d}>{[r.d, r.n, r.tunggu, rupiah(r.ajuan), rupiah(r.setuju)].map((c, i) => <td key={i} style={{ border: "1px solid #999", padding: "3px 6px" }}>{c}</td>)}</tr>)}
          <tr style={{ fontWeight: 700 }}>{["TOTAL", tot.n, tot.tunggu, rupiah(tot.ajuan), rupiah(tot.setuju)].map((c, i) => <td key={i} style={{ border: "1px solid #999", padding: "3px 6px" }}>{c}</td>)}</tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <H>REKAP ANGGARAN</H>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <button className="tks-btn" onClick={() => setPreview(true)} style={solid}>CETAK REKAP</button>
        <button className="tks-btn" onClick={() => downloadCsv("anggaran-tks2027.csv", [["Nomor", "Kegiatan", "Bidang", "Pengaju", "Tgl Dana Dibutuhkan", "Status", "Diajukan", "Disetujui"], ...all.map((b) => [b.nomor, b.judul, b.bidang, b.pengaju, b.tglButuh, b.status, totalOf(b), approved(b)])])} style={{ ...ghost, color: O, borderColor: O }}>EXPORT CSV</button>
      </div>
      {rows.length === 0 ? <Empty>Belum ada pengajuan anggaran.</Empty> : (
        <div style={{ ...cardStyle, padding: 16, overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: BB, fontSize: 14, color: "#ddd", minWidth: 560 }}>
            <thead><tr>{["BIDANG", "PENGAJUAN", "MENUNGGU", "DIAJUKAN", "DISETUJUI"].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => <tr key={r.d}><td style={td}>{r.d}</td><td style={td}>{r.n}</td><td style={td}>{r.tunggu}</td><td style={td}>{rupiah(r.ajuan)}</td><td style={{ ...td, color: "#66bb6a" }}>{rupiah(r.setuju)}</td></tr>)}
              <tr style={{ fontWeight: 700, color: "#fff" }}><td style={td}>TOTAL</td><td style={td}>{tot.n}</td><td style={td}>{tot.tunggu}</td><td style={td}>{rupiah(tot.ajuan)}</td><td style={{ ...td, color: "#66bb6a" }}>{rupiah(tot.setuju)}</td></tr>
            </tbody>
          </table>
        </div>
      )}
      {kat.length > 0 && (
        <>
          <H>ANGGARAN DISETUJUI PER KATEGORI</H>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {kat.map(([k, v]) => (
              <div key={k} style={{ ...cardStyle, padding: "12px 16px" }}>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2, color: "#999" }}>{k.toUpperCase()}</div>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff" }}>{rupiah(Math.round(v))}</div>
              </div>
            ))}
          </div>
        </>
      )}
      {preview && <ReportPrint title="PRATINJAU REKAP ANGGARAN" onClose={() => setPreview(false)}>{paper}</ReportPrint>}
    </div>
  )
}
