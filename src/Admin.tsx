import React, { useCallback, useEffect, useState } from "react"
import {
  createAccount,
  setUserRole,
  setUserPassword,
  deleteUser,
  listAllPeserta,
  listAllPayments,
  listAllSurat,
  listProfiles,
  listHotels,
  listRooms,
  listTransport,
  saveHotel,
  deleteHotel,
  saveRoom,
  deleteRoom,
  saveTransport,
  deleteTransport,
  savePenempatan,
  setPesertaStatus,
  deletePesertaAdmin,
  setPaymentStatus,
  setSuratStatus,
  setLombaStatus,
  addPesertaLomba,
  removePesertaLomba,
  isStaff,
  isLocked,
  LOCK_MSG,
  verdictText,
  ROLE_LABEL,
  mupelText,
  SEED_ADMIN,
  ST,
  StatusChip,
  Chip,
  Field,
  Banner,
  PageShell,
  PrimaryButton,
  FileLink,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  fmtSize,
  rupiah,
  FEE,
  JENIS,
  LOMBA,
  type Registration,
  type Payment,
  type Doc,
  type Hotel,
  type Room,
  type Trans,
  type StoredUser,
  type Role,
  type User,
} from "@/Account"

import { ScoreAdminTab, scoreStats } from "@/Scoreboard"
import { TripSchedule } from "@/Trips"
import { DocumentsTab, docStats } from "@/Documents"
import { BudgetsTab, BudgetRecapTab, budgetStats } from "@/Budget"
import { MeetingsTab, TasksTab, secretaryStats } from "@/Secretary"
import { IncomeTab, ExpenseTab, ReportTab, financeTotals } from "@/Finance"
import { CommitteeAdmin, IdCardPreview, ROLE_COLOR, type CardData } from "@/IdCards"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

// ── Data ───────────────────────────────────────────────────────────────────────
type Data = {
  regs: Registration[]
  pays: Payment[]
  docs: Doc[]
  hotels: Hotel[]
  rooms: Room[]
  trans: Trans[]
  users: StoredUser[]
}

const emptyData = (): Data => ({ regs: [], pays: [], docs: [], hotels: [], rooms: [], trans: [], users: [] })

async function loadAdmin(): Promise<Data> {
  const [regs, pays, docs, hotels, rooms, trans, users] = await Promise.all([
    listAllPeserta(),
    listAllPayments(),
    listAllSurat(),
    listHotels(),
    listRooms(),
    listTransport(),
    listProfiles(),
  ])
  return { regs, pays, docs, hotels, rooms, trans, users }
}

function run(refresh: () => void | Promise<void>, task: () => Promise<void>, setErr: (message: string) => void) {
  setErr("")
  void task().then(() => refresh()).catch((e) => setErr((e as Error).message))
}

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const a = document.createElement("a")
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

// ── Shared widgets ─────────────────────────────────────────────────────────────
type Verif = { status?: string; note?: string; by?: string; at?: string }

function VerifyControls({ v, onSet, superuser }: { v: Verif; onSet: (status: string, note: string) => void; superuser: boolean }) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState("")
  const [err, setErr] = useState("")
  const status = v.status ?? ST.wait
  const locked = isLocked(status)
  const who = verdictText(status, v.by, v.at)
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <StatusChip s={status} />
        {!locked && (
          <button className="tks-btn" onClick={() => { setRejecting(false); onSet(ST.ok, "") }} style={{ ...smallBtn, padding: "6px 14px", fontSize: 12, color: "#fff", background: "#2e7d32", border: "none" }}>
            SETUJUI
          </button>
        )}
        {!locked && !rejecting && (
          <button className="tks-btn" onClick={() => setRejecting(true)} style={{ ...smallBtn, padding: "6px 14px", fontSize: 12, color: "#fff", background: "#c62828", border: "none" }}>
            TOLAK
          </button>
        )}
        {locked && superuser && (
          <button className="tks-btn" onClick={() => onSet(ST.wait, "")} style={{ ...smallBtn, padding: "6px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }}>
            BUKA AKSES
          </button>
        )}
      </div>
      {who && <div style={{ fontFamily: BB, fontSize: 13, color: "#ddd", marginTop: 6 }}>{who}</div>}
      {locked && !superuser && <div style={{ fontFamily: BB, fontSize: 13, color: "#ffb74d", marginTop: 6 }}>{LOCK_MSG}</div>}
      {status === ST.no && v.note && (
        <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", marginTop: 6 }}>Alasan: {v.note}</div>
      )}
      {rejecting && (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <input className="tks-input" aria-label="Alasan penolakan" style={{ ...inputStyle, flex: 1, minWidth: 180, padding: "8px 12px", fontSize: 14 }} value={note} onChange={(e) => { setNote(e.target.value); setErr("") }} placeholder="Alasan penolakan (wajib)" />
          <button className="tks-btn" onClick={() => { if (!note.trim()) return setErr("Isi alasan."); onSet(ST.no, note.trim()); setRejecting(false); setNote("") }} style={{ ...smallBtn, padding: "8px 16px", fontSize: 12, color: "#fff", background: "#c62828", border: "none" }}>KIRIM</button>
          <button className="tks-btn" onClick={() => setRejecting(false)} style={{ ...smallBtn, padding: "8px 16px", fontSize: 12, color: "#ccc", background: "none", border: "1px solid #666" }}>BATAL</button>
          {err && <span role="alert" style={{ fontFamily: BB, fontSize: 12, color: "#ff8a65", width: "100%" }}>{err}</span>}
        </div>
      )}
    </div>
  )
}

function FilterBar({ q, setQ, status, setStatus, children }: { q: string; setQ: (v: string) => void; status: string; setStatus: (v: string) => void; children?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
      <input className="tks-input" aria-label="Cari" style={{ ...inputStyle, flex: 1, minWidth: 200, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, no. registrasi, gereja…" />
      <select className="tks-input" aria-label="Filter status" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">Semua status</option>
        {Object.values(ST).map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {children}
    </div>
  )
}

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)

const Small = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2.5, color: "#999" }}>{children}</div>
)

