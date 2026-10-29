import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"
import { kartuUrl } from "@/PesertaPublic"
import {
  read,
  upsert,
  removeById,
  randomId,
  compressPhoto,
  Field,
  PrimaryButton,
  Banner,
  Chip,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
} from "@/Account"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export type Committee = {
  id: string
  regNo: string
  nama: string
  divisi: string
  jabatan: string
  foto?: string
  createdAt: string
}
export const COMMITTEE_KEY = "tks27_committee"

export type CardData = {
  key: string
  regNo: string
  nama: string
  role: string
  line1: string
  line2: string
  foto?: string
  color: string
}

export const ROLE_COLOR: Record<string, string> = {
  Peserta: O,
  Undangan: "#0277bd",
  Pendamping: "#2e7d32",
  KMJ: "#6a1b9a",
  Panitia: "#222222",
}

// ── QR ─────────────────────────────────────────────────────────────────────────
function QR({ value, size }: { value: string; size: string }) {
  const [src, setSrc] = useState("")
  useEffect(() => {
    let live = true
    QRCode.toDataURL(value, { margin: 1, width: 280, errorCorrectionLevel: "L" }).then((u) => live && setSrc(u))
    return () => { live = false }
  }, [value])
  return src ? <img src={src} alt={`QR ${value}`} style={{ width: size, height: size, display: "block" }} /> : <div style={{ width: size, height: size }} />
}

// ── Single card (54 x 86 mm) ───────────────────────────────────────────────────
function IdCard({ c }: { c: CardData }) {
  const initials = c.nama.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
  return (
    <div className="idcard" style={{ width: "54mm", height: "86mm", background: "#fff", color: "#222", border: "0.3mm solid #bbb", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: BB, boxSizing: "border-box" }}>
      <div style={{ background: O, color: "#fff", display: "flex", alignItems: "center", gap: "2mm", padding: "2.2mm 3mm" }}>
        <img src={logo} alt="" style={{ width: "8mm", height: "8mm", objectFit: "contain", background: "#fff", borderRadius: "50%" }} />
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: "3.6mm", letterSpacing: "0.3mm", lineHeight: 1.1 }}>
          TKS 2027 PKB GPIB
          <div style={{ fontWeight: 600, fontSize: "2.4mm", letterSpacing: "0.4mm", opacity: 0.9 }}>TEMU KARYA SINODAL</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3mm 3mm 0" }}>
        {c.foto ? (
          <img src={c.foto} alt="" style={{ width: "22mm", height: "28mm", objectFit: "cover", border: `0.6mm solid ${c.color}` }} />
        ) : (
          <div style={{ width: "22mm", height: "28mm", border: `0.6mm solid ${c.color}`, background: "#eee", display: "grid", placeItems: "center", fontFamily: BC, fontWeight: 800, fontSize: "9mm", color: "#888" }}>{initials}</div>
        )}
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: c.nama.length > 22 ? "4.2mm" : "5mm", lineHeight: 1.05, textAlign: "center", marginTop: "2mm", textTransform: "uppercase", overflowWrap: "anywhere" }}>{c.nama}</div>
        <div style={{ fontSize: "2.7mm", color: "#555", textAlign: "center", lineHeight: 1.3, marginTop: "0.8mm" }}>
          {c.line1}
          {c.line2 && <><br />{c.line2}</>}
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "2.5mm", padding: "0 3mm 2mm" }}>
        <QR value={kartuUrl(c.regNo)} size="18mm" />
        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: "3mm", letterSpacing: "0.3mm", color: "#444", lineHeight: 1.2 }}>
          NO. ID
          <div style={{ fontWeight: 800, fontSize: "3.6mm", color: "#111" }}>{c.regNo}</div>
        </div>
      </div>
      <div style={{ background: c.color, color: "#fff", textAlign: "center", fontFamily: BC, fontWeight: 800, fontSize: "4mm", letterSpacing: "0.9mm", padding: "1.6mm 0", textTransform: "uppercase" }}>{c.role}</div>
    </div>
  )
}

