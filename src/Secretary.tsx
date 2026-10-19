import React, { useMemo, useState } from "react"
import {
  read,
  write,
  randomId,
  listUsers,
  isStaff,
  Field,
  PrimaryButton,
  Banner,
  Chip,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  type FileInfo,
} from "@/Account"
import { ProofPicker, ProofLinks, ReportPrint } from "@/Finance"
import { COMMITTEE_KEY, type Committee } from "@/IdCards"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export const MEETING_KEY = "tks27_meetings"
export const TASK_KEY = "tks27_tasks"

export const MEETING_TYPES = ["Rapat Panitia Inti", "Rapat Koordinasi Divisi", "Rapat Pleno", "Rapat dengan Mitra / Vendor", "Lainnya"]
export const TASK_STATUS = ["Belum Dimulai", "Sedang Berjalan", "Tertunda", "Selesai"] as const
const PRIORITY = ["Rendah", "Sedang", "Tinggi"] as const
const DONE = "Selesai"

export type Meeting = {
  id: string
  nomor: string
  judul: string
  jenis: string
  tanggal: string
  mulai: string
  selesai: string
  tempat: string
  pimpinan: string
  notulis: string
  hadir: string[]
  agenda: string
  pembahasan: string
  keputusan: string
  berikutnya: string
  lampiran: FileInfo[]
  final: boolean
  createdAt: string
}
export type Task = {
  id: string
  meetingId?: string
  judul: string
  deskripsi: string
  pic: string
  divisi: string
  tenggat: string
  prioritas: string
  status: string
  catatan: string
  createdAt: string
  doneAt?: string
}

const today = () => new Date().toISOString().slice(0, 10)
const listMeetings = () => read<Meeting[]>(MEETING_KEY, []).map((m) => ({ ...m, lampiran: m.lampiran ?? [], hadir: m.hadir ?? [] }))
const listTasks = () => read<Task[]>(TASK_KEY, [])
const isLate = (t: Task) => !!t.tenggat && t.status !== DONE && t.tenggat < today()

export function secretaryStats() {
  const tasks = listTasks()
  return {
    rapat: listMeetings().length,
    aktif: tasks.filter((t) => t.status !== DONE).length,
    terlambat: tasks.filter(isLate).length,
    selesai: tasks.filter((t) => t.status === DONE).length,
  }
}

const statusTone = (s: string) => (s === DONE ? "green" : s === "Tertunda" ? "red" : s === "Sedang Berjalan" ? "orange" : "gray") as "green" | "red" | "orange" | "gray"
const prioColor = (p: string) => (p === "Tinggi" ? "#ef5350" : p === "Sedang" ? "#ffb74d" : "#90a4ae")

function picOptions(): string[] {
  const committee = read<Committee[]>(COMMITTEE_KEY, []).map((c) => c.nama)
  const staff = listUsers().filter((u) => isStaff(u)).map((u) => u.name)
  return [...new Set([...committee, ...staff])].sort()
}

