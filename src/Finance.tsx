import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  newUuid,
  readProof,
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
  rupiah,
  type FileInfo,
} from "@/Account"
import { supabase } from "@/lib/supabase"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"
const GREEN = "#66bb6a"
const RED = "#ef5350"

type Proof = FileInfo & { proofId?: string; path?: string }

export type Txn = {
  id: string
  kind: "masuk" | "keluar"
  date: string
  kategori: string
  pihak: string
  uraian: string
  jumlah: number
  metode: string
  bukti: Proof[]
  createdAt: string
  createdBy: string
  auto?: boolean
}

export const KAT_MASUK = ["Sponsor", "Donasi", "Kas Sinodal / Mupel", "Penjualan (kaos, merchandise)", "Bunga Bank", "Lainnya"]
export const KAT_KELUAR = ["Akomodasi", "Transportasi", "Konsumsi", "Lomba & Hadiah", "Perlengkapan & Dekorasi", "Kesehatan", "Dokumentasi & Publikasi", "Honor & Konsumsi Panitia", "Sewa Tempat", "Lainnya"]
const METODE = ["Transfer Bank", "Tunai", "E-Wallet"]
const BUCKET = "bukti-keuangan"
const PAY_BUCKET = "bukti-pembayaran"
const MAX_BUKTI = 10

export type FinanceTotals = { masuk: number; keluar: number; saldo: number; tanpaBukti: number }

type DbBukti = { id: string; berkas_path: string; berkas_nama: string; berkas_mime: string; berkas_ukuran: number }
type DbBayar = { berkas_path: string | null; berkas_nama: string | null; berkas_mime: string | null; berkas_ukuran: number | null }
type DbTxn = {
  id: string
  jenis: "masuk" | "keluar"
  sumber: "manual" | "pendaftaran"
  tanggal: string
  kategori: string
  pihak: string
  uraian: string
  jumlah: number | string
  metode: string
  created_at: string
  pembuat: { nama: string } | { nama: string }[] | null
  transaksi_bukti: DbBukti[] | null
  pembayaran: DbBayar | DbBayar[] | null
}

const today = () => new Date().toISOString().slice(0, 10)
const emptyTotals = (): FinanceTotals => ({ masuk: 0, keluar: 0, saldo: 0, tanpaBukti: 0 })
let cachedTotals = emptyTotals()

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function extOf(type: string) {
  return type === "application/pdf" ? "pdf" : "jpg"
}

async function signedUrls(bucket: string, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))]
  const map = new Map<string, string>()
  if (!unique.length) return map
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 60 * 60)
  throwIf(error)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}

async function uploadProof(path: string, dataUrl: string, contentType: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType })
  throwIf(error)
}

function proofOf(file: DbBukti | DbBayar, url: string, proofId?: string): Proof {
  return {
    proofId,
    path: file.berkas_path ?? undefined,
    name: file.berkas_nama || "bukti",
    type: file.berkas_mime || "application/octet-stream",
    size: file.berkas_ukuran || 0,
    data: url,
  }
}

function mapTxn(row: DbTxn, kasUrl: Map<string, string>, bayarUrl: Map<string, string>): Txn {
  const bayar = one(row.pembayaran)
  const bukti = (row.transaksi_bukti ?? [])
    .filter((file) => kasUrl.has(file.berkas_path))
    .map((file) => proofOf(file, kasUrl.get(file.berkas_path) || "", file.id))
  if (bayar?.berkas_path && bayarUrl.has(bayar.berkas_path)) bukti.push(proofOf(bayar, bayarUrl.get(bayar.berkas_path) || ""))
  return {
    id: row.id,
    kind: row.jenis,
    date: String(row.tanggal).slice(0, 10),
    kategori: row.kategori,
    pihak: row.pihak,
    uraian: row.uraian,
    jumlah: Number(row.jumlah),
    metode: row.metode,
    bukti,
    createdAt: row.created_at,
    createdBy: one(row.pembuat)?.nama || "",
    auto: row.sumber === "pendaftaran",
  }
}

