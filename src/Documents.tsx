import React, { useRef, useState } from "react"
import {
  read,
  write,
  randomId,
  Field,
  PrimaryButton,
  Banner,
  Chip,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  fmtSize,
  type FileInfo,
  type User,
} from "@/Account"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export const DOC_KEY = "tks27_docs"
export const DOC_PORTAL_KEY = "tks27_docportal"
export const DOC_PREFIX = "#/dokumen/"
export const DOC_KATEGORI = ["Surat Edaran", "Juknis & Panduan", "Proposal", "Formulir", "Laporan", "Keputusan & SK", "Materi Rapat", "Lainnya"]
const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"

export type Vis = "external" | "internal"
export type Doc = {
  id: string
  judul: string
  nomor: string
  deskripsi: string
  kategori: string
  vis: Vis
  file: FileInfo
  createdAt: string
  createdBy: string
  updatedAt: string
}

export const listDocs = () => read<Doc[]>(DOC_KEY, [])
export const listExternalDocs = () => listDocs().filter((d) => d.vis === "external").sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
const getToken = () => read<{ token: string; createdAt: string } | null>(DOC_PORTAL_KEY, null)
export const portalValid = (t: string) => !!t && getToken()?.token === t
export const docStats = () => {
  const d = listDocs()
  return { eksternal: d.filter((x) => x.vis === "external").length, internal: d.filter((x) => x.vis === "internal").length }
}

const ext = (f: FileInfo) => (f.name.split(".").pop() ?? "FILE").toUpperCase().slice(0, 4)
const ghost: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }
const solid: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)

function readDoc(file: File): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_BYTES) return reject(new Error(`Ukuran maksimal ${fmtSize(MAX_BYTES)} per berkas (file ini ${fmtSize(file.size)}).`))
    const r = new FileReader()
    r.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: String(r.result) })
    r.onerror = () => reject(new Error("Gagal membaca berkas."))
    r.readAsDataURL(file)
  })
}

function DocRow({ d, actions }: { d: Doc; actions?: React.ReactNode }) {
  return (
    <article style={{ ...cardStyle, padding: 16, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ width: 44, height: 56, background: d.vis === "internal" ? "#555" : O, display: "grid", placeItems: "center", fontFamily: BC, fontWeight: 800, fontSize: 12, letterSpacing: 1, color: "#fff", flexShrink: 0 }}>{ext(d.file)}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{d.kategori.toUpperCase()}{d.nomor && ` · ${d.nomor}`}</div>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: "#fff" }}>{d.judul}</div>
        {d.deskripsi && <div style={{ fontFamily: BB, fontSize: 13, color: "#aaa" }}>{d.deskripsi}</div>}
        <div style={{ fontFamily: BB, fontSize: 12, color: "#888", marginTop: 2 }}>{d.file.name} · {fmtSize(d.file.size)} · diperbarui {fmtDate(d.updatedAt.slice(0, 10))}</div>
      </div>
      <Chip tone={d.vis === "internal" ? "gray" : "green"}>{d.vis === "internal" ? "INTERNAL" : "PUBLIK"}</Chip>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <a href={d.file.data} download={d.file.name} className="tks-btn" style={{ ...solid, textDecoration: "none", display: "inline-block" }}>UNDUH</a>
        {actions}
      </div>
    </article>
  )
}