const dateStyle = { ...inputStyle, colorScheme: "dark" } as React.CSSProperties
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)
const ghost: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }
const solid: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Task form ──────────────────────────────────────────────────────────────────
function TaskForm({ initial, meetings, fixedMeetingId, onSave, onCancel }: { initial: Task | null; meetings: Meeting[]; fixedMeetingId?: string; onSave: (t: Task) => void; onCancel: () => void }) {
  const [f, setF] = useState({
    judul: initial?.judul ?? "",
    deskripsi: initial?.deskripsi ?? "",
    pic: initial?.pic ?? "",
    divisi: initial?.divisi ?? "",
    tenggat: initial?.tenggat ?? "",
    prioritas: initial?.prioritas ?? "Sedang",
    status: initial?.status ?? TASK_STATUS[0],
    catatan: initial?.catatan ?? "",
    meetingId: initial?.meetingId ?? fixedMeetingId ?? "",
  })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const options = useMemo(picOptions, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.judul.trim().length < 3) er.judul = "Isi judul tugas."
    if (!f.pic.trim()) er.pic = "Tentukan PIC."
    if (!f.tenggat) er.tenggat = "Isi tenggat."
    setErrs(er)
    if (Object.keys(er).length) return
    onSave({
      id: initial?.id ?? randomId(),
      meetingId: f.meetingId || undefined,
      judul: f.judul.trim(),
      deskripsi: f.deskripsi.trim(),
      pic: f.pic.trim(),
      divisi: f.divisi.trim(),
      tenggat: f.tenggat,
      prioritas: f.prioritas,
      status: f.status,
      catatan: f.catatan.trim(),
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      doneAt: f.status === DONE ? initial?.doneAt ?? new Date().toISOString() : undefined,
    })
  }

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 20, borderTop: `3px solid ${O}` }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>{initial ? "UBAH TUGAS" : "TUGAS BARU"}</div>
      <datalist id="pic-list">{options.map((o) => <option key={o} value={o} />)}</datalist>
      <Field label="Judul Tugas" htmlFor="tk-judul" error={errs.judul}><input id="tk-judul" className="tks-input" style={inputStyle} value={f.judul} onChange={(e) => set("judul", e.target.value)} /></Field>
      <Field label="Deskripsi" htmlFor="tk-desc"><textarea id="tk-desc" rows={2} className="tks-input" style={{ ...inputStyle, resize: "vertical" }} value={f.deskripsi} onChange={(e) => set("deskripsi", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="PIC (Penanggung Jawab)" htmlFor="tk-pic" error={errs.pic} hint="Pilih dari panitia atau ketik nama."><input id="tk-pic" list="pic-list" className="tks-input" style={inputStyle} value={f.pic} onChange={(e) => set("pic", e.target.value)} /></Field>
        <Field label="Divisi" htmlFor="tk-div"><input id="tk-div" className="tks-input" style={inputStyle} value={f.divisi} onChange={(e) => set("divisi", e.target.value)} placeholder="Opsional" /></Field>
        <Field label="Tenggat" htmlFor="tk-due" error={errs.tenggat}><input id="tk-due" type="date" className="tks-input" style={dateStyle} value={f.tenggat} onChange={(e) => set("tenggat", e.target.value)} /></Field>
        <Field label="Prioritas" htmlFor="tk-prio"><select id="tk-prio" className="tks-input" style={inputStyle} value={f.prioritas} onChange={(e) => set("prioritas", e.target.value)}>{PRIORITY.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Status" htmlFor="tk-st"><select id="tk-st" className="tks-input" style={inputStyle} value={f.status} onChange={(e) => set("status", e.target.value)}>{TASK_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        {!fixedMeetingId && (
          <Field label="Berasal dari Rapat" htmlFor="tk-mt">
            <select id="tk-mt" className="tks-input" style={inputStyle} value={f.meetingId} onChange={(e) => set("meetingId", e.target.value)}>
              <option value="">— Tidak terkait rapat —</option>
              {meetings.map((m) => <option key={m.id} value={m.id}>{m.nomor} · {m.judul}</option>)}
            </select>
          </Field>
        )}
      </div>
      <Field label="Catatan Progres" htmlFor="tk-note"><input id="tk-note" className="tks-input" style={inputStyle} value={f.catatan} onChange={(e) => set("catatan", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">{initial ? "SIMPAN" : "TAMBAH TUGAS"}</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onCancel} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

function TaskCard({ t, meeting, onChange, onEdit, onDelete, confirmId, setConfirmId }: { t: Task; meeting?: Meeting; onChange: (t: Task) => void; onEdit: () => void; onDelete: () => void; confirmId: string | null; setConfirmId: (v: string | null) => void }) {
  const late = isLate(t)
  return (
    <article style={{ ...cardStyle, padding: 16, borderLeft: `3px solid ${prioColor(t.prioritas)}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: BB, fontSize: 16, color: "#fff", textDecoration: t.status === DONE ? "line-through" : "none", opacity: t.status === DONE ? 0.7 : 1 }}>{t.judul}</div>
          {t.deskripsi && <div style={{ fontFamily: BB, fontSize: 13, color: "#aaa", marginTop: 2 }}>{t.deskripsi}</div>}
          <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>PIC: <strong style={{ color: "#fff" }}>{t.pic}</strong>{t.divisi && ` · ${t.divisi}`}</span>
            <span style={{ color: late ? "#ef9a9a" : "#bbb" }}>Tenggat: {fmtDate(t.tenggat)}{late && " (terlambat)"}</span>
            <span style={{ color: prioColor(t.prioritas) }}>Prioritas {t.prioritas}</span>
            {meeting && <span>Rapat: {meeting.nomor}</span>}
          </div>
          {t.catatan && <div style={{ fontFamily: BB, fontSize: 13, color: "#999", marginTop: 4 }}>Catatan: {t.catatan}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          <Chip tone={late ? "red" : statusTone(t.status)}>{(late ? "TERLAMBAT" : t.status).toUpperCase()}</Chip>
          <select aria-label={`Status ${t.judul}`} className="tks-input" style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 13 }} value={t.status} onChange={(e) => onChange({ ...t, status: e.target.value, doneAt: e.target.value === DONE ? new Date().toISOString() : undefined })}>
            {TASK_STATUS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
        <button className="tks-btn" onClick={onEdit} style={ghost}>UBAH</button>
        <DeleteControl id={t.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus tugas?" onDelete={onDelete} />
      </div>
    </article>
  )
}

function saveTask(t: Task) {
  const all = listTasks()
  write(TASK_KEY, all.some((x) => x.id === t.id) ? all.map((x) => (x.id === t.id ? t : x)) : [...all, t])
}

// ── Tasks tab ──────────────────────────────────────────────────────────────────
export function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>(listTasks)
  const meetings = useMemo(listMeetings, [])
  const [form, setForm] = useState<Task | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [pic, setPic] = useState("")
  const [meeting, setMeeting] = useState("")
  const reload = () => setTasks(listTasks())

  const pics = [...new Set(tasks.map((t) => t.pic))].sort()
  const list = tasks
    .filter((t) => (!status || (status === "TERLAMBAT" ? isLate(t) : t.status === status)) && (!pic || t.pic === pic) && (!meeting || t.meetingId === meeting))
    .filter((t) => !q || [t.judul, t.deskripsi, t.pic, t.divisi].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => Number(a.status === DONE) - Number(b.status === DONE) || a.tenggat.localeCompare(b.tenggat))

  const counts = TASK_STATUS.map((s) => [s, tasks.filter((t) => t.status === s).length] as const)
  const late = tasks.filter(isLate).length

  return (
    <div>
      <H>TUGAS & TINDAK LANJUT ({tasks.length})</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>
        {counts.map(([s, n]) => (
          <button key={s} className="tks-btn" onClick={() => setStatus(status === s ? "" : s)} style={{ ...cardStyle, padding: "12px 16px", textAlign: "left", cursor: "pointer", outline: status === s ? `2px solid ${O}` : "none" }}>
            <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 2.5, color: "#999" }}>{s.toUpperCase()}</div>
            <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: s === DONE ? "#66bb6a" : "#fff" }}>{n}</div>
          </button>
        ))}
        <button className="tks-btn" onClick={() => setStatus(status === "TERLAMBAT" ? "" : "TERLAMBAT")} style={{ ...cardStyle, padding: "12px 16px", textAlign: "left", cursor: "pointer", outline: status === "TERLAMBAT" ? `2px solid ${O}` : "none" }}>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 2.5, color: "#999" }}>TERLAMBAT</div>
          <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: late ? "#ef5350" : "#fff" }}>{late}</div>
        </button>
      </div>

      {form ? (
        <TaskForm initial={form === "new" ? null : form} meetings={meetings} onCancel={() => setForm(null)} onSave={(t) => { saveTask(t); setForm(null); reload() }} />
      ) : (
        <div style={{ marginBottom: 16 }}><PrimaryButton onClick={() => setForm("new")}>+ TUGAS BARU</PrimaryButton></div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari tugas, PIC, divisi…" />
        <select className="tks-input" aria-label="Filter PIC" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={pic} onChange={(e) => setPic(e.target.value)}>
          <option value="">Semua PIC</option>{pics.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="tks-input" aria-label="Filter rapat" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={meeting} onChange={(e) => setMeeting(e.target.value)}>
          <option value="">Semua rapat</option>{meetings.map((m) => <option key={m.id} value={m.id}>{m.nomor}</option>)}
        </select>
        <button className="tks-btn" onClick={() => downloadCsv("tugas-tks2027.csv", [["Tugas", "Deskripsi", "PIC", "Divisi", "Tenggat", "Prioritas", "Status", "Rapat", "Catatan"], ...list.map((t) => [t.judul, t.deskripsi, t.pic, t.divisi, t.tenggat, t.prioritas, t.status, meetings.find((m) => m.id === t.meetingId)?.nomor ?? "", t.catatan])])} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>EXPORT CSV</button>
      </div>

      {list.length === 0 ? <Empty>Tidak ada tugas yang cocok.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((t) => (
            <TaskCard key={t.id} t={t} meeting={meetings.find((m) => m.id === t.meetingId)} confirmId={confirmId} setConfirmId={setConfirmId}
              onChange={(n) => { saveTask(n); reload() }} onEdit={() => { setForm(t); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              onDelete={() => { write(TASK_KEY, listTasks().filter((x) => x.id !== t.id)); setConfirmId(null); reload() }} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Meeting form ───────────────────────────────────────────────────────────────
type MForm = Omit<Meeting, "id" | "nomor" | "final" | "createdAt">

function MeetingForm({ initial, me, onSave, onCancel }: { initial: Meeting | null; me: string; onSave: (m: MForm) => void; onCancel: () => void }) {
  const [f, setF] = useState<MForm>({
    judul: initial?.judul ?? "",
    jenis: initial?.jenis ?? MEETING_TYPES[0],
    tanggal: initial?.tanggal ?? today(),
    mulai: initial?.mulai ?? "",
    selesai: initial?.selesai ?? "",
    tempat: initial?.tempat ?? "",
    pimpinan: initial?.pimpinan ?? "",
    notulis: initial?.notulis ?? me,
    hadir: initial?.hadir ?? [],
    agenda: initial?.agenda ?? "",
    pembahasan: initial?.pembahasan ?? "",
    keputusan: initial?.keputusan ?? "",
    berikutnya: initial?.berikutnya ?? "",
    lampiran: initial?.lampiran ?? [],
  })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [name, setName] = useState("")
  const options = useMemo(picOptions, [])
  const set = <K extends keyof MForm>(k: K, v: MForm[K]) => setF((s) => ({ ...s, [k]: v }))
  const addHadir = (n: string) => {
    const v = n.trim()
    if (v && !f.hadir.includes(v)) set("hadir", [...f.hadir, v])
    setName("")
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.judul.trim().length < 3) er.judul = "Isi judul rapat."
    if (!f.tanggal) er.tanggal = "Wajib diisi."
    if (f.mulai && f.selesai && f.selesai < f.mulai) er.selesai = "Jam selesai sebelum jam mulai."
    if (!f.pimpinan.trim()) er.pimpinan = "Isi pimpinan rapat."
    if (!f.hadir.length) er.hadir = "Tambahkan minimal satu peserta hadir."
    if (!f.pembahasan.trim()) er.pembahasan = "Isi pembahasan."
    setErrs(er)
    if (Object.keys(er).length) return
    onSave({ ...f, judul: f.judul.trim(), tempat: f.tempat.trim(), pimpinan: f.pimpinan.trim(), notulis: f.notulis.trim() })
  }

  const ta = (k: "agenda" | "pembahasan" | "keputusan", rows: number) => (
    <textarea id={`m-${k}`} rows={rows} className="tks-input" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} value={f[k]} onChange={(e) => set(k, e.target.value)} />
  )

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 24, maxWidth: 860 }}>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: 1, margin: "0 0 20px" }}>{initial ? `UBAH ${initial.nomor}` : "NOTULENSI RAPAT BARU"}</h2>
      <Field label="Judul Rapat" htmlFor="m-judul" error={errs.judul}><input id="m-judul" className="tks-input" style={inputStyle} value={f.judul} onChange={(e) => set("judul", e.target.value)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Jenis Rapat" htmlFor="m-jenis"><select id="m-jenis" className="tks-input" style={inputStyle} value={f.jenis} onChange={(e) => set("jenis", e.target.value)}>{MEETING_TYPES.map((j) => <option key={j}>{j}</option>)}</select></Field>
        <Field label="Tanggal" htmlFor="m-tgl" error={errs.tanggal}><input id="m-tgl" type="date" className="tks-input" style={dateStyle} value={f.tanggal} onChange={(e) => set("tanggal", e.target.value)} /></Field>
        <Field label="Jam Mulai" htmlFor="m-mulai"><input id="m-mulai" type="time" className="tks-input" style={dateStyle} value={f.mulai} onChange={(e) => set("mulai", e.target.value)} /></Field>
        <Field label="Jam Selesai" htmlFor="m-sel" error={errs.selesai}><input id="m-sel" type="time" className="tks-input" style={dateStyle} value={f.selesai} onChange={(e) => set("selesai", e.target.value)} /></Field>
        <Field label="Tempat / Tautan Rapat" htmlFor="m-tempat"><input id="m-tempat" className="tks-input" style={inputStyle} value={f.tempat} onChange={(e) => set("tempat", e.target.value)} placeholder="Ruang rapat atau tautan Zoom/Meet" /></Field>
        <Field label="Pimpinan Rapat" htmlFor="m-pim" error={errs.pimpinan}><input id="m-pim" list="m-names" className="tks-input" style={inputStyle} value={f.pimpinan} onChange={(e) => set("pimpinan", e.target.value)} /></Field>
        <Field label="Notulis" htmlFor="m-not"><input id="m-not" list="m-names" className="tks-input" style={inputStyle} value={f.notulis} onChange={(e) => set("notulis", e.target.value)} /></Field>
        <Field label="Rapat Berikutnya" htmlFor="m-next"><input id="m-next" type="date" className="tks-input" style={dateStyle} value={f.berikutnya} onChange={(e) => set("berikutnya", e.target.value)} /></Field>
      </div>
      <datalist id="m-names">{options.map((o) => <option key={o} value={o} />)}</datalist>

      <Field label={`Peserta Hadir (${f.hadir.length})`} error={errs.hadir} hint="Pilih dari daftar panitia atau ketik nama lalu tekan Enter.">
        <div style={{ display: "flex", gap: 8 }}>
          <input aria-label="Tambah peserta hadir" list="m-names" className="tks-input" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHadir(name) } }} placeholder="Nama peserta" />
          <button type="button" className="tks-btn" onClick={() => addHadir(name)} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>TAMBAH</button>
          {options.length > 0 && <button type="button" className="tks-btn" onClick={() => set("hadir", [...new Set([...f.hadir, ...options])])} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}`, whiteSpace: "nowrap" }}>SEMUA PANITIA</button>}
        </div>
        {f.hadir.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {f.hadir.map((h) => (
              <span key={h} style={{ fontFamily: BB, fontSize: 13, color: "#eee", background: "#262626", border: "1px solid #555", padding: "4px 6px 4px 10px", display: "inline-flex", gap: 6, alignItems: "center" }}>
                {h}<button type="button" aria-label={`Hapus ${h}`} onClick={() => set("hadir", f.hadir.filter((x) => x !== h))} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <Field label="Agenda" htmlFor="m-agenda" hint="Satu agenda per baris.">{ta("agenda", 3)}</Field>
      <Field label="Pembahasan" htmlFor="m-pembahasan" error={errs.pembahasan}>{ta("pembahasan", 8)}</Field>
      <Field label="Keputusan / Kesimpulan" htmlFor="m-keputusan">{ta("keputusan", 4)}</Field>
      <Field label="Lampiran (opsional)" hint="Daftar hadir, presentasi, foto rapat. JPG, PNG, atau PDF."><ProofPicker files={f.lampiran} onChange={(l) => set("lampiran", l)} /></Field>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">{initial ? "SIMPAN PERUBAHAN" : "SIMPAN NOTULENSI"}</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onCancel} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

export function MinutesPaper({ m, tasks }: { m: Meeting; tasks: Task[] }) {
  const sorted = tasks
  const agenda = m.agenda.split("\n").map((s) => s.trim()).filter(Boolean)
  return (
  <div className="tks-paper" style={{ background: "#fff", color: "#111", width: "210mm", maxWidth: "100%", margin: "24px auto", padding: "14mm", boxSizing: "border-box", fontFamily: BB, boxShadow: "0 4px 24px #0008", fontSize: 13, lineHeight: 1.6 }}>
    <div style={{ borderBottom: `3px solid ${O}`, paddingBottom: 8, marginBottom: 14, textAlign: "center" }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2 }}>NOTULENSI RAPAT</div>
      <div style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, color: "#555" }}>PANITIA TKS 2027 PKB GPIB</div>
      <div style={{ fontSize: 12, color: "#555" }}>Nomor: {m.nomor}</div>
    </div>
    <table style={{ width: "100%", fontSize: 13, marginBottom: 12 }}>
      <tbody>
        {[["Judul", m.judul], ["Jenis", m.jenis], ["Hari / Tanggal", fmtDate(m.tanggal)], ["Waktu", `${m.mulai || "-"} s.d. ${m.selesai || "selesai"}`], ["Tempat", m.tempat || "-"], ["Pimpinan Rapat", m.pimpinan], ["Notulis", m.notulis]].map(([k, v]) => (
          <tr key={k}><td style={{ width: 130, padding: "2px 0", verticalAlign: "top", fontWeight: 700 }}>{k}</td><td style={{ padding: "2px 0" }}>: {v}</td></tr>
        ))}
      </tbody>
    </table>
    <div style={{ marginBottom: 10 }}><strong>Peserta hadir ({m.hadir.length}):</strong> {m.hadir.join(", ")}</div>
    {agenda.length > 0 && <div style={{ marginBottom: 10 }}><strong>Agenda:</strong><ol style={{ margin: "2px 0 0 18px", padding: 0 }}>{agenda.map((a, i) => <li key={i}>{a}</li>)}</ol></div>}
    <div style={{ marginBottom: 10 }}><strong>Pembahasan:</strong><div style={{ whiteSpace: "pre-wrap" }}>{m.pembahasan}</div></div>
    {m.keputusan.trim() && <div style={{ marginBottom: 10 }}><strong>Keputusan:</strong><div style={{ whiteSpace: "pre-wrap" }}>{m.keputusan}</div></div>}
    {sorted.length > 0 && (
      <div style={{ marginBottom: 10 }}>
        <strong>Tindak Lanjut:</strong>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 4 }}>
          <thead><tr>{["No", "Tugas", "PIC", "Tenggat", "Status"].map((h) => <th key={h} style={{ border: "1px solid #999", padding: "3px 6px", textAlign: "left", background: "#f2f2f2" }}>{h}</th>)}</tr></thead>
          <tbody>{sorted.map((t, i) => <tr key={t.id}>{[i + 1, t.judul, t.pic, fmtDate(t.tenggat), t.status].map((c, j) => <td key={j} style={{ border: "1px solid #999", padding: "3px 6px" }}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    )}
    {m.berikutnya && <div style={{ marginBottom: 10 }}><strong>Rapat berikutnya:</strong> {fmtDate(m.berikutnya)}</div>}
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 44 }}>
      <div style={{ textAlign: "center" }}>Pimpinan Rapat<br /><br /><br /><br /><u>{m.pimpinan}</u></div>
      <div style={{ textAlign: "center" }}>Notulis<br /><br /><br /><br /><u>{m.notulis}</u></div>
    </div>
  </div>
  )
}

// ── Public share link (data lives in the URL fragment; no login, no server) ───
export const SHARE_PREFIX = "#/notulen/"
type Shared = { m: Omit<Meeting, "lampiran" | "id" | "createdAt">; t: Pick<Task, "judul" | "pic" | "tenggat" | "status">[] }

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const w = stream.writable.getWriter()
  w.write(data as BufferSource)
  w.close()
  return new Uint8Array(await new Response(stream.readable).arrayBuffer())
}

export async function packJson(o: unknown) {
  const raw = new TextEncoder().encode(JSON.stringify(o))
  return typeof CompressionStream !== "undefined" ? "z" + toB64(await pipe(raw, new CompressionStream("deflate-raw"))) : "r" + toB64(raw)
}
export async function unpackJson<T>(body: string): Promise<T> {
  const bytes = fromB64(body.slice(1))
  const raw = body[0] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes
  return JSON.parse(new TextDecoder().decode(raw)) as T
}

export async function buildShareLink(m: Meeting, tasks: Task[]) {
  const { lampiran, id, createdAt, ...rest } = m
  const payload: Shared = { m: rest, t: tasks.map((t) => ({ judul: t.judul, pic: t.pic, tenggat: t.tenggat, status: t.status })) }
  const raw = new TextEncoder().encode(JSON.stringify(payload))
  const packed = typeof CompressionStream !== "undefined" ? "z" + toB64(await pipe(raw, new CompressionStream("deflate-raw"))) : "r" + toB64(raw)
  return `${location.origin}${location.pathname}${SHARE_PREFIX}${packed}`
}

async function parseShare(hash: string): Promise<Shared> {
  const body = hash.slice(SHARE_PREFIX.length)
  const bytes = fromB64(body.slice(1))
  const raw = body[0] === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : bytes
  const d = JSON.parse(new TextDecoder().decode(raw)) as Shared
  if (!d?.m?.judul) throw new Error("bad")
  return d
}

export function SharedMinutes() {
  const [data, setData] = useState<Shared | null>(null)
  const [err, setErr] = useState(false)
  React.useEffect(() => {
    parseShare(location.hash).then(setData).catch(() => setErr(true))
  }, [])
  const m = data && ({ ...data.m, id: "", createdAt: "", lampiran: [], hadir: data.m.hadir ?? [] } as Meeting)
  const tasks = (data?.t ?? []).map((t, i) => ({ ...t, id: String(i), deskripsi: "", divisi: "", prioritas: "", catatan: "", createdAt: "" })) as Task[]
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", padding: "16px 12px 48px" }}>
      <style>{`@media print { .tks-share-bar { display: none !important } .tks-paper { box-shadow: none !important; margin: 0 !important; width: auto !important; padding: 0 !important } body { background: #fff !important } }`}</style>
      <div className="tks-share-bar" style={{ maxWidth: 794, margin: "0 auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontFamily: BC, fontSize: 18, letterSpacing: 2, color: "#fff", flex: 1 }}>NOTULENSI RAPAT · TKS 2027</strong>
        {m && <button className="tks-btn" onClick={() => window.print()} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK / SIMPAN PDF</button>}
        <a href={location.pathname} style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, fontSize: 13, color: "#ddd" }}>SITUS UTAMA</a>
      </div>
      {err && <div style={{ ...cardStyle, maxWidth: 560, margin: "40px auto", padding: 24, fontFamily: BB, color: "#ddd" }}>Tautan notulensi tidak valid atau terpotong. Minta tautan baru kepada sekretaris.</div>}
      {!m && !err && <div style={{ fontFamily: BB, color: "#aaa", textAlign: "center", marginTop: 60 }}>Memuat notulensi…</div>}
      {m && <MinutesPaper m={m} tasks={tasks} />}
    </div>
  )
}

function ShareBox({ m, tasks }: { m: Meeting; tasks: Task[] }) {
  const [link, setLink] = useState("")
  const [copied, setCopied] = useState(false)
  const make = async () => { setLink(await buildShareLink(m, tasks)); setCopied(false) }
  const copy = async () => {
    try { await navigator.clipboard.writeText(link) } catch { document.querySelector<HTMLInputElement>("#share-link")?.select(); document.execCommand("copy") }
    setCopied(true)
  }
  const wa = `https://wa.me/?text=${encodeURIComponent(`Notulensi rapat "${m.judul}" (${fmtDate(m.tanggal)}):\n${link}`)}`
  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 20, borderLeft: `3px solid ${O}` }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, marginBottom: 6 }}>BAGIKAN KE PESERTA RAPAT</div>
      <p style={{ fontFamily: BB, fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.6 }}>Tautan membuka halaman notulensi tanpa login. Isi notulensi dan tugas tersimpan di dalam tautan pada saat dibuat (lampiran tidak ikut). Jika notulensi diubah, buat tautan baru dan kirim ulang.</p>
      {!link ? <PrimaryButton onClick={make}>BUAT TAUTAN</PrimaryButton> : (
        <>
          <input id="share-link" readOnly aria-label="Tautan notulensi" className="tks-input" style={{ ...inputStyle, fontSize: 12 }} value={link} onFocus={(e) => e.currentTarget.select()} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
            <button className="tks-btn" onClick={copy} style={solid}>{copied ? "TERSALIN ✓" : "SALIN TAUTAN"}</button>
            <a className="tks-btn" href={wa} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>KIRIM VIA WHATSAPP</a>
            <a className="tks-btn" href={link} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>BUKA HALAMAN</a>
            <button className="tks-btn" onClick={make} style={ghost}>PERBARUI</button>
          </div>
          {link.length > 6000 && <div style={{ fontFamily: BB, fontSize: 12, color: "#ffb74d", marginTop: 8 }}>Tautan cukup panjang; sebagian aplikasi chat bisa memotongnya. Kirim lewat salin-tempel.</div>}
        </>
      )}
    </div>
  )
}