// ── Print preview overlay ──────────────────────────────────────────────────────
export function IdCardPreview({ cards, onClose }: { cards: CardData[]; onClose: () => void }) {
  useEffect(() => {
    document.body.classList.add("tks-printing")
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => { document.body.classList.remove("tks-printing"); window.removeEventListener("keydown", onKey) }
  }, [onClose])

  return createPortal(
    <div className="tks-print-overlay" role="dialog" aria-label="Pratinjau cetak ID card" style={{ position: "fixed", inset: 0, zIndex: 200, background: "#2a2a2a", overflow: "auto" }}>
      <style>{`
        .tks-sheet { display: grid; grid-template-columns: repeat(auto-fill, 54mm); gap: 6mm; justify-content: center; padding: 24px; }
        @media print {
          @page { size: A4; margin: 8mm; }
          body.tks-printing #root { display: none !important; }
          .tks-print-overlay { position: static !important; background: #fff !important; overflow: visible !important; }
          .tks-print-bar { display: none !important; }
          .tks-sheet { grid-template-columns: repeat(3, 54mm); gap: 4mm; padding: 0; justify-content: start; }
          .idcard { break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; outline: 0.2mm dashed #999; outline-offset: 1mm; }
        }
      `}</style>
      <div className="tks-print-bar" style={{ position: "sticky", top: 0, zIndex: 1, background: "#1f1f1f", borderBottom: "1px solid #555", padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontFamily: BC, fontSize: 18, letterSpacing: 2, color: "#fff", flex: 1 }}>{cards.length} ID CARD · A4, 9 KARTU PER HALAMAN</strong>
        <button className="tks-btn" onClick={() => window.print()} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK / SIMPAN PDF</button>
        <button className="tks-btn" onClick={onClose} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>TUTUP</button>
      </div>
      <div className="tks-sheet">{cards.map((c) => <IdCard key={c.key} c={c} />)}</div>
    </div>,
    document.body,
  )
}

// ── Committee management (superuser) ───────────────────────────────────────────
const DIVISI = ["Ketua / Pengarah", "Sekretariat", "Bendahara", "Acara", "Lomba", "Akomodasi", "Transportasi", "Konsumsi", "Kesehatan", "Humas & Dokumentasi", "Keamanan", "Perlengkapan"]

const toCard = (c: Committee): CardData => ({ key: c.id, regNo: c.regNo, nama: c.nama, role: "Panitia", line1: c.divisi, line2: c.jabatan, foto: c.foto, color: ROLE_COLOR.Panitia })