export async function fetchFinanceRows(): Promise<Txn[]> {
  const { data, error } = await supabase
    .from("transaksi")
    .select(`
      id, jenis, sumber, tanggal, kategori, pihak, uraian, jumlah, metode, created_at,
      pembuat:created_by ( nama ),
      transaksi_bukti ( id, berkas_path, berkas_nama, berkas_mime, berkas_ukuran ),
      pembayaran:pembayaran_id ( berkas_path, berkas_nama, berkas_mime, berkas_ukuran )
    `)
    .order("tanggal", { ascending: false })
  throwIf(error)
  const rows = (data ?? []) as unknown as DbTxn[]
  const kasPaths = rows.flatMap((row) => (row.transaksi_bukti ?? []).map((file) => file.berkas_path))
  const bayarPaths = rows.map((row) => one(row.pembayaran)?.berkas_path || "")
  const [kasUrl, bayarUrl] = await Promise.all([signedUrls(BUCKET, kasPaths), signedUrls(PAY_BUCKET, bayarPaths)])
  return rows.map((row) => mapTxn(row, kasUrl, bayarUrl))
}

function totalsOf(rows: Txn[]): FinanceTotals {
  const masuk = rows.filter((r) => r.kind === "masuk").reduce((n, r) => n + r.jumlah, 0)
  const keluar = rows.filter((r) => r.kind === "keluar").reduce((n, r) => n + r.jumlah, 0)
  const tanpaBukti = rows.filter((r) => r.kind === "keluar" && !r.bukti.length).length
  return { masuk, keluar, saldo: masuk - keluar, tanpaBukti }
}

export function financeTotals() {
  return cachedTotals
}

export async function refreshFinanceTotals() {
  cachedTotals = totalsOf(await fetchFinanceRows())
  return cachedTotals
}

async function saveTxn(kind: "masuk" | "keluar", item: Txn, previous: Proof[], isEdit: boolean) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error("Sesi berakhir. Silakan masuk lagi.")
  const payload = {
    jenis: kind,
    sumber: "manual" as const,
    tanggal: item.date,
    kategori: item.kategori,
    pihak: item.pihak,
    uraian: item.uraian,
    jumlah: item.jumlah,
    metode: item.metode,
  }
  if (item.auto) throw new Error("Pemasukan pendaftaran mengikuti status pembayaran dan tidak dapat diubah di sini.")
  if (isEdit) {
    const { data, error } = await supabase.from("transaksi").update(payload).eq("id", item.id).eq("sumber", "manual").select("id")
    throwIf(error)
    if (!data?.length) throw new Error("Transaksi tidak dapat diubah. Hanya bendahara atau superuser yang dapat mencatat kas.")
  } else {
    const { error } = await supabase.from("transaksi").insert({ ...payload, id: item.id, created_by: user.id })
    throwIf(error)
  }
  const kept = new Set(item.bukti.map((file) => file.proofId).filter(Boolean))
  const removed = previous.filter((file) => file.proofId && file.path && !kept.has(file.proofId))
  if (removed.length) {
    const { error } = await supabase.storage.from(BUCKET).remove(removed.map((file) => file.path as string))
    throwIf(error)
    const { error: rowError } = await supabase.from("transaksi_bukti").delete().in("id", removed.map((file) => file.proofId as string))
    throwIf(rowError)
  }
  for (const file of item.bukti) {
    if (!file.data.startsWith("data:")) continue
    const id = newUuid()
    const path = `${user.id}/${item.id}/${id}.${extOf(file.type)}`
    await uploadProof(path, file.data, file.type)
    const { error } = await supabase.from("transaksi_bukti").insert({
      id,
      transaksi_id: item.id,
      berkas_path: path,
      berkas_nama: file.name,
      berkas_mime: file.type,
      berkas_ukuran: Math.max(1, file.size || 1),
    })
    throwIf(error)
  }
}