// ── Meeting detail ─────────────────────────────────────────────────────────────
function MeetingDetail({ m, meetings, onBack, onEdit, onChanged }: { m: Meeting; meetings: Meeting[]; onBack: () => void; onEdit: () => void; onChanged: () => void }) {
  const [tasks, setTasks] = useState(() => listTasks().filter((t) => t.meetingId === m.id))
  const [form, setForm] = useState<Task | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const reload = () => setTasks(listTasks().filter((t) => t.meetingId === m.id))
  const sorted = [...tasks].sort((a, b) => a.tenggat.localeCompare(b.tenggat))
  const agenda = m.agenda.split("\n").map((s) => s.trim()).filter(Boolean)

  const toggleFinal = () => {
    write(MEETING_KEY, listMeetings().map((x) => (x.id === m.id ? { ...x, final: !x.final } : x)))
    onChanged()
  }
  const del = () => {
    write(MEETING_KEY, listMeetings().filter((x) => x.id !== m.id))
    write(TASK_KEY, listTasks().filter((t) => t.meetingId !== m.id))
    setConfirmDel(null)
    onChanged()
    onBack()
  }

  const block = (title: string, body: string) =>
    body.trim() && (
      <section style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: BB, fontSize: 15, color: "#ddd", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{body}</div>
      </section>
    )

  const paper = <MinutesPaper m={m} tasks={sorted} />

  return (
    <div>
      <button className="tks-btn" onClick={onBack} style={{ ...ghost, marginBottom: 16 }}>← DAFTAR RAPAT</button>
      <div style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 3, color: O }}>{m.nomor} · {m.jenis.toUpperCase()}</div>
          <Chip tone={m.final ? "green" : "orange"}>{m.final ? "FINAL" : "DRAF"}</Chip>
        </div>
        <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 32, color: "#fff", letterSpacing: 1, margin: "0 0 12px" }}>{m.judul}</h2>
        <div style={{ fontFamily: BB, fontSize: 14, color: "#bbb", lineHeight: 1.8, marginBottom: 20 }}>
          {fmtDate(m.tanggal)}{m.mulai && ` · ${m.mulai}${m.selesai ? ` – ${m.selesai}` : ""}`}{m.tempat && ` · ${m.tempat}`}<br />
          Pimpinan: <strong style={{ color: "#fff" }}>{m.pimpinan}</strong> · Notulis: <strong style={{ color: "#fff" }}>{m.notulis}</strong>
          {m.berikutnya && <><br />Rapat berikutnya: {fmtDate(m.berikutnya)}</>}
        </div>
        {block(`PESERTA HADIR (${m.hadir.length})`, m.hadir.join(", "))}
        {agenda.length > 0 && block("AGENDA", agenda.map((a, i) => `${i + 1}. ${a}`).join("\n"))}
        {block("PEMBAHASAN", m.pembahasan)}
        {block("KEPUTUSAN", m.keputusan)}
        {m.lampiran.length > 0 && <section style={{ marginBottom: 22 }}><div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O }}>LAMPIRAN</div><ProofLinks files={m.lampiran} /></section>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", borderTop: "1px solid #444", paddingTop: 16 }}>
          <button className="tks-btn" onClick={() => setPreview(true)} style={solid}>CETAK NOTULEN</button>
          <button className="tks-btn" onClick={onEdit} style={ghost}>UBAH</button>
          <button className="tks-btn" onClick={toggleFinal} style={{ ...ghost, color: m.final ? "#ddd" : "#a5d6a7", borderColor: m.final ? "#666" : "#2e7d32" }}>{m.final ? "BUKA KEMBALI (DRAF)" : "TETAPKAN FINAL"}</button>
          <DeleteControl id={m.id} confirmId={confirmDel} setConfirmId={setConfirmDel} label={`Hapus notulensi dan ${tasks.length} tugasnya?`} onDelete={del} />
        </div>
      </div>

      <ShareBox m={m} tasks={sorted} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <H>TINDAK LANJUT ({tasks.length})</H>
        {!form && <PrimaryButton onClick={() => setForm("new")}>+ TUGAS DARI RAPAT INI</PrimaryButton>}
      </div>
      {form && <TaskForm initial={form === "new" ? null : form} meetings={meetings} fixedMeetingId={m.id} onCancel={() => setForm(null)} onSave={(t) => { saveTask(t); setForm(null); reload() }} />}
      {sorted.length === 0 ? <Empty>Belum ada tugas dari rapat ini.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {sorted.map((t) => (
            <TaskCard key={t.id} t={t} confirmId={confirmId} setConfirmId={setConfirmId} onChange={(n) => { saveTask(n); reload() }} onEdit={() => setForm(t)}
              onDelete={() => { write(TASK_KEY, listTasks().filter((x) => x.id !== t.id)); setConfirmId(null); reload() }} />
          ))}
        </div>
      )}
      {preview && <ReportPrint title="PRATINJAU NOTULEN" onClose={() => setPreview(false)}>{paper}</ReportPrint>}
    </div>
  )
}