function DocForm({ initial, me, onDone, onCancel }: { initial: Doc | null; me: User; onDone: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [f, setF] = useState({ judul: initial?.judul ?? "", nomor: initial?.nomor ?? "", deskripsi: initial?.deskripsi ?? "", kategori: initial?.kategori ?? DOC_KATEGORI[0], vis: (initial?.vis ?? "external") as Vis })
  const [file, setFile] = useState<FileInfo | null>(initial?.file ?? null)
  const [err, setErr] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  const pick = async (fl: File | undefined) => {
    if (!fl) return
    try { setFile(await readDoc(fl)); setErr((e) => ({ ...e, file: "" })) } catch (e) { setErr((x) => ({ ...x, file: (e as Error).message })) }
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.judul.trim().length < 3) er.judul = "Isi judul dokumen."
    if (!file) er.file = "Pilih berkas dokumen."
    setErr(er)
    if (Object.keys(er).length || !file) return
    const now = new Date().toISOString()
    const d: Doc = { id: initial?.id ?? randomId(), judul: f.judul.trim(), nomor: f.nomor.trim(), deskripsi: f.deskripsi.trim(), kategori: f.kategori, vis: f.vis, file, createdAt: initial?.createdAt ?? now, createdBy: initial?.createdBy ?? me.name, updatedAt: now }
    const all = listDocs()
    try {
      write(DOC_KEY, all.some((x) => x.id === d.id) ? all.map((x) => (x.id === d.id ? d : x)) : [...all, d])
    } catch {
      return setErr({ file: "Penyimpanan browser penuh. Hapus dokumen lama atau gunakan berkas lebih kecil." })
    }
    onDone()
  }

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 24, maxWidth: 820, marginBottom: 24, borderTop: `3px solid ${O}` }}>
      <h3 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff", letterSpacing: 1, margin: "0 0 16px" }}>{initial ? "UBAH DOKUMEN" : "UNGGAH DOKUMEN"}</h3>
      <Field label="Judul Dokumen" htmlFor="d-judul" error={err.judul}><input id="d-judul" className="tks-input" style={inputStyle} value={f.judul} onChange={(e) => set("judul", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Kategori" htmlFor="d-kat"><select id="d-kat" className="tks-input" style={inputStyle} value={f.kategori} onChange={(e) => set("kategori", e.target.value)}>{DOC_KATEGORI.map((k) => <option key={k}>{k}</option>)}</select></Field>
        <Field label="Nomor Dokumen" htmlFor="d-no"><input id="d-no" className="tks-input" style={inputStyle} value={f.nomor} onChange={(e) => set("nomor", e.target.value)} placeholder="Opsional, mis. 012/SE/TKS/2027" /></Field>
      </div>
      <Field label="Deskripsi Singkat" htmlFor="d-desc"><input id="d-desc" className="tks-input" style={inputStyle} value={f.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></Field>
      <Field label="Hak Akses" hint="Dokumen publik muncul di menu Downloads situs. Dokumen internal hanya untuk panitia.">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {([["external", "PUBLIK (menu Downloads)"], ["internal", "INTERNAL (khusus panitia)"]] as const).map(([v, l]) => (
            <button key={v} type="button" className="tks-seg" aria-pressed={f.vis === v} onClick={() => set("vis", v)} style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 2, padding: "10px 16px", cursor: "pointer", background: f.vis === v ? O : "#262626", color: f.vis === v ? "#fff" : "#ccc", border: `1px solid ${f.vis === v ? O : "#555"}` }}>{l}</button>
          ))}
        </div>
      </Field>
      <Field label={initial ? "Berkas (pilih untuk mengganti)" : "Berkas"} error={err.file} hint={`PDF, Word, Excel, PowerPoint, ZIP, JPG, atau PNG. Maksimal ${fmtSize(MAX_BYTES)}.`}>
        <input ref={ref} type="file" accept={ACCEPT} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = "" }} />
        <button type="button" className="tks-btn tks-input" onClick={() => ref.current?.click()} style={{ ...inputStyle, borderStyle: "dashed", cursor: "pointer", textAlign: "center", color: "#ccc", fontFamily: BB }}>
          {file ? `${file.name} · ${fmtSize(file.size)}` : "+ Pilih berkas"}
        </button>
      </Field>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">{initial ? "SIMPAN" : "UNGGAH"}</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onCancel} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

function PortalBox() {
  const [t, setT] = useState(getToken)
  const [copied, setCopied] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const link = t ? `${location.origin}${location.pathname}${DOC_PREFIX}${t.token}` : ""
  const make = () => {
    const b = new Uint8Array(16)
    crypto.getRandomValues(b)
    const n = { token: Array.from(b, (x) => x.toString(16).padStart(2, "0")).join(""), createdAt: new Date().toISOString() }
    write(DOC_PORTAL_KEY, n)
    setT(n); setCopied(false); setConfirm(false)
  }
  const off = () => { localStorage.removeItem(DOC_PORTAL_KEY); setT(null); setConfirm(false) }
  const copy = async () => {
    try { await navigator.clipboard.writeText(link) } catch { document.querySelector<HTMLInputElement>("#portal-link")?.select(); document.execCommand("copy") }
    setCopied(true)
  }
  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 24, borderLeft: `3px solid ${O}` }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, marginBottom: 6 }}>TAUTAN AKSES PANITIA (TANPA LOGIN)</div>
      <p style={{ fontFamily: BB, fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.6 }}>Bagikan tautan ini ke panitia agar bisa mengunduh dokumen internal dan publik tanpa login. Siapa pun yang memegang tautan bisa membuka dokumen internal. Jika bocor, buat tautan baru: tautan lama otomatis tidak berlaku.</p>
      {!t ? <PrimaryButton onClick={make}>AKTIFKAN TAUTAN</PrimaryButton> : (
        <>
          <input id="portal-link" readOnly aria-label="Tautan portal dokumen panitia" className="tks-input" style={{ ...inputStyle, fontSize: 12 }} value={link} onFocus={(e) => e.currentTarget.select()} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <button className="tks-btn" onClick={copy} style={solid}>{copied ? "TERSALIN ✓" : "SALIN TAUTAN"}</button>
            <a className="tks-btn" href={`https://wa.me/?text=${encodeURIComponent(`Dokumen panitia TKS 2027 PKB GPIB:\n${link}`)}`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>KIRIM VIA WHATSAPP</a>
            <a className="tks-btn" href={link} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>BUKA HALAMAN</a>
            {confirm ? (
              <>
                <span style={{ fontFamily: BB, fontSize: 13, color: "#ddd" }}>Tautan lama akan mati.</span>
                <button className="tks-btn" onClick={make} style={{ ...ghost, color: "#ffb74d", borderColor: "#ffb74d" }}>BUAT BARU</button>
                <button className="tks-btn" onClick={off} style={{ ...ghost, color: "#ef9a9a", borderColor: "#c62828" }}>NONAKTIFKAN</button>
                <button className="tks-btn" onClick={() => setConfirm(false)} style={ghost}>BATAL</button>
              </>
            ) : <button className="tks-btn" onClick={() => setConfirm(true)} style={ghost}>GANTI / CABUT</button>}
          </div>
          <div style={{ fontFamily: BB, fontSize: 12, color: "#888", marginTop: 8 }}>Dibuat {new Date(t.createdAt).toLocaleString("id-ID")}</div>
        </>
      )}
    </div>
  )
}