async function deleteTxn(item: Txn) {
  if (item.auto) throw new Error("Pemasukan pendaftaran dihapus otomatis jika pembayaran dibatalkan.")
  const paths = item.bukti.map((file) => file.path).filter((path): path is string => !!path)
  const { data, error } = await supabase.from("transaksi").delete().eq("id", item.id).eq("sumber", "manual").select("id")
  throwIf(error)
  if (!data?.length) throw new Error("Transaksi tidak dapat dihapus.")
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths)
    throwIf(storageError)
  }
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Proof picker (multiple files) ──────────────────────────────────────────────
export function ProofPicker({ files, onChange, error }: { files: FileInfo[]; onChange: (f: FileInfo[]) => void; error?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState("")
  const [busy, setBusy] = useState(false)

  const pick = async (list: FileList | null) => {
    if (!list?.length) return
    setBusy(true)
    setErr("")
    const added: FileInfo[] = []
    const problems: string[] = []
    for (const f of Array.from(list)) {
      if (files.length + added.length >= MAX_BUKTI) { problems.push(`Maksimal ${MAX_BUKTI} berkas bukti.`); break }
      try { added.push(await readProof(f, "Bukti")) } catch (e) { problems.push(`${f.name}: ${(e as Error).message}`) }
    }
    if (added.length) onChange([...files, ...added])
    setErr(problems.join(" "))
    setBusy(false)
  }

  return (
    <div>
      <input ref={ref} type="file" multiple accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => { pick(e.target.files); e.target.value = "" }} />
      <button type="button" className="tks-btn tks-input" onClick={() => ref.current?.click()} disabled={busy} style={{ ...inputStyle, borderStyle: "dashed", cursor: "pointer", textAlign: "center", color: "#ccc", fontFamily: BB }}>
        {busy ? "Memproses…" : `+ Unggah bukti (nota, kwitansi, transfer) — bisa lebih dari satu`}
      </button>
      {(err || error) && <div role="alert" style={{ fontFamily: BB, fontSize: 13, color: "#ff8a65", marginTop: 6 }}>{err || error}</div>}
      {files.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginTop: 10 }}>
          {files.map((f, i) => (
            <div key={i} style={{ background: "#262626", border: "1px solid #444", padding: 8, position: "relative" }}>
              {f.type === "application/pdf" ? (
                <div style={{ height: 70, display: "grid", placeItems: "center", fontFamily: BC, fontWeight: 800, color: O, letterSpacing: 2 }}>PDF</div>
              ) : (
                <img src={f.data} alt="" style={{ width: "100%", height: 70, objectFit: "cover" }} />
              )}
              <div style={{ fontFamily: BB, fontSize: 11, color: "#bbb", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
              <div style={{ fontFamily: BB, fontSize: 11, color: "#777" }}>{fmtSize(f.size)}</div>
              <button type="button" aria-label={`Hapus ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, background: "#000a", color: "#fff", border: "none", width: 22, height: 22, cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProofLinks({ files }: { files: FileInfo[] }) {
  if (!files.length) return null
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {files.map((f, i) => (
        <a key={i} href={f.data} target="_blank" rel="noreferrer" download={f.type === "application/pdf" ? f.name : undefined} style={{ display: "block" }} title={f.name}>
          {f.type === "application/pdf" ? (
            <span style={{ display: "grid", placeItems: "center", width: 56, height: 56, background: "#262626", border: "1px solid #555", fontFamily: BC, fontWeight: 800, color: O, fontSize: 13 }}>PDF</span>
          ) : (
            <img src={f.data} alt={f.name} style={{ width: 56, height: 56, objectFit: "cover", border: "1px solid #555" }} />
          )}
        </a>
      ))}
    </div>
  )
}

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)

// ── Income / Expense (same machinery) ──────────────────────────────────────────
type FormState = { date: string; kategori: string; pihak: string; uraian: string; jumlah: string; metode: string; bukti: Proof[] }
const emptyForm = (): FormState => ({ date: today(), kategori: "", pihak: "", uraian: "", jumlah: "", metode: METODE[0], bukti: [] })

function TxnTab({ kind }: { kind: "masuk" | "keluar"; me: string }) {
  const isIn = kind === "masuk"
  const kats = isIn ? KAT_MASUK : KAT_KELUAR
  const [txns, setTxns] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState<FormState>(emptyForm())
  const [editing, setEditing] = useState<Txn | null>(null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [kat, setKat] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [open, setOpen] = useState(false)
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }))
  const dateStyle = { ...inputStyle, colorScheme: "dark" } as React.CSSProperties

  const reload = useCallback(async () => {
    try {
      const rows = await fetchFinanceRows()
      cachedTotals = totalsOf(rows)
      setTxns(rows)
      setLoadError("")
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void reload() }, [reload])
  const reset = () => { setEditing(null); setF(emptyForm()); setErrs({}); setOpen(false) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    const jumlah = Number(f.jumlah)
    if (!f.date) er.date = "Wajib diisi."
    if (!f.kategori) er.kategori = "Pilih kategori."
    if (f.pihak.trim().length < 2) er.pihak = isIn ? "Isi sumber dana." : "Isi nama penerima / toko."
    if (f.uraian.trim().length < 3) er.uraian = "Isi uraian singkat."
    if (!(jumlah > 0) || !Number.isFinite(jumlah)) er.jumlah = "Jumlah harus lebih dari 0."
    setErrs(er)
    if (Object.keys(er).length) return
    const item: Txn = {
      id: editing?.id ?? newUuid(),
      kind,
      date: f.date,
      kategori: f.kategori,
      pihak: f.pihak.trim(),
      uraian: f.uraian.trim(),
      jumlah: Math.round(jumlah),
      metode: f.metode,
      bukti: f.bukti,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
      createdBy: editing?.createdBy ?? "",
    }
    setBusy(true)
    try {
      await saveTxn(kind, item, editing?.bukti ?? [], !!editing)
      setMsg(editing ? "Perubahan tersimpan." : isIn ? "Pemasukan dicatat." : "Pengeluaran dicatat.")
      reset()
      await reload()
    } catch (err) {
      setErrs({ bukti: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async (item: Txn) => {
    setBusy(true)
    try {
      await deleteTxn(item)
      setConfirmId(null)
      setMsg("Transaksi dihapus.")
      await reload()
    } catch (err) {
      setLoadError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const startEdit = (t: Txn) => {
    setEditing(t)
    setF({ date: t.date, kategori: t.kategori, pihak: t.pihak, uraian: t.uraian, jumlah: String(t.jumlah), metode: t.metode, bukti: t.bukti ?? [] })
    setErrs({})
    setOpen(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const auto = isIn ? txns.filter((t) => t.auto) : []
  const list = txns
    .filter((t) => !t.auto)
    .filter((t) => t.kind === kind)
    .filter((t) => (!kat || t.kategori === kat) && (!from || t.date >= from) && (!to || t.date <= to))
    .filter((t) => !q || [t.pihak, t.uraian, t.kategori].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const total = list.reduce((n, t) => n + t.jumlah, 0)
  const autoTotal = auto.reduce((n, r) => n + r.jumlah, 0)
  const color = isIn ? GREEN : RED

  return (
    <div>
      <H>{isIn ? "PEMASUKAN" : "PENGELUARAN"}</H>
      {loadError && <Banner tone="error">{loadError}</Banner>}
      {msg && <Banner tone="ok">{msg}</Banner>}
      {loading && <div style={{ fontFamily: BB, fontSize: 14, color: "#aaa", marginBottom: 16 }}>Memuat data keuangan…</div>}

      {isIn && (
        <div style={{ ...cardStyle, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 3, color: O }}>OTOMATIS · PENDAFTARAN PESERTA</div>
              <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb", marginTop: 2 }}>{auto.length} pembayaran terverifikasi. Masuk laporan otomatis dan tidak perlu diinput ulang.</div>
            </div>
            <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: GREEN }}>{rupiah(autoTotal)}</div>
          </div>
          {auto.length > 0 && (
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {auto.map((t) => (
                <div key={t.id} style={{ borderTop: "1px solid #333", paddingTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2, color: "#bbb" }}>{fmtDate(t.date)} · {t.pihak}</div>
                      <div style={{ fontFamily: BB, fontSize: 14, color: "#fff" }}>{t.uraian}</div>
                    </div>
                    <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: GREEN }}>+ {rupiah(t.jumlah)}</div>
                  </div>
                  <ProofLinks files={t.bukti} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!open ? (
        <div style={{ marginBottom: 20 }}>
          <PrimaryButton onClick={() => setOpen(true)}>{isIn ? "+ CATAT PEMASUKAN" : "+ CATAT PENGELUARAN"}</PrimaryButton>
        </div>
      ) : (
        <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24, borderTop: `3px solid ${color}` }}>
          <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>{editing ? "UBAH TRANSAKSI" : isIn ? "PEMASUKAN BARU" : "PENGELUARAN BARU"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
            <Field label="Tanggal" htmlFor="f-date" error={errs.date}><input id="f-date" type="date" className="tks-input" style={dateStyle} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
            <Field label="Kategori" htmlFor="f-kat" error={errs.kategori}>
              <select id="f-kat" className="tks-input" style={inputStyle} value={f.kategori} onChange={(e) => set("kategori", e.target.value)}>
                <option value="">Pilih…</option>
                {kats.map((k) => <option key={k}>{k}</option>)}
              </select>
            </Field>
            <Field label={isIn ? "Sumber Dana" : "Dibayarkan Kepada"} htmlFor="f-pihak" error={errs.pihak}><input id="f-pihak" className="tks-input" style={inputStyle} value={f.pihak} onChange={(e) => set("pihak", e.target.value)} placeholder={isIn ? "Nama sponsor / donatur / jemaat" : "Nama toko, vendor, atau penerima"} /></Field>
            <Field label="Jumlah (Rp)" htmlFor="f-jml" error={errs.jumlah} hint={Number(f.jumlah) > 0 ? rupiah(Math.round(Number(f.jumlah))) : undefined}><input id="f-jml" type="number" min={1} step={1} inputMode="numeric" className="tks-input" style={inputStyle} value={f.jumlah} onChange={(e) => set("jumlah", e.target.value)} /></Field>
            <Field label="Metode" htmlFor="f-met"><select id="f-met" className="tks-input" style={inputStyle} value={f.metode} onChange={(e) => set("metode", e.target.value)}>{METODE.map((m) => <option key={m}>{m}</option>)}</select></Field>
            <Field label="Uraian" htmlFor="f-ur" error={errs.uraian}><input id="f-ur" className="tks-input" style={inputStyle} value={f.uraian} onChange={(e) => set("uraian", e.target.value)} placeholder="Keterangan transaksi" /></Field>
          </div>
          <Field label={isIn ? "Bukti Pemasukan (opsional)" : "Bukti Pengeluaran"} hint={isIn ? undefined : "Unggah semua nota atau kwitansi. Pengeluaran tanpa bukti ditandai pada daftar dan laporan."} error={undefined}>
            <ProofPicker files={f.bukti} onChange={(b) => set("bukti", b as Proof[])} error={errs.bukti} />
          </Field>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <PrimaryButton type="submit" disabled={busy}>{busy ? "MENYIMPAN…" : editing ? "SIMPAN PERUBAHAN" : "SIMPAN"}</PrimaryButton>
            <button type="button" className="tks-btn" onClick={reset} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari uraian, pihak, kategori…" />
        <select className="tks-input" aria-label="Filter kategori" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={kat} onChange={(e) => setKat(e.target.value)}>
          <option value="">Semua kategori</option>
          {kats.map((k) => <option key={k}>{k}</option>)}
        </select>
        <input type="date" aria-label="Dari tanggal" className="tks-input" style={{ ...inputStyle, width: "auto", padding: "10px 14px", colorScheme: "dark" }} value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" aria-label="Sampai tanggal" className="tks-input" style={{ ...inputStyle, width: "auto", padding: "10px 14px", colorScheme: "dark" }} value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <p style={{ fontFamily: BB, fontSize: 13, color: "#999", margin: "0 0 14px" }}>{list.length} transaksi · total <strong style={{ color }}>{rupiah(total)}</strong></p>

      {list.length === 0 ? <Empty>{isIn ? "Belum ada pemasukan manual." : "Belum ada pengeluaran tercatat."}</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((t) => (
            <article key={t.id} style={{ ...cardStyle, padding: 16, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{fmtDate(t.date)} · {t.kategori.toUpperCase()}</div>
                  <div style={{ fontFamily: BB, fontSize: 16, color: "#fff", margin: "2px 0" }}>{t.uraian}</div>
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>{isIn ? "Dari" : "Kepada"} {t.pihak} · {t.metode}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 26, color }}>{isIn ? "+" : "−"} {rupiah(t.jumlah)}</div>
                  {!isIn && !t.bukti?.length && <Chip tone="red">BELUM ADA BUKTI</Chip>}
                </div>
              </div>
              <ProofLinks files={t.bukti ?? []} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
                <button className="tks-btn" onClick={() => startEdit(t)} style={{ ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }}>UBAH{!isIn ? " / TAMBAH BUKTI" : ""}</button>
                <DeleteControl id={t.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus transaksi ini?" onDelete={() => { void remove(t) }} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export const IncomeTab = ({ me }: { me: string }) => <TxnTab kind="masuk" me={me} />
export const ExpenseTab = ({ me }: { me: string }) => <TxnTab kind="keluar" me={me} />

// ── Report ─────────────────────────────────────────────────────────────────────
function Breakdown({ title, rows, color }: { title: string; rows: [string, number][]; color: string }) {
  const total = rows.reduce((n, [, v]) => n + v, 0)
  const max = Math.max(1, ...rows.map(([, v]) => v))
  return (
    <div style={{ ...cardStyle, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 14, letterSpacing: 2.5, color: "#fff" }}>{title}</div>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, color }}>{rupiah(total)}</div>
      </div>
      {rows.length === 0 ? <div style={{ fontFamily: BB, fontSize: 13, color: "#888" }}>Tidak ada data.</div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map(([k, v]) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: BB, fontSize: 13, color: "#ccc", gap: 8 }}>
                <span>{k}</span>
                <span>{rupiah(v)} <span style={{ color: "#888" }}>· {Math.round((v / total) * 100)}%</span></span>
              </div>
              <div style={{ height: 6, background: "#1f1f1f", marginTop: 4 }}><div style={{ width: `${(v / max) * 100}%`, height: "100%", background: color }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReportPrint({ children, onClose, title = "PRATINJAU LAPORAN KEUANGAN" }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  useEffect(() => {
    document.body.classList.add("tks-printing")
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => { document.body.classList.remove("tks-printing"); window.removeEventListener("keydown", onKey) }
  }, [onClose])
  return createPortal(
    <div className="tks-print-overlay" role="dialog" aria-label="Pratinjau laporan keuangan" style={{ position: "fixed", inset: 0, zIndex: 200, background: "#2a2a2a", overflow: "auto" }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          body.tks-printing #root { display: none !important; }
          .tks-print-overlay { position: static !important; background: #fff !important; overflow: visible !important; }
          .tks-print-bar { display: none !important; }
          .tks-paper { box-shadow: none !important; margin: 0 !important; width: auto !important; padding: 0 !important; }
          .tks-paper tr { break-inside: avoid; }
        }
      `}</style>
      <div className="tks-print-bar" style={{ position: "sticky", top: 0, zIndex: 1, background: "#1f1f1f", borderBottom: "1px solid #555", padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontFamily: BC, fontSize: 18, letterSpacing: 2, color: "#fff", flex: 1 }}>{title}</strong>
        <button className="tks-btn" onClick={() => window.print()} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK / SIMPAN PDF</button>
        <button className="tks-btn" onClick={onClose} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>TUTUP</button>
      </div>
      {children}
    </div>,
    document.body,
  )
}

export function ReportTab({ me }: { me: string }) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [preview, setPreview] = useState(false)
  const [source, setSource] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const dateStyle = { ...inputStyle, width: "auto", padding: "10px 14px", colorScheme: "dark" } as React.CSSProperties

  const reload = useCallback(async () => {
    try {
      const rows = await fetchFinanceRows()
      cachedTotals = totalsOf(rows)
      setSource(rows)
      setLoadError("")
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void reload() }, [reload])

  const rows = useMemo(() => source.filter((r) => (!from || r.date >= from) && (!to || r.date <= to)).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)), [source, from, to])
  const sum = (k: "masuk" | "keluar", pred: (r: Txn) => boolean = () => true) => rows.filter((r) => r.kind === k && pred(r)).reduce((n, r) => n + r.jumlah, 0)
  const masuk = sum("masuk")
  const keluar = sum("keluar")
  const saldo = masuk - keluar
  const byKat = (k: "masuk" | "keluar"): [string, number][] => {
    const m = new Map<string, number>()
    rows.filter((r) => r.kind === k).forEach((r) => m.set(r.kategori, (m.get(r.kategori) ?? 0) + r.jumlah))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  const noProof = rows.filter((r) => r.kind === "keluar" && !r.bukti.length)
  let run = 0
  const ledger = rows.map((r) => { run += r.kind === "masuk" ? r.jumlah : -r.jumlah; return { ...r, saldo: run } })
  const periode = from || to ? `${from ? fmtDate(from) : "Awal"} s.d. ${to ? fmtDate(to) : "Sekarang"}` : "Semua periode"

  const stat = (k: string, v: string, c: string) => (
    <div style={{ ...cardStyle, padding: "16px 20px", borderTop: `3px solid ${c}` }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2.5, color: "#999" }}>{k}</div>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: c, lineHeight: 1.3 }}>{v}</div>
    </div>
  )

  const exportCsv = () =>
    downloadCsv("laporan-keuangan-tks2027.csv", [
      ["Tanggal", "Jenis", "Kategori", "Pihak", "Uraian", "Metode", "Pemasukan", "Pengeluaran", "Saldo", "Jumlah Bukti"],
      ...ledger.map((r) => [r.date, r.kind === "masuk" ? "Pemasukan" : "Pengeluaran", r.kategori, r.pihak, r.uraian, r.metode, r.kind === "masuk" ? r.jumlah : "", r.kind === "keluar" ? r.jumlah : "", r.saldo, r.bukti.length]),
      [],
      ["", "", "", "", "TOTAL", "", masuk, keluar, saldo, ""],
    ])

  const th: React.CSSProperties = { textAlign: "left", fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2, color: "#999", padding: "8px 10px", borderBottom: "1px solid #555", whiteSpace: "nowrap" }
  const td: React.CSSProperties = { fontFamily: BB, fontSize: 13, color: "#ddd", padding: "8px 10px", borderBottom: "1px solid #3d3d3d", verticalAlign: "top" }
  const num: React.CSSProperties = { textAlign: "right", whiteSpace: "nowrap" }

  const paper = (
    <div className="tks-paper" style={{ background: "#fff", color: "#111", width: "210mm", maxWidth: "100%", margin: "24px auto", padding: "14mm", boxSizing: "border-box", fontFamily: BB, boxShadow: "0 4px 24px #0008" }}>
      <div style={{ borderBottom: `3px solid ${O}`, paddingBottom: 8, marginBottom: 14 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 24, letterSpacing: 2 }}>LAPORAN KEUANGAN · TKS 2027 PKB GPIB</div>
        <div style={{ fontSize: 13, color: "#555" }}>Periode: {periode} · Dicetak {fmtDate(today())} oleh {me}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16, fontSize: 14 }}>
        <tbody>
          {[["Total Pemasukan", masuk], ["Total Pengeluaran", keluar], ["Saldo", saldo]].map(([k, v]) => (
            <tr key={k as string}><td style={{ padding: "4px 0", fontWeight: 700 }}>{k}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(v as number)}</td></tr>
          ))}
        </tbody>
      </table>
      {([["RINGKASAN PEMASUKAN", byKat("masuk")], ["RINGKASAN PENGELUARAN", byKat("keluar")]] as [string, [string, number][]][]).map(([t, rs]) => (
        <div key={t} style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: BC, fontWeight: 800, letterSpacing: 2, fontSize: 14, marginBottom: 4 }}>{t}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <tbody>{rs.length ? rs.map(([k, v]) => <tr key={k}><td style={{ padding: "3px 0", borderBottom: "1px solid #ddd" }}>{k}</td><td style={{ textAlign: "right", borderBottom: "1px solid #ddd" }}>{rupiah(v)}</td></tr>) : <tr><td>-</td></tr>}</tbody>
          </table>
        </div>
      ))}
      <div style={{ fontFamily: BC, fontWeight: 800, letterSpacing: 2, fontSize: 14, margin: "16px 0 4px" }}>BUKU KAS</div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead><tr>{["Tanggal", "Uraian", "Masuk", "Keluar", "Saldo"].map((h) => <th key={h} style={{ textAlign: h === "Tanggal" || h === "Uraian" ? "left" : "right", borderBottom: "1.5px solid #111", padding: "4px 6px" }}>{h}</th>)}</tr></thead>
        <tbody>
          {ledger.map((r) => (
            <tr key={r.id}>
              <td style={{ padding: "3px 6px", borderBottom: "1px solid #ddd", whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
              <td style={{ padding: "3px 6px", borderBottom: "1px solid #ddd" }}>{r.kategori}: {r.uraian} <span style={{ color: "#777" }}>({r.pihak})</span></td>
              <td style={{ padding: "3px 6px", borderBottom: "1px solid #ddd", textAlign: "right" }}>{r.kind === "masuk" ? rupiah(r.jumlah) : ""}</td>
              <td style={{ padding: "3px 6px", borderBottom: "1px solid #ddd", textAlign: "right" }}>{r.kind === "keluar" ? rupiah(r.jumlah) : ""}</td>
              <td style={{ padding: "3px 6px", borderBottom: "1px solid #ddd", textAlign: "right" }}>{rupiah(r.saldo)}</td>
            </tr>
          ))}
          <tr><td colSpan={2} style={{ padding: "5px 6px", fontWeight: 700 }}>TOTAL</td><td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(masuk)}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(keluar)}</td><td style={{ textAlign: "right", fontWeight: 700 }}>{rupiah(saldo)}</td></tr>
        </tbody>
      </table>
      {noProof.length > 0 && <p style={{ fontSize: 12, color: "#a00", marginTop: 12 }}>Catatan: {noProof.length} pengeluaran belum dilengkapi bukti ({rupiah(noProof.reduce((n, r) => n + r.jumlah, 0))}).</p>}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, fontSize: 13 }}>
        <div>Mengetahui,<br /><br /><br /><br />Ketua Panitia</div>
        <div>Jakarta, {fmtDate(today())}<br /><br /><br /><br />Bendahara</div>
      </div>
    </div>
  )

  return (
    <div>
      <H>LAPORAN KEUANGAN</H>
      {loadError && <Banner tone="error">{loadError}</Banner>}
      {loading && <div style={{ fontFamily: BB, fontSize: 14, color: "#aaa", marginBottom: 16 }}>Memuat data keuangan…</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        <input type="date" aria-label="Dari tanggal" className="tks-input" style={dateStyle} value={from} onChange={(e) => setFrom(e.target.value)} />
        <span style={{ color: "#888", fontFamily: BB }}>s.d.</span>
        <input type="date" aria-label="Sampai tanggal" className="tks-input" style={dateStyle} value={to} onChange={(e) => setTo(e.target.value)} />
        {(from || to) && <button className="tks-btn" onClick={() => { setFrom(""); setTo("") }} style={{ ...smallBtn, color: "#ccc", background: "none", border: "1px solid #666" }}>RESET</button>}
        <div style={{ flex: 1 }} />
        <button className="tks-btn" onClick={exportCsv} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>EXPORT CSV</button>
        <button className="tks-btn" onClick={() => setPreview(true)} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK LAPORAN</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        {stat("TOTAL PEMASUKAN", rupiah(masuk), GREEN)}
        {stat("TOTAL PENGELUARAN", rupiah(keluar), RED)}
        {stat("SALDO", rupiah(saldo), saldo >= 0 ? O : RED)}
        {stat("PENGELUARAN TANPA BUKTI", String(noProof.length), noProof.length ? "#ffb74d" : "#888")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 28 }}>
        <Breakdown title="PEMASUKAN PER KATEGORI" rows={byKat("masuk")} color={GREEN} />
        <Breakdown title="PENGELUARAN PER KATEGORI" rows={byKat("keluar")} color={RED} />
      </div>

      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#fff", marginBottom: 10 }}>BUKU KAS ({ledger.length})</div>
      {ledger.length === 0 ? <Empty>Belum ada transaksi pada periode ini.</Empty> : (
        <div style={{ ...cardStyle, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead>
              <tr>
                <th style={th}>TANGGAL</th><th style={th}>KATEGORI</th><th style={th}>URAIAN</th>
                <th style={{ ...th, ...num }}>MASUK</th><th style={{ ...th, ...num }}>KELUAR</th><th style={{ ...th, ...num }}>SALDO</th><th style={th}>BUKTI</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((r) => (
                <tr key={r.id}>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{fmtDate(r.date)}</td>
                  <td style={td}>{r.kategori}{r.auto && <> <Chip tone="gray">OTOMATIS</Chip></>}</td>
                  <td style={td}>{r.uraian}<div style={{ color: "#888", fontSize: 12 }}>{r.pihak}</div></td>
                  <td style={{ ...td, ...num, color: GREEN }}>{r.kind === "masuk" ? rupiah(r.jumlah) : ""}</td>
                  <td style={{ ...td, ...num, color: RED }}>{r.kind === "keluar" ? rupiah(r.jumlah) : ""}</td>
                  <td style={{ ...td, ...num, color: r.saldo < 0 ? RED : "#fff" }}>{rupiah(r.saldo)}</td>
                  <td style={td}>{r.bukti.length ? `${r.bukti.length} berkas` : r.kind === "keluar" ? <span style={{ color: "#ffb74d" }}>Belum ada</span> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {preview && <ReportPrint onClose={() => setPreview(false)}>{paper}</ReportPrint>}
    </div>
  )
}