// ── Meetings tab ───────────────────────────────────────────────────────────────
export function MeetingsTab({ me }: { me: string }) {
  const [meetings, setMeetings] = useState<Meeting[]>(listMeetings)
  const [view, setView] = useState<{ mode: "list" } | { mode: "form"; edit: Meeting | null } | { mode: "detail"; id: string }>({ mode: "list" })
  const [q, setQ] = useState("")
  const [jenis, setJenis] = useState("")
  const [state, setState] = useState("")
  const reload = () => setMeetings(listMeetings())

  if (view.mode === "form") {
    return (
      <MeetingForm initial={view.edit} me={me} onCancel={() => setView(view.edit ? { mode: "detail", id: view.edit.id } : { mode: "list" })}
        onSave={(f) => {
          const all = listMeetings()
          let id = view.edit?.id
          if (view.edit) {
            write(MEETING_KEY, all.map((x) => (x.id === id ? { ...x, ...f } : x)))
          } else {
            id = randomId()
            const year = f.tanggal.slice(0, 4)
            const n = all.filter((x) => x.nomor.includes(`/${year}`)).length + 1
            write(MEETING_KEY, [...all, { ...f, id, nomor: `RPT/${String(n).padStart(3, "0")}/${year}`, final: false, createdAt: new Date().toISOString() }])
          }
          reload()
          window.scrollTo({ top: 0 })
          setView({ mode: "detail", id: id! })
        }} />
    )
  }

  if (view.mode === "detail") {
    const m = meetings.find((x) => x.id === view.id)
    if (m) return <MeetingDetail m={m} meetings={meetings} onBack={() => setView({ mode: "list" })} onEdit={() => setView({ mode: "form", edit: m })} onChanged={reload} />
  }

  const taskCount = (id: string) => { const ts = listTasks().filter((t) => t.meetingId === id); return [ts.length, ts.filter((t) => t.status === DONE).length] as const }
  const list = meetings
    .filter((m) => (!jenis || m.jenis === jenis) && (!state || (state === "final") === m.final))
    .filter((m) => !q || [m.judul, m.nomor, m.pembahasan, m.keputusan, m.pimpinan, ...m.hadir].some((v) => v.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.createdAt.localeCompare(a.createdAt))

  return (
    <div>
      <H>NOTULENSI RAPAT ({meetings.length})</H>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <PrimaryButton onClick={() => setView({ mode: "form", edit: null })}>+ NOTULENSI BARU</PrimaryButton>
        <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari judul, nomor, isi, peserta…" />
        <select className="tks-input" aria-label="Filter jenis" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={jenis} onChange={(e) => setJenis(e.target.value)}>
          <option value="">Semua jenis</option>{MEETING_TYPES.map((j) => <option key={j}>{j}</option>)}
        </select>
        <select className="tks-input" aria-label="Filter status" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Draf & Final</option><option value="draf">Draf</option><option value="final">Final</option>
        </select>
      </div>
      {list.length === 0 ? <Empty>{meetings.length ? "Tidak ada notulensi yang cocok." : "Belum ada notulensi rapat."}</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((m) => {
            const [n, d] = taskCount(m.id)
            return (
              <article key={m.id} style={{ ...cardStyle, padding: 16, display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{m.nomor} · {fmtDate(m.tanggal)} · {m.jenis.toUpperCase()}</div>
                  <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff" }}>{m.judul}</div>
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>Pimpinan {m.pimpinan} · {m.hadir.length} hadir · Tugas {d}/{n} selesai</div>
                </div>
                <Chip tone={m.final ? "green" : "orange"}>{m.final ? "FINAL" : "DRAF"}</Chip>
                <button className="tks-btn" onClick={() => setView({ mode: "detail", id: m.id })} style={solid}>BUKA</button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