function useFiltered(docs: Doc[]) {
  const [q, setQ] = useState("")
  const [kat, setKat] = useState("")
  const [vis, setVis] = useState("")
  const rows = docs
    .filter((d) => (!kat || d.kategori === kat) && (!vis || d.vis === vis))
    .filter((d) => !q || [d.judul, d.nomor, d.deskripsi, d.file.name].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const bar = (showVis: boolean) => (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
      <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, nomor, nama berkas…" />
      <select className="tks-input" aria-label="Filter kategori" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={kat} onChange={(e) => setKat(e.target.value)}>
        <option value="">Semua kategori</option>{DOC_KATEGORI.map((k) => <option key={k}>{k}</option>)}
      </select>
      {showVis && (
        <select className="tks-input" aria-label="Filter akses" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={vis} onChange={(e) => setVis(e.target.value)}>
          <option value="">Publik & internal</option><option value="external">Publik</option><option value="internal">Internal</option>
        </select>
      )}
    </div>
  )
  return { rows, bar }
}

export function DocumentsTab({ me }: { me: User }) {
  const canManage = me.role === "superuser" || me.role === "sekretaris"
  const [docs, setDocs] = useState(listDocs)
  const [form, setForm] = useState<Doc | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const { rows, bar } = useFiltered(docs)
  const reload = () => setDocs(listDocs())

  return (
    <div>
      <H>{canManage ? `DOKUMEN PENTING (${docs.length})` : `DOKUMEN PANITIA (${docs.length})`}</H>
      {!canManage && <Banner tone="info">Anda dapat mengunduh dokumen publik dan internal. Pengelolaan dokumen oleh Sekretaris dan Superuser.</Banner>}
      {canManage && <PortalBox />}
      {canManage && (form ? (
        <DocForm initial={form === "new" ? null : form} me={me} onCancel={() => setForm(null)} onDone={() => { setForm(null); reload() }} />
      ) : (
        <div style={{ marginBottom: 20 }}><PrimaryButton onClick={() => setForm("new")}>+ UNGGAH DOKUMEN</PrimaryButton></div>
      ))}
      {bar(true)}
      {rows.length === 0 ? <Empty>{docs.length ? "Tidak ada dokumen yang cocok." : "Belum ada dokumen."}</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((d) => (
            <DocRow key={d.id} d={d} actions={canManage && (
              <>
                <button className="tks-btn" onClick={() => { setForm(d); window.scrollTo({ top: 0, behavior: "smooth" }) }} style={ghost}>UBAH</button>
                <button className="tks-btn" onClick={() => { write(DOC_KEY, listDocs().map((x) => (x.id === d.id ? { ...x, vis: d.vis === "internal" ? "external" : "internal", updatedAt: new Date().toISOString() } : x))); reload() }} style={ghost}>{d.vis === "internal" ? "JADIKAN PUBLIK" : "JADIKAN INTERNAL"}</button>
                <DeleteControl id={d.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus dokumen?" onDelete={() => { write(DOC_KEY, listDocs().filter((x) => x.id !== d.id)); setConfirmId(null); reload() }} />
              </>
            )} />
          ))}
        </div>
      )}
    </div>
  )
}

export function DocsPortal() {
  const token = location.hash.slice(DOC_PREFIX.length)
  const ok = portalValid(token)
  const { rows, bar } = useFiltered(ok ? listDocs() : [])
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", padding: "16px 12px 48px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
          <strong style={{ fontFamily: BC, fontSize: 20, letterSpacing: 2, color: "#fff", flex: 1 }}>DOKUMEN PANITIA · TKS 2027 PKB GPIB</strong>
          <a href={location.pathname} style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, fontSize: 13, color: "#ddd" }}>SITUS UTAMA</a>
        </div>
        {!ok ? (
          <div style={{ ...cardStyle, padding: 24, fontFamily: BB, color: "#ddd", lineHeight: 1.6 }}>Tautan tidak valid, sudah dicabut, atau dibuka di perangkat yang berbeda dari tempat dokumen disimpan. Minta tautan terbaru kepada sekretaris.</div>
        ) : (
          <>
            {bar(true)}
            {rows.length === 0 ? <Empty>Belum ada dokumen.</Empty> : <div style={{ display: "grid", gap: 10 }}>{rows.map((d) => <DocRow key={d.id} d={d} />)}</div>}
          </>
        )}
      </div>
    </div>
  )
}