const matches = (q: string, ...vals: (string | undefined)[]) =>
  !q || vals.some((v) => v?.toLowerCase().includes(q.toLowerCase()))

type TabProps = { data: Data; refresh: () => void | Promise<void>; me: User }

const ownerName = (d: Data, email: string) => d.users.find((u) => u.email === email)?.name ?? email

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({ data, me }: TabProps) {
  const { regs, pays, docs, rooms, trans } = data
  const fin = financeTotals()
  const sek = secretaryStats()
  const bgt = budgetStats()
  const dok = docStats()
  const skor = scoreStats()
  const cnt = (list: { status?: string }[], s: string) => list.filter((x) => (x.status ?? ST.wait) === s).length
  const raceEntries = regs.flatMap((r) => (r.lomba ?? []).map((l) => r.lombaStatus?.[l]?.status ?? ST.wait))
  const stats: [string, string | number, Role[]][] = [
    ["TOTAL PESERTA", regs.length, ["superuser", "reg_admin"]],
    ["PESERTA MENUNGGU", cnt(regs, ST.wait), ["superuser", "reg_admin"]],
    ["PESERTA TERVERIFIKASI", cnt(regs, ST.ok), ["superuser", "reg_admin"]],
    ["BUKTI BAYAR MENUNGGU", cnt(pays, ST.wait), ["superuser", "reg_admin"]],
    ["DANA TERVERIFIKASI", rupiah(pays.filter((p) => p.status === ST.ok).reduce((n, p) => n + p.amount, 0)), ["superuser", "reg_admin"]],
    ["SURAT TUGAS MENUNGGU", cnt(docs, ST.wait), ["superuser", "reg_admin"]],
    ["PENDAFTAR LOMBA", raceEntries.length, ["superuser", "race_admin"]],
    ["LOMBA MENUNGGU", raceEntries.filter((s) => s === ST.wait).length, ["superuser", "race_admin"]],
    ["PERTANDINGAN TERINPUT", skor.pertandingan, ["superuser", "race_admin"]],
    ["PEMIMPIN KLASEMEN", skor.pemimpin, ["superuser", "race_admin"]],
    ["KAPASITAS KAMAR", rooms.reduce((n, r) => n + r.capacity, 0), ["superuser", "accom_admin"]],
    ["PESERTA BER-KAMAR", regs.filter((r) => r.akomodasi?.roomId).length, ["superuser", "accom_admin"]],
    ["PESERTA BER-TRANSPORT", regs.filter((r) => r.akomodasi?.transportId).length, ["superuser", "accom_admin"]],
    ["AKOMODASI MENUNGGU", regs.filter((r) => r.akomodasi && (r.akomodasi.status ?? ST.wait) === ST.wait).length, ["superuser", "accom_admin"]],
    ["KENDARAAN", trans.length, ["superuser", "accom_admin"]],
    ["TOTAL PEMASUKAN", rupiah(fin.masuk), ["superuser", "bendahara"]],
    ["TOTAL PENGELUARAN", rupiah(fin.keluar), ["superuser", "bendahara"]],
    ["SALDO KAS", rupiah(fin.saldo), ["superuser", "bendahara"]],
    ["PENGELUARAN TANPA BUKTI", fin.tanpaBukti, ["superuser", "bendahara"]],
    ["DOKUMEN PUBLIK", dok.eksternal, ["superuser", "sekretaris"]],
    ["DOKUMEN INTERNAL", dok.internal, ["superuser", "sekretaris"]],
    ["ANGGARAN MENUNGGU", bgt.menunggu, ["superuser", "panitia_inti"]],
    ["ANGGARAN DIAJUKAN", rupiah(bgt.diajukan), ["superuser", "panitia_inti"]],
    ["ANGGARAN DISETUJUI", rupiah(bgt.disetujui), ["superuser", "panitia_inti"]],
    ["TOTAL RAPAT", sek.rapat, ["superuser", "sekretaris"]],
    ["TUGAS AKTIF", sek.aktif, ["superuser", "sekretaris"]],
    ["TUGAS TERLAMBAT", sek.terlambat, ["superuser", "sekretaris"]],
    ["TUGAS SELESAI", sek.selesai, ["superuser", "sekretaris"]],
    ["TOTAL AKUN", data.users.length, ["superuser"]],
  ]
  return (
    <div>
      <H>RINGKASAN</H>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
        {stats.filter(([, , roles]) => roles.includes(me.role)).map(([k, v]) => (
          <div key={k} style={{ ...cardStyle, padding: "16px 20px" }}>
            <Small>{k}</Small>
            <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 30, color: O, lineHeight: 1.3 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Registration admin ─────────────────────────────────────────────────────────
function ParticipantsAdmin({ data, refresh, me }: TabProps) {
  const [print, setPrint] = useState<CardData[] | null>(null)
  const toCard = (r: Registration): CardData => ({
    key: r.id,
    regNo: r.regNo,
    nama: r.nama,
    role: r.jenis,
    line1: `${r.gereja} · Mupel ${mupelText(r.mupel)}`,
    line2: `Kontingen ${ownerName(data, r.email)}`,
    foto: r.foto,
    color: ROLE_COLOR[r.jenis] ?? O,
  })
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [jenis, setJenis] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [err, setErr] = useState("")

  const list = data.regs
    .filter((r) => (!status || r.status === status) && (!jenis || r.jenis === jenis))
    .filter((r) => matches(q, r.nama, r.regNo, r.gereja, r.mupel, mupelText(r.mupel), ownerName(data, r.email)))

  const payState = (id: string) => {
    const ps = data.pays.filter((p) => p.regIds.includes(id))
    if (!ps.length) return ["BELUM DIBAYAR", "gray"] as const
    if (ps.some((p) => p.status === ST.ok)) return ["LUNAS TERVERIFIKASI", "green"] as const
    return ["PEMBAYARAN MENUNGGU", "orange"] as const
  }

  return (
    <div>
      <H>DATA PESERTA ({list.length})</H>
      {err && <Banner tone="error">{err}</Banner>}
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus}>
        <select className="tks-input" aria-label="Filter jenis" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={jenis} onChange={(e) => setJenis(e.target.value)}>
          <option value="">Semua jenis</option>
          {JENIS.map((j) => <option key={j}>{j}</option>)}
        </select>
        <button className="tks-btn" onClick={() => downloadCsv("peserta-tks2027.csv", [["No Reg", "Nama", "Jenis", "Gender", "Tempat Lahir", "Tanggal Lahir", "Gereja", "Mupel", "WhatsApp", "Kaos", "Lomba", "Status", "Kontingen"], ...list.map((r) => [r.regNo, r.nama, r.jenis, r.gender, r.tempat, r.tanggal, r.gereja, mupelText(r.mupel), r.wa, r.ukuran, (r.lomba ?? []).join("; "), r.status, ownerName(data, r.email)])])} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>
          EXPORT CSV
        </button>
        <button className="tks-btn" disabled={!list.length} onClick={() => setPrint(list.map(toCard))} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>
          CETAK ID CARD ({list.length})
        </button>
      </FilterBar>
      {print && <IdCardPreview cards={print} onClose={() => setPrint(null)} />}

      {list.length === 0 ? <Empty>Tidak ada peserta yang cocok.</Empty> : (
        <div style={{ display: "grid", gap: 12 }}>
          {list.map((r) => {
            const ps = payState(r.id)
            return (
              <article key={r.id} style={{ ...cardStyle, padding: 16, display: "grid", gridTemplateColumns: "72px 1fr", gap: 16 }}>
                <img src={r.foto} alt={`Foto ${r.nama}`} style={{ width: 72, height: 94, objectFit: "cover", border: `2px solid ${O}` }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{r.regNo} · KONTINGEN {ownerName(data, r.email).toUpperCase()}</div>
                    <Chip tone={ps[1]}>{ps[0]}</Chip>
                  </div>
                  <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff", margin: "2px 0 4px", overflowWrap: "anywhere" }}>{r.nama}</div>
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ccc", lineHeight: 1.7, marginBottom: 10 }}>
                    <strong style={{ color: "#fff" }}>{r.jenis}</strong> · {r.gender} · {r.tempat}, {fmtDate(r.tanggal)} · {r.gereja} · Mupel {mupelText(r.mupel)}
                    <br />
                    WA {r.wa || "-"} · Kaos {r.ukuran || "-"} · Lomba: {(r.lomba ?? []).join(", ") || "-"}
                  </div>
                  <VerifyControls superuser={me.role === "superuser"} v={{ status: r.status, note: r.adminNote, by: r.verifiedBy, at: r.verifiedAt }} onSet={(s, n) => run(refresh, () => setPesertaStatus(r.id, s, n), setErr)} />
                  <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="tks-btn" onClick={() => setPrint([toCard(r)])} style={{ ...smallBtn, padding: "8px 14px", fontSize: 12, color: O, background: "none", border: `1px solid ${O}` }}>ID CARD</button>
                    {!isLocked(r.status) && <DeleteControl id={r.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus peserta ini?" onDelete={() => { setConfirmId(null); run(refresh, () => deletePesertaAdmin(r.id), setErr) }} />}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PaymentsAdmin({ data, refresh, me }: TabProps) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [err, setErr] = useState("")
  const list = data.pays
    .filter((p) => !status || (p.status ?? ST.wait) === status)
    .filter((p) => matches(q, ownerName(data, p.owner), p.note, p.file.name))
  const total = list.reduce((n, p) => n + p.amount, 0)

  return (
    <div>
      <H>VERIFIKASI PEMBAYARAN ({list.length})</H>
      {err && <Banner tone="error">{err}</Banner>}
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} />
      <p style={{ fontFamily: BB, fontSize: 13, color: "#999", margin: "-8px 0 16px" }}>Total nominal pada daftar: <strong style={{ color: "#fff" }}>{rupiah(total)}</strong></p>
      {list.length === 0 ? <Empty>Belum ada bukti pembayaran.</Empty> : (
        <div style={{ display: "grid", gap: 12 }}>
          {list.map((p) => {
            const names = p.regIds.map((id) => data.regs.find((r) => r.id === id)?.nama).filter(Boolean) as string[]
            const diff = p.amount - p.regIds.length * FEE
            return (
              <article key={p.id} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>KONTINGEN {ownerName(data, p.owner).toUpperCase()} · {fmtDate(p.date)}</div>
                  <Chip tone={!p.regIds.length ? "gray" : diff === 0 ? "green" : "orange"}>
                    {!p.regIds.length ? "BELUM DICOCOKKAN" : diff === 0 ? "NOMINAL SESUAI" : diff < 0 ? `KURANG ${rupiah(-diff)}` : `LEBIH ${rupiah(diff)}`}
                  </Chip>
                </div>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff" }}>{rupiah(p.amount)}</div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#ccc", margin: "2px 0 8px" }}>
                  <FileLink f={p.file} /> ({fmtSize(p.file.size)}){p.note && <> · {p.note}</>}
                </div>
                {p.file.type !== "application/pdf" && (
                  <a href={p.file.data} target="_blank" rel="noreferrer"><img src={p.file.data} alt="Bukti pembayaran" style={{ maxWidth: 180, maxHeight: 130, objectFit: "cover", border: "1px solid #555", display: "block", marginBottom: 10 }} /></a>
                )}
                <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb", marginBottom: 12 }}>
                  Peserta ({names.length}): {names.length ? names.join(", ") : <em>belum dicocokkan oleh ketua kontingen</em>}
                </div>
                <VerifyControls superuser={me.role === "superuser"} v={{ status: p.status, note: p.adminNote, by: p.verifiedBy, at: p.verifiedAt }} onSet={(s, n) => run(refresh, () => setPaymentStatus(p.id, s, n), setErr)} />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocsAdmin({ data, refresh, me }: TabProps) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [err, setErr] = useState("")
  const list = data.docs.filter((d) => !status || (d.status ?? ST.wait) === status).filter((d) => matches(q, ownerName(data, d.owner), d.note, d.file.name))
  return (
    <div>
      <H>VERIFIKASI SURAT TUGAS ({list.length})</H>
      {err && <Banner tone="error">{err}</Banner>}
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus} />
      {list.length === 0 ? <Empty>Belum ada surat tugas.</Empty> : (
        <div style={{ display: "grid", gap: 12 }}>
          {list.map((d) => (
            <article key={d.id} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>KONTINGEN {ownerName(data, d.owner).toUpperCase()} · {fmtDate(d.createdAt)}</div>
              <div style={{ margin: "4px 0 12px", fontFamily: BB, fontSize: 14, color: "#ccc" }}>
                <FileLink f={d.file} /> ({fmtSize(d.file.size)}){d.note && <> · {d.note}</>}
              </div>
              <VerifyControls superuser={me.role === "superuser"} v={{ status: d.status, note: d.adminNote, by: d.verifiedBy, at: d.verifiedAt }} onSet={(s, n) => run(refresh, () => setSuratStatus(d.id, s, n), setErr)} />
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Race admin ─────────────────────────────────────────────────────────────────
function RaceAdmin({ data, refresh, me }: TabProps) {
  const [race, setRace] = useState<string>(LOMBA[0])
  const [add, setAdd] = useState("")
  const [err, setErr] = useState("")
  const entries = data.regs.filter((r) => r.lomba?.includes(race))
  const candidates = data.regs.filter((r) => !r.lomba?.includes(race) && !isLocked(r.status))
  const statusOf = (r: Registration, l: string) => r.lombaStatus?.[l]?.status ?? ST.wait

  const setStatus = (r: Registration, s: string, note: string) => {
    run(refresh, () => setLombaStatus(r.id, race, s, note), setErr)
  }
  const remove = (r: Registration) => {
    run(refresh, () => removePesertaLomba(r.id, race), setErr)
  }
  const addEntry = () => {
    const pesertaId = add
    if (!pesertaId) return
    setAdd("")
    run(refresh, () => addPesertaLomba(pesertaId, race), setErr)
  }

  return (
    <div>
      <H>VERIFIKASI PESERTA LOMBA</H>
      {err && <Banner tone="error">{err}</Banner>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {LOMBA.map((l) => {
          const es = data.regs.filter((r) => r.lomba?.includes(l))
          const pending = es.filter((r) => statusOf(r, l) === ST.wait).length
          const on = race === l
          return (
            <button key={l} className="tks-seg" aria-pressed={on} onClick={() => setRace(l)} style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 2, padding: "10px 16px", cursor: "pointer", background: on ? O : "#262626", color: on ? "#fff" : "#ccc", border: `1px solid ${on ? O : "#555"}` }}>
              {l.toUpperCase()} · {es.length}{pending ? ` (${pending}⏳)` : ""}
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <select className="tks-input" aria-label="Tambah peserta ke lomba" style={{ ...inputStyle, flex: 1, minWidth: 220, padding: "10px 14px" }} value={add} onChange={(e) => setAdd(e.target.value)}>
          <option value="">+ Tambah peserta ke {race}…</option>
          {candidates.map((r) => <option key={r.id} value={r.id}>{r.nama} — {ownerName(data, r.email)}</option>)}
        </select>
        <button className="tks-btn" disabled={!add} onClick={addEntry} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>TAMBAH</button>
        <button className="tks-btn" onClick={() => downloadCsv(`lomba-${race}.csv`, [["No Reg", "Nama", "Jenis", "Gender", "Kontingen", "Gereja", "Mupel", "WhatsApp", "Status Lomba"], ...entries.map((r) => [r.regNo, r.nama, r.jenis, r.gender, ownerName(data, r.email), r.gereja, mupelText(r.mupel), r.wa, statusOf(r, race)])])} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>EXPORT CSV</button>
      </div>

      {entries.length === 0 ? <Empty>Belum ada peserta terdaftar pada {race}.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {entries.map((r) => (
            <article key={r.id} style={{ ...cardStyle, padding: 14, display: "grid", gridTemplateColumns: "56px 1fr", gap: 14 }}>
              <img src={r.foto} alt="" style={{ width: 56, height: 72, objectFit: "cover", border: `1px solid ${O}` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ fontFamily: BC, fontSize: 20, letterSpacing: 1, color: "#fff" }}>{r.nama}</strong>
                  <Chip tone="gray">{r.jenis.toUpperCase()}</Chip>
                  <span style={{ fontFamily: BB, fontSize: 12, color: "#888" }}>Registrasi:</span>
                  <StatusChip s={r.status} />
                </div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb", margin: "2px 0 8px" }}>Kontingen {ownerName(data, r.email)} · {r.gereja} · WA {r.wa || "-"}</div>
                <VerifyControls superuser={me.role === "superuser"} v={r.lombaStatus?.[race] ?? {}} onSet={(s, n) => setStatus(r, s, n)} />
                {!isLocked(r.status) && !isLocked(statusOf(r, race)) && <button className="tks-btn" onClick={() => remove(r)} style={{ ...smallBtn, marginTop: 8, padding: "6px 14px", fontSize: 12, color: "#ccc", background: "none", border: "1px solid #666" }}>KELUARKAN DARI LOMBA</button>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Accommodation admin ────────────────────────────────────────────────────────
const ROOM_TYPES = ["Single", "Double", "Twin", "Triple", "Quad", "Dormitory"]
const TRANS_KINDS = ["Bus", "Minibus", "Shuttle", "Kereta", "Lainnya"]

function HotelsAdmin({ data, refresh }: TabProps) {
  const [h, setH] = useState({ name: "", address: "" })
  const [err, setErr] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [roomForm, setRoomForm] = useState<Record<string, { name: string; type: string; capacity: string }>>({})
  const occ = (roomId: string) => data.regs.filter((r) => r.akomodasi?.roomId === roomId).length

  const addHotel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!h.name.trim()) return setErr("Nama hotel wajib diisi.")
    const name = h.name.trim()
    const address = h.address.trim()
    setH({ name: "", address: "" })
    run(refresh, () => saveHotel(name, address), setErr)
  }
  const addRoom = (hotelId: string) => {
    const f = roomForm[hotelId] ?? { name: "", type: ROOM_TYPES[0], capacity: "2" }
    const cap = Number(f.capacity)
    if (!f.name.trim() || !(cap > 0)) return setErr("Nama/nomor kamar dan kapasitas (>0) wajib diisi.")
    const name = f.name.trim()
    setRoomForm((s) => ({ ...s, [hotelId]: { name: "", type: f.type, capacity: f.capacity } }))
    run(refresh, () => saveRoom(hotelId, name, f.type, cap), setErr)
  }
  const delRoom = (id: string) => {
    if (occ(id)) return setErr("Kamar masih terisi peserta. Pindahkan peserta terlebih dahulu.")
    run(refresh, () => deleteRoom(id), setErr)
  }
  const delHotel = (id: string) => {
    setConfirmId(null)
    if (data.rooms.some((r) => r.hotelId === id && occ(r.id))) return setErr("Hotel memiliki kamar yang masih terisi peserta.")
    run(refresh, () => deleteHotel(id), setErr)
  }

  return (
    <div>
      <H>HOTEL & KAMAR</H>
      {err && <Banner tone="error">{err}</Banner>}
      <form onSubmit={addHotel} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24, display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }} className="card-grid">
        <Field label="Nama Hotel" htmlFor="h-name"><input id="h-name" className="tks-input" style={inputStyle} value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} /></Field>
        <Field label="Alamat" htmlFor="h-addr"><input id="h-addr" className="tks-input" style={inputStyle} value={h.address} onChange={(e) => setH({ ...h, address: e.target.value })} /></Field>
        <div style={{ marginBottom: 22 }}><PrimaryButton type="submit" style={{ padding: "14px 24px" }}>+ HOTEL</PrimaryButton></div>
      </form>

      {data.hotels.length === 0 ? <Empty>Belum ada hotel.</Empty> : (
        <div style={{ display: "grid", gap: 16 }}>
          {data.hotels.map((ht) => {
            const rooms = data.rooms.filter((r) => r.hotelId === ht.id)
            const f = roomForm[ht.id] ?? { name: "", type: ROOM_TYPES[0], capacity: "2" }
            return (
              <article key={ht.id} style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 24, color: "#fff", letterSpacing: 1 }}>{ht.name}</div>
                    <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>{ht.address || "Alamat belum diisi"} · {rooms.length} kamar · kapasitas {rooms.reduce((n, r) => n + r.capacity, 0)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <DeleteControl id={ht.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus hotel & kamarnya?" onDelete={() => delHotel(ht.id)} />
                  </div>
                </div>
                {rooms.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8, marginBottom: 14 }}>
                    {rooms.map((r) => (
                      <div key={r.id} style={{ background: "#262626", border: "1px solid #444", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontFamily: BB, fontSize: 14, color: "#eee" }}>
                          <strong>{r.name}</strong> <span style={{ color: "#999" }}>{r.type}</span>
                          <div style={{ fontSize: 12, color: occ(r.id) >= r.capacity ? "#ef9a9a" : "#a5d6a7" }}>{occ(r.id)} / {r.capacity} terisi</div>
                        </div>
                        <button aria-label={`Hapus kamar ${r.name}`} onClick={() => delRoom(r.id)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 18 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input className="tks-input" aria-label="Nama / nomor kamar" placeholder="Nama / No. kamar" style={{ ...inputStyle, flex: 1, minWidth: 140, padding: "10px 12px" }} value={f.name} onChange={(e) => setRoomForm((s) => ({ ...s, [ht.id]: { ...f, name: e.target.value } }))} />
                  <select className="tks-input" aria-label="Tipe kamar" style={{ ...inputStyle, width: "auto", padding: "10px 12px" }} value={f.type} onChange={(e) => setRoomForm((s) => ({ ...s, [ht.id]: { ...f, type: e.target.value } }))}>
                    {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input className="tks-input" aria-label="Kapasitas" type="number" min={1} style={{ ...inputStyle, width: 90, padding: "10px 12px" }} value={f.capacity} onChange={(e) => setRoomForm((s) => ({ ...s, [ht.id]: { ...f, capacity: e.target.value } }))} />
                  <button className="tks-btn" onClick={() => addRoom(ht.id)} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>+ KAMAR</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TransportAdmin({ data, refresh }: TabProps) {
  const [mode, setMode] = useState<"armada" | "jadwal">("jadwal")
  const empty = { kind: TRANS_KINDS[0], name: "", route: "", depart: "", capacity: "40" }
  const [f, setF] = useState(empty)
  const [err, setErr] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const occ = (id: string) => data.regs.filter((r) => r.akomodasi?.transportId === id).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const cap = Number(f.capacity)
    if (!f.name.trim() || !f.route.trim() || !f.depart || !(cap > 0)) return setErr("Nama, rute, jadwal berangkat, dan kapasitas wajib diisi.")
    const next = { kind: f.kind, name: f.name.trim(), route: f.route.trim(), depart: f.depart, capacity: cap }
    setF(empty)
    run(refresh, () => saveTransport(next.kind, next.name, next.route, next.depart, next.capacity), setErr)
  }

  return (
    <div>
      <H>TRANSPORTASI</H>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {([["jadwal", "JADWAL TRIP"], ["armada", "ARMADA"]] as const).map(([id, label]) => (
          <button key={id} className="tks-seg" aria-pressed={mode === id} onClick={() => setMode(id)} style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 2, padding: "10px 16px", cursor: "pointer", background: mode === id ? O : "#262626", color: mode === id ? "#fff" : "#ccc", border: `1px solid ${mode === id ? O : "#555"}` }}>{label}</button>
        ))}
      </div>
      {mode === "jadwal" ? <TripSchedule trans={data.trans} /> : <>
      {err && <Banner tone="error">{err}</Banner>}
      <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
          <Field label="Jenis" htmlFor="t-kind"><select id="t-kind" className="tks-input" style={inputStyle} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>{TRANS_KINDS.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Nama / Armada" htmlFor="t-name"><input id="t-name" className="tks-input" style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Bus 1" /></Field>
          <Field label="Rute" htmlFor="t-route"><input id="t-route" className="tks-input" style={inputStyle} value={f.route} onChange={(e) => setF({ ...f, route: e.target.value })} placeholder="Bandara → Hotel" /></Field>
          <Field label="Jadwal Berangkat" htmlFor="t-dep"><input id="t-dep" type="datetime-local" className="tks-input" style={{ ...inputStyle, colorScheme: "dark" }} value={f.depart} onChange={(e) => setF({ ...f, depart: e.target.value })} /></Field>
          <Field label="Kapasitas" htmlFor="t-cap"><input id="t-cap" type="number" min={1} className="tks-input" style={inputStyle} value={f.capacity} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
        </div>
        <PrimaryButton type="submit">+ TAMBAH TRANSPORTASI</PrimaryButton>
      </form>
      {data.trans.length === 0 ? <Empty>Belum ada transportasi.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {[...data.trans].sort((a, b) => a.depart.localeCompare(b.depart)).map((t) => (
            <article key={t.id} style={{ ...cardStyle, padding: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: "#fff" }}>{t.name} <Chip tone="gray">{t.kind.toUpperCase()}</Chip></div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb" }}>{t.route} · {new Date(t.depart).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })}</div>
                <div style={{ fontFamily: BB, fontSize: 12, color: occ(t.id) >= t.capacity ? "#ef9a9a" : "#a5d6a7" }}>{occ(t.id)} / {t.capacity} penumpang</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <DeleteControl id={t.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus transportasi?" onDelete={() => {
                  setConfirmId(null)
                  if (occ(t.id)) return setErr("Transportasi masih memiliki penumpang.")
                  run(refresh, () => deleteTransport(t.id), setErr)
                }} />
              </div>
            </article>
          ))}
        </div>
      )}
      </>}
    </div>
  )
}

function PlacementAdmin({ data, refresh, me }: TabProps) {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [err, setErr] = useState("")
  const roomOcc = (id: string) => data.regs.filter((r) => r.akomodasi?.roomId === id).length
  const transOcc = (id: string) => data.regs.filter((r) => r.akomodasi?.transportId === id).length
  const accStatus = (r: Registration) => r.akomodasi?.status ?? ST.wait

  const list = data.regs
    .filter((r) => !status || accStatus(r) === status)
    .filter((r) => matches(q, r.nama, r.regNo, r.gereja, ownerName(data, r.email)))

  const save = (r: Registration, patch: Partial<NonNullable<Registration["akomodasi"]>>) => {
    const next = { status: accStatus(r), ...r.akomodasi, ...patch }
    run(refresh, () => savePenempatan(r.id, { roomId: next.roomId, transportId: next.transportId, status: next.status, note: next.note }), setErr)
  }

  return (
    <div>
      <H>PENEMPATAN & VERIFIKASI AKOMODASI</H>
      {err && <Banner tone="error">{err}</Banner>}
      <FilterBar q={q} setQ={setQ} status={status} setStatus={setStatus}>
        <button className="tks-btn" onClick={() => downloadCsv("akomodasi-tks2027.csv", [["No Reg", "Nama", "Kontingen", "Gender", "Hotel", "Kamar", "Transport", "Rute", "Berangkat", "Status"], ...list.map((r) => { const room = data.rooms.find((x) => x.id === r.akomodasi?.roomId); const tr = data.trans.find((x) => x.id === r.akomodasi?.transportId); return [r.regNo, r.nama, ownerName(data, r.email), r.gender, data.hotels.find((h) => h.id === room?.hotelId)?.name ?? "", room?.name ?? "", tr?.name ?? "", tr?.route ?? "", tr?.depart ?? "", accStatus(r)] })])} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>EXPORT CSV</button>
      </FilterBar>

      {data.rooms.length === 0 && data.trans.length === 0 && <Banner tone="info">Tambahkan hotel/kamar dan transportasi terlebih dahulu pada tab lain.</Banner>}
      {list.length === 0 ? <Empty>Tidak ada peserta.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {list.map((r) => {
            const a = r.akomodasi
            return (
              <article key={r.id} style={{ ...cardStyle, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <div>
                    <strong style={{ fontFamily: BC, fontSize: 20, letterSpacing: 1, color: "#fff" }}>{r.nama}</strong>
                    <div style={{ fontFamily: BB, fontSize: 12, color: "#999" }}>{r.regNo} · {r.gender} · Kontingen {ownerName(data, r.email)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}><Chip tone="gray">{r.jenis.toUpperCase()}</Chip><StatusChip s={r.status} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }} className="card-grid">
                  <select className="tks-input" aria-label={`Kamar ${r.nama}`} disabled={isLocked(accStatus(r))} style={{ ...inputStyle, padding: "10px 12px" }} value={a?.roomId ?? ""} onChange={(e) => save(r, { roomId: e.target.value || undefined })}>
                    <option value="">— Kamar belum ditentukan —</option>
                    {data.hotels.map((h) => (
                      <optgroup key={h.id} label={h.name}>
                        {data.rooms.filter((x) => x.hotelId === h.id).map((x) => (
                          <option key={x.id} value={x.id} disabled={roomOcc(x.id) >= x.capacity && a?.roomId !== x.id}>{x.name} ({x.type}) · {roomOcc(x.id)}/{x.capacity}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <select className="tks-input" aria-label={`Transportasi ${r.nama}`} disabled={isLocked(accStatus(r))} style={{ ...inputStyle, padding: "10px 12px" }} value={a?.transportId ?? ""} onChange={(e) => save(r, { transportId: e.target.value || undefined })}>
                    <option value="">— Transportasi belum ditentukan —</option>
                    {data.trans.map((t) => (
                      <option key={t.id} value={t.id} disabled={transOcc(t.id) >= t.capacity && a?.transportId !== t.id}>{t.name} · {t.route} · {transOcc(t.id)}/{t.capacity}</option>
                    ))}
                  </select>
                </div>
                <VerifyControls superuser={me.role === "superuser"} v={{ status: accStatus(r), note: a?.note, by: a?.by, at: a?.at }} onSet={(s, n) => {
                  if (s === ST.ok && !a?.roomId && !a?.transportId) return setErr(`Tentukan kamar atau transportasi untuk ${r.nama} sebelum memverifikasi.`)
                  save(r, { status: s, note: n || undefined })
                }} />
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Superuser: accounts ────────────────────────────────────────────────────────
function UsersAdmin({ data, refresh, me }: TabProps) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "reg_admin" as Role })
  const [err, setErr] = useState("")
  const [ok, setOk] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pwFor, setPwFor] = useState<string | null>(null)
  const [pw, setPw] = useState("")
  const guard = (fn: () => void | Promise<void>) => {
    setErr(""); setOk("")
    void Promise.resolve().then(fn).then(() => refresh()).catch((e) => { setErr((e as Error).message); setConfirmId(null) })
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(""); setOk("")
    if (f.name.trim().length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) || f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password))
      return setErr("Isi nama (min. 3), email valid, dan kata sandi min. 8 karakter berisi huruf dan angka.")
    try {
      await createAccount(f.name, f.email, f.password, f.role)
      setOk(`Akun ${f.email} dibuat sebagai ${ROLE_LABEL[f.role]}.`)
      setF({ name: "", email: "", password: "", role: "reg_admin" })
      refresh()
    } catch (x) { setErr((x as Error).message) }
  }

  return (
    <div>
      <H>MANAJEMEN AKUN</H>
      {err && <Banner tone="error">{err}</Banner>}
      {ok && <Banner tone="ok">{ok}</Banner>}
      <form onSubmit={create} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>BUAT AKUN ADMIN</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
          <Field label="Nama" htmlFor="u-name"><input id="u-name" className="tks-input" style={inputStyle} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" htmlFor="u-email"><input id="u-email" type="email" className="tks-input" style={inputStyle} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Kata Sandi Awal" htmlFor="u-pw"><input id="u-pw" type="text" autoComplete="off" className="tks-input" style={inputStyle} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
          <Field label="Peran" htmlFor="u-role">
            <select id="u-role" className="tks-input" style={inputStyle} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
              {(["reg_admin", "race_admin", "accom_admin", "bendahara", "sekretaris", "panitia_inti", "superuser"] as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
        </div>
        <PrimaryButton type="submit">BUAT AKUN</PrimaryButton>
      </form>

      <div style={{ display: "grid", gap: 10 }}>
        {data.users.map((u) => (
          <article key={u.id} style={{ ...cardStyle, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 18, color: "#fff" }}>{u.name} {u.id === me.id && <Chip tone="gray">ANDA</Chip>}</div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>{u.email}{(u.role ?? "user") === "user" && <> · {u.mupel ? mupelText(u.mupel) : "Mupel belum diisi"} · {data.regs.filter((r) => r.email === u.email).length} peserta</>}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select className="tks-input" aria-label={`Peran ${u.name}`} disabled={u.id === me.id} style={{ ...inputStyle, width: "auto", padding: "8px 12px" }} value={u.role ?? "user"} onChange={(e) => guard(() => setUserRole(u.id, e.target.value as Role))}>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button className="tks-btn" onClick={() => { setPwFor(pwFor === u.id ? null : u.id); setPw("") }} style={{ ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }}>RESET SANDI</button>
                {u.id !== me.id && <DeleteControl id={u.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus akun?" onDelete={() => guard(() => { deleteUser(u.id); setConfirmId(null) })} />}
              </div>
            </div>
            {pwFor === u.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <input className="tks-input" aria-label="Kata sandi baru" autoComplete="off" style={{ ...inputStyle, flex: 1, minWidth: 200, padding: "8px 12px" }} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Kata sandi baru (min. 8, huruf + angka)" />
                <button className="tks-btn" onClick={async () => {
                  if (pw.length < 8 || !/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return setErr("Kata sandi min. 8 karakter, kombinasi huruf dan angka.")
                  try {
                    const message = await setUserPassword(u.id, pw)
                    setPwFor(null); setPw(""); setErr(""); setOk(message)
                  } catch (x) { setOk(""); setErr((x as Error).message) }
                }} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>SIMPAN</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────
type TabDef = { id: string; label: string; short: string; roles: Role[]; render: (p: TabProps) => React.ReactNode }
const REG: Role[] = ["superuser", "reg_admin"]
const RACE: Role[] = ["superuser", "race_admin"]
const ACC: Role[] = ["superuser", "accom_admin"]
const FIN: Role[] = ["superuser", "bendahara"]
const SEK: Role[] = ["superuser", "sekretaris"]
const INTI: Role[] = ["superuser", "panitia_inti"]
const ALL_STAFF: Role[] = ["superuser", "reg_admin", "race_admin", "accom_admin", "bendahara", "sekretaris", "panitia_inti"]

const TABS: TabDef[] = [
  { id: "dash", short: "RINGKAS", label: "RINGKASAN", roles: ALL_STAFF, render: (p) => <Dashboard {...p} /> },
  { id: "peserta", short: "PESERTA", label: "PESERTA", roles: REG, render: (p) => <ParticipantsAdmin {...p} /> },
  { id: "bayar", short: "BAYAR", label: "PEMBAYARAN", roles: REG, render: (p) => <PaymentsAdmin {...p} /> },
  { id: "surat", short: "SURAT", label: "SURAT TUGAS", roles: REG, render: (p) => <DocsAdmin {...p} /> },
  { id: "lomba", short: "LOMBA", label: "LOMBA", roles: RACE, render: (p) => <RaceAdmin {...p} /> },
  { id: "hasil", short: "HASIL", label: "HASIL & JUARA UMUM", roles: RACE, render: (p) => <ScoreAdminTab me={p.me.name} /> },
  { id: "hotel", short: "HOTEL", label: "HOTEL & KAMAR", roles: ACC, render: (p) => <HotelsAdmin {...p} /> },
  { id: "trans", short: "TRANSPORT", label: "TRANSPORTASI", roles: ACC, render: (p) => <TransportAdmin {...p} /> },
  { id: "tempat", short: "TEMPAT", label: "PENEMPATAN", roles: ACC, render: (p) => <PlacementAdmin {...p} /> },
  { id: "masuk", short: "MASUK", label: "PEMASUKAN", roles: FIN, render: (p) => <IncomeTab me={p.me.name} /> },
  { id: "keluar", short: "KELUAR", label: "PENGELUARAN", roles: FIN, render: (p) => <ExpenseTab me={p.me.name} /> },
  { id: "laporan", short: "LAPORAN", label: "LAPORAN KEUANGAN", roles: FIN, render: (p) => <ReportTab me={p.me.name} /> },
  { id: "rapat", short: "RAPAT", label: "NOTULENSI RAPAT", roles: SEK, render: (p) => <MeetingsTab me={p.me.name} /> },
  { id: "tugas", short: "TUGAS", label: "TUGAS & TINDAK LANJUT", roles: SEK, render: () => <TasksTab /> },
  { id: "ajuan", short: "AJUAN", label: "PENGAJUAN ANGGARAN", roles: ALL_STAFF, render: (p) => <BudgetsTab me={p.me} mode="own" /> },
  { id: "setuju", short: "SETUJU", label: "PERSETUJUAN ANGGARAN", roles: INTI, render: (p) => <BudgetsTab me={p.me} mode="review" /> },
  { id: "rekapbgt", short: "ANGGARAN", label: "REKAP ANGGARAN", roles: ["superuser", "panitia_inti", "bendahara"], render: () => <BudgetRecapTab /> },
  { id: "dokumen", short: "DOKUMEN", label: "DOKUMEN PENTING", roles: ALL_STAFF, render: (p) => <DocumentsTab me={p.me} /> },
  { id: "panitia", short: "PANITIA", label: "PANITIA", roles: ["superuser"], render: () => <CommitteeAdmin /> },
  { id: "akun", short: "AKUN", label: "AKUN", roles: ["superuser"], render: (p) => <UsersAdmin {...p} /> },
]

export function AdminPanel({ user }: { user: User }) {
  const [data, setData] = useState<Data>(emptyData)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const refresh = useCallback(async () => {
    try {
      setData(await loadAdmin())
      setLoadError("")
    } catch (e) {
      setLoadError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  const tabs = TABS.filter((t) => t.roles.includes(user.role))
  const [tab, setTab] = useState(tabs[0]?.id)
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  const waiting = (l: { status?: string }[]) => l.filter((x) => (x.status ?? ST.wait) === ST.wait).length
  const pending: Record<string, number> = {
    peserta: waiting(data.regs),
    bayar: waiting(data.pays),
    surat: waiting(data.docs),
    lomba: data.regs.reduce((n, r) => n + (r.lomba ?? []).filter((l) => (r.lombaStatus?.[l]?.status ?? ST.wait) === ST.wait).length, 0),
    keluar: financeTotals().tanpaBukti,
    tugas: secretaryStats().terlambat,
    setuju: budgetStats().menunggu,
    ajuan: budgetStats().revisi(user.email),
    tempat: data.regs.filter((r) => r.akomodasi && (r.akomodasi.status ?? ST.wait) === ST.wait).length,
  }

  if (!isStaff(user) || !current) {
    return (
      <PageShell>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "96px 24px" }}>
          <Banner tone="error">Anda tidak memiliki akses ke panel admin.</Banner>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="reg-page" style={{ width: "100%", padding: "48px clamp(16px,3vw,56px) 96px" }}>
        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 4, color: O, marginBottom: 10 }}>PANEL ADMIN</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
          <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(32px,5vw,52px)", letterSpacing: 2, lineHeight: 1, color: "#fff", margin: 0 }}>
            {ROLE_LABEL[user.role].toUpperCase()}
          </h1>
          <Chip tone="gray">{user.email}</Chip>
        </div>

        {user.role === "superuser" && user.email === SEED_ADMIN.email && (
          <Banner tone="info">Anda masuk dengan akun superuser bawaan. Buat akun superuser baru pada tab AKUN, lalu ubah kata sandi akun ini.</Banner>
        )}

        <div className="reg-layout">
          <nav role="tablist" aria-orientation="vertical" className="reg-nav reg-nav-scroll">
            {tabs.map((t, i) => {
              const on = current.id === t.id
              const n = pending[t.id]
              return (
                <button key={t.id} role="tab" aria-selected={on} data-on={on} className="reg-nav-item" onClick={() => { setTab(t.id); refresh(); window.scrollTo({ top: 0 }) }}>
                  <span className="reg-nav-no">{i + 1}</span>
                  <span className="reg-nav-label"><span className="reg-long">{t.label}</span><span className="reg-short">{t.short}</span></span>
                  <span className="reg-nav-count" title="Menunggu verifikasi">{n ? n : ""}</span>
                </button>
              )
            })}
          </nav>
          <div className="reg-content">
        {loadError && <Banner tone="error">{loadError}</Banner>}
        {loading ? (
          <div style={{ fontFamily: BB, fontSize: 14, color: "#aaa" }}>Memuat data admin…</div>
        ) : current.render({ data, refresh, me: user })}
          </div>
        </div>
      </div>
    </PageShell>
  )
}