export function CommitteeAdmin() {
  const [list, setList] = useState<Committee[]>(() => read<Committee[]>(COMMITTEE_KEY, []))
  const refresh = () => setList(read<Committee[]>(COMMITTEE_KEY, []))
  const [editing, setEditing] = useState<Committee | null>(null)
  const [f, setF] = useState({ nama: "", divisi: "", jabatan: "", foto: "" })
  const [err, setErr] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [print, setPrint] = useState<CardData[] | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => { setEditing(null); setF({ nama: "", divisi: "", jabatan: "", foto: "" }); setErr("") }

  const pickFoto = async (file?: File) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setErr("Foto harus JPG, PNG, atau WEBP.")
    if (file.size > 5 * 1024 * 1024) return setErr("Ukuran foto maksimal 5 MB.")
    try { setF((s) => ({ ...s, foto: "" })); const d = await compressPhoto(file); setF((s) => ({ ...s, foto: d })); setErr("") } catch (e) { setErr((e as Error).message) }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (f.nama.trim().length < 3) return setErr("Nama minimal 3 karakter.")
    if (!f.divisi.trim()) return setErr("Divisi wajib diisi.")
    if (!f.jabatan.trim()) return setErr("Jabatan wajib diisi.")
    const next = list.reduce((n, c) => Math.max(n, Number(c.regNo.replace(/\D/g, "")) || 0), 0) + 1
    upsert<Committee>(COMMITTEE_KEY, {
      id: editing?.id ?? randomId(),
      regNo: editing?.regNo ?? `PNT-${String(next).padStart(4, "0")}`,
      nama: f.nama.trim(),
      divisi: f.divisi.trim(),
      jabatan: f.jabatan.trim(),
      foto: f.foto || undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    })
    reset()
    refresh()
  }

  const sorted = [...list].sort((a, b) => a.regNo.localeCompare(b.regNo))

  return (
    <div>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>DAFTAR PANITIA ({list.length})</h2>
      {err && <Banner tone="error">{err}</Banner>}
      <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>{editing ? `UBAH ${editing.regNo}` : "TAMBAH PANITIA"}</div>
        <datalist id="divisi-list">{DIVISI.map((d) => <option key={d} value={d} />)}</datalist>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
          <Field label="Nama Lengkap" htmlFor="c-nama"><input id="c-nama" className="tks-input" style={inputStyle} value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} /></Field>
          <Field label="Divisi / Seksi" htmlFor="c-div"><input id="c-div" list="divisi-list" className="tks-input" style={inputStyle} value={f.divisi} onChange={(e) => setF({ ...f, divisi: e.target.value })} /></Field>
          <Field label="Jabatan" htmlFor="c-jab"><input id="c-jab" className="tks-input" style={inputStyle} value={f.jabatan} onChange={(e) => setF({ ...f, jabatan: e.target.value })} placeholder="Ketua, Anggota, Koordinator…" /></Field>
          <Field label="Foto (opsional)" hint="Tanpa foto, kartu memakai inisial nama.">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickFoto(e.target.files?.[0]); e.target.value = "" }} />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {f.foto && <img src={f.foto} alt="Pratinjau" style={{ width: 44, height: 56, objectFit: "cover", border: `1px solid ${O}` }} />}
              <button type="button" className="tks-btn" onClick={() => fileRef.current?.click()} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>{f.foto ? "GANTI FOTO" : "PILIH FOTO"}</button>
              {f.foto && <button type="button" className="tks-btn" onClick={() => setF({ ...f, foto: "" })} style={{ ...smallBtn, color: "#ccc", background: "none", border: "1px solid #666" }}>HAPUS</button>}
            </div>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <PrimaryButton type="submit">{editing ? "SIMPAN PERUBAHAN" : "TAMBAH PANITIA"}</PrimaryButton>
          {editing && <button type="button" className="tks-btn" onClick={reset} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>}
        </div>
      </form>

      {list.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <button className="tks-btn" onClick={() => setPrint(sorted.map(toCard))} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK SEMUA ID CARD ({list.length})</button>
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>Belum ada panitia terdaftar.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((c) => (
            <article key={c.id} style={{ ...cardStyle, padding: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              {c.foto ? <img src={c.foto} alt="" style={{ width: 44, height: 56, objectFit: "cover", border: `1px solid ${O}` }} /> : <div style={{ width: 44, height: 56, background: "#444", display: "grid", placeItems: "center", fontFamily: BC, fontWeight: 800, color: "#aaa" }}>{c.nama[0]?.toUpperCase()}</div>}
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: "#fff" }}>{c.nama}</div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>{c.divisi} · {c.jabatan}</div>
              </div>
              <Chip tone="gray">{c.regNo}</Chip>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button className="tks-btn" onClick={() => setPrint([toCard(c)])} style={{ ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }}>ID CARD</button>
                <button className="tks-btn" onClick={() => { setEditing(c); setF({ nama: c.nama, divisi: c.divisi, jabatan: c.jabatan, foto: c.foto ?? "" }); setErr(""); window.scrollTo({ top: 0, behavior: "smooth" }) }} style={{ ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }}>UBAH</button>
                <DeleteControl id={c.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus panitia?" onDelete={() => { removeById<Committee>(COMMITTEE_KEY, c.id); setConfirmId(null); refresh() }} />
              </div>
            </article>
          ))}
        </div>
      )}
      {print && <IdCardPreview cards={print} onClose={() => setPrint(null)} />}
    </div>
  )
}
