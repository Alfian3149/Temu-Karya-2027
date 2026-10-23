import React, { useEffect, useMemo, useState } from "react"
import {
  read,
  write,
  randomId,
  listUsers,
  listAllPeserta,
  listProfiles,
  REG_KEY,
  LOMBA,
  Field,
  PrimaryButton,
  Banner,
  Chip,
  DeleteControl,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  type Registration,
} from "@/Account"
import { packJson, unpackJson } from "@/Secretary"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export const MATCH_KEY = "tks27_matches"
export const SCORE_FINAL_KEY = "tks27_scorefinal"
export const SCORE_LIVE = "#/klasemen"
export const SCORE_SNAP = "#/klasemen/"
export const BABAK = ["Penyisihan", "Penyisihan Grup A", "Penyisihan Grup B", "Perempat Final", "Semifinal", "Perebutan Juara 3", "Final"]

export type Contingent = { id: string; name: string; leader: string }
export type Match = { id: string; lomba: string; babak: string; tanggal: string; catatan: string; entries: { k: string; poin: number }[]; createdAt: string; by: string }
type Snapshot = { c: Contingent[]; m: Match[]; f: boolean; t: string }
type Row = Contingent & { poin: number; menang: number; main: number; perLomba: Record<string, number>; rank: number }

const listMatches = () => read<Match[]>(MATCH_KEY, [])
const isFinal = () => read<boolean>(SCORE_FINAL_KEY, false)

export function contingentsFrom(regs: Registration[], users: { email: string; name: string; role?: string }[]): Contingent[] {
  return users
    .filter((u) => (u.role ?? "user") === "user" && regs.some((r) => r.email === u.email))
    .map((u) => {
      const count: Record<string, number> = {}
      regs.filter((r) => r.email === u.email && r.mupel).forEach((r) => (count[r.mupel] = (count[r.mupel] ?? 0) + 1))
      const mupel = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0]
      return { id: u.email, name: mupel || u.name, leader: u.name }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function listContingents(): Contingent[] {
  return contingentsFrom(read<Registration[]>(REG_KEY, []), listUsers())
}

export async function loadContingents(): Promise<Contingent[]> {
  const [regs, users] = await Promise.all([listAllPeserta(), listProfiles()])
  return contingentsFrom(regs, users)
}

export function computeStandings(cs: Contingent[], ms: Match[], lomba = ""): Row[] {
  const rows: Row[] = cs.map((c) => ({ ...c, poin: 0, menang: 0, main: 0, perLomba: {}, rank: 0 }))
  const byId = new Map(rows.map((r) => [r.id, r]))
  for (const m of ms) {
    if (lomba && m.lomba !== lomba) continue
    const top = Math.max(...m.entries.map((e) => e.poin))
    const allEqual = m.entries.every((e) => e.poin === top)
    for (const e of m.entries) {
      const r = byId.get(e.k)
      if (!r) continue
      r.poin += e.poin
      r.main += 1
      r.perLomba[m.lomba] = (r.perLomba[m.lomba] ?? 0) + e.poin
      if (!allEqual && e.poin === top) r.menang += 1
    }
  }
  rows.sort((a, b) => b.poin - a.poin || b.menang - a.menang || a.name.localeCompare(b.name))
  rows.forEach((r, i) => {
    const prev = rows[i - 1]
    r.rank = prev && prev.poin === r.poin && prev.menang === r.menang ? prev.rank : i + 1
  })
  return rows
}

export function scoreStats() {
  const ms = listMatches()
  const lead = computeStandings(listContingents(), ms)[0]
  return { pertandingan: ms.length, pemimpin: lead && lead.poin > 0 ? lead.name : "-" }
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))
const ghost: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#ddd", background: "none", border: "1px solid #666" }
const solid: React.CSSProperties = { ...smallBtn, padding: "8px 14px", fontSize: 12, color: "#fff", background: O, border: "none" }
const dateStyle = { ...inputStyle, colorScheme: "dark" } as React.CSSProperties
const MEDAL = ["#FFC107", "#B0BEC5", "#CD7F32"]
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 16px" }}>{children}</h2>
)
const Empty = ({ children }: { children: React.ReactNode }) => (
  <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>{children}</div>
)

// ── Shared views ───────────────────────────────────────────────────────────────
function Podium({ rows, final, lomba }: { rows: Row[]; final: boolean; lomba: string }) {
  const lead = rows[0]
  if (!lead || lead.poin <= 0) return null
  const leaders = rows.filter((r) => r.rank === 1)
  const title = lomba ? `JUARA ${lomba.toUpperCase()}` : final ? "JUARA UMUM" : "PEMIMPIN KLASEMEN SEMENTARA"
  return (
    <div style={{ ...cardStyle, padding: "24px 20px", marginBottom: 20, borderTop: `3px solid ${MEDAL[0]}`, textAlign: "center" }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 13, letterSpacing: 4, color: MEDAL[0] }}>★ {title} ★</div>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(28px, 6vw, 44px)", color: "#fff", letterSpacing: 1, lineHeight: 1.1, margin: "6px 0" }}>{leaders.map((l) => l.name).join(" & ")}</div>
      <div style={{ fontFamily: BB, fontSize: 14, color: "#bbb" }}>{fmt(lead.poin)} poin{leaders.length > 1 && " · peringkat sama, dihitung dari jumlah kemenangan"}</div>
    </div>
  )
}

function StandingsTable({ rows, lomba }: { rows: Row[]; lomba: string }) {
  const cols = lomba ? [] : LOMBA.filter((l) => rows.some((r) => r.perLomba[l] !== undefined))
  const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", borderBottom: "1px solid #666", fontFamily: BC, letterSpacing: 2, fontSize: 12, color: "#999", whiteSpace: "nowrap" }
  const td: React.CSSProperties = { padding: "10px 12px", borderBottom: "1px solid #3a3a3a", whiteSpace: "nowrap" }
  return (
    <div style={{ ...cardStyle, padding: 4, overflowX: "auto", marginBottom: 24 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: BB, fontSize: 14, color: "#ddd", minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 56 }}>#</th>
            <th style={th}>KONTINGEN</th>
            {cols.map((l) => <th key={l} style={{ ...th, textAlign: "right" }}>{l.toUpperCase()}</th>)}
            <th style={{ ...th, textAlign: "right" }}>MENANG</th>
            <th style={{ ...th, textAlign: "right" }}>TOTAL POIN</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...td, fontFamily: BC, fontWeight: 800, fontSize: 20, color: r.poin > 0 && r.rank <= 3 ? MEDAL[r.rank - 1] : "#888" }}>{r.rank}</td>
              <td style={td}><div style={{ fontFamily: BC, fontWeight: 700, fontSize: 18, color: "#fff", whiteSpace: "normal" }}>{r.name}</div><div style={{ fontSize: 12, color: "#888" }}>Ketua: {r.leader}</div></td>
              {cols.map((l) => <td key={l} style={{ ...td, textAlign: "right" }}>{r.perLomba[l] !== undefined ? fmt(r.perLomba[l]) : "–"}</td>)}
              <td style={{ ...td, textAlign: "right" }}>{r.menang}</td>
              <td style={{ ...td, textAlign: "right", fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff" }}>{fmt(r.poin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MatchCard({ m, names, actions }: { m: Match; names: Map<string, string>; actions?: React.ReactNode }) {
  const top = Math.max(...m.entries.map((e) => e.poin))
  return (
    <article style={{ ...cardStyle, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>{m.lomba.toUpperCase()} · {m.babak.toUpperCase()}</div>
          <div style={{ fontFamily: BB, fontSize: 12, color: "#888" }}>{m.tanggal ? fmtDate(m.tanggal) : "—"}{m.catatan && ` · ${m.catatan}`}</div>
        </div>
        {actions && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{actions}</div>}
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        {[...m.entries].sort((a, b) => b.poin - a.poin).map((e) => (
          <div key={e.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontFamily: BB, fontSize: 15, color: e.poin === top ? "#fff" : "#aaa" }}>
            <span>{names.get(e.k) ?? "Kontingen dihapus"}</span>
            <strong style={{ fontFamily: BC, fontSize: 18, color: e.poin === top ? "#66bb6a" : "#aaa" }}>{fmt(e.poin)}</strong>
          </div>
        ))}
      </div>
    </article>
  )
}

function LombaFilter({ value, onChange, matches }: { value: string; onChange: (v: string) => void; matches: Match[] }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {["", ...LOMBA].map((l) => {
        const n = l ? matches.filter((m) => m.lomba === l).length : matches.length
        const on = value === l
        return (
          <button key={l || "all"} className="tks-seg" aria-pressed={on} onClick={() => onChange(l)} style={{ fontFamily: BC, fontWeight: 700, fontSize: 13, letterSpacing: 1.5, padding: "8px 14px", cursor: "pointer", background: on ? O : "#262626", color: on ? "#fff" : "#ccc", border: `1px solid ${on ? O : "#555"}` }}>
            {(l || "KLASEMEN UMUM").toUpperCase()} · {n}
          </button>
        )
      })}
    </div>
  )
}

function Board({ cs, ms, final }: { cs: Contingent[]; ms: Match[]; final: boolean }) {
  const [lomba, setLomba] = useState("")
  const rows = useMemo(() => computeStandings(cs, ms, lomba), [cs, ms, lomba])
  const names = useMemo(() => new Map(cs.map((c) => [c.id, c.name])), [cs])
  const shown = ms.filter((m) => !lomba || m.lomba === lomba).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || "") || b.createdAt.localeCompare(a.createdAt)).slice(0, lomba ? 50 : 8)
  return (
    <>
      <LombaFilter value={lomba} onChange={setLomba} matches={ms} />
      <Podium rows={rows} final={final} lomba={lomba} />
      {rows.length === 0 ? <Empty>Belum ada kontingen terdaftar.</Empty> : <StandingsTable rows={rows} lomba={lomba} />}
      <H>{lomba ? `HASIL ${lomba.toUpperCase()}` : "PERTANDINGAN TERBARU"}</H>
      {shown.length === 0 ? <Empty>Belum ada hasil pertandingan.</Empty> : <div style={{ display: "grid", gap: 10 }}>{shown.map((m) => <MatchCard key={m.id} m={m} names={names} />)}</div>}
    </>
  )
}

// ── Public page ────────────────────────────────────────────────────────────────
export function PublicScoreboard() {
  const snap = location.hash.startsWith(SCORE_SNAP) && location.hash.length > SCORE_SNAP.length
  const [data, setData] = useState<Snapshot | null>(() => (snap ? null : { c: [], m: listMatches(), f: isFinal(), t: new Date().toISOString() }))
  const [err, setErr] = useState(false)
  useEffect(() => {
    if (snap) {
      unpackJson<Snapshot>(location.hash.slice(SCORE_SNAP.length)).then((d) => (Array.isArray(d?.c) && Array.isArray(d?.m) ? setData(d) : setErr(true))).catch(() => setErr(true))
      return
    }
    void loadContingents().then((c) => setData((current) => current ? { ...current, c, t: new Date().toISOString() } : current)).catch(() => undefined)
  }, [snap])
  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", padding: "16px 12px 56px" }}>
      <div style={{ maxWidth: 940, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
          <strong style={{ fontFamily: BC, fontSize: 22, letterSpacing: 2, color: "#fff", flex: 1 }}>KLASEMEN LOMBA · TKS 2027 PKB GPIB</strong>
          <a href={location.pathname} style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 2, fontSize: 13, color: "#ddd" }}>SITUS UTAMA</a>
        </div>
        {data && <div style={{ fontFamily: BB, fontSize: 12, color: "#888", marginBottom: 20 }}>Data per {new Date(data.t).toLocaleString("id-ID")}{data.f && " · klasemen final"}</div>}
        {err && <div style={{ ...cardStyle, padding: 24, fontFamily: BB, color: "#ddd" }}>Tautan klasemen tidak valid atau terpotong. Minta tautan terbaru kepada panitia lomba.</div>}
        {!data && !err && <div style={{ fontFamily: BB, color: "#aaa", textAlign: "center", marginTop: 60 }}>Memuat klasemen…</div>}
        {data && <Board cs={data.c} ms={data.m} final={data.f} />}
      </div>
    </div>
  )
}

// ── Admin ──────────────────────────────────────────────────────────────────────
type EntryRow = { id: string; k: string; poin: string }
const blank = (): EntryRow => ({ id: randomId(), k: "", poin: "" })

function MatchForm({ initial, cs, me, defaultLomba, onDone, onCancel }: { initial: Match | null; cs: Contingent[]; me: string; defaultLomba: string; onDone: () => void; onCancel: () => void }) {
  const [f, setF] = useState({ lomba: initial?.lomba ?? (defaultLomba || LOMBA[0]), babak: initial?.babak ?? BABAK[0], tanggal: initial?.tanggal ?? new Date().toISOString().slice(0, 10), catatan: initial?.catatan ?? "" })
  const [rows, setRows] = useState<EntryRow[]>(initial?.entries.map((e) => ({ id: randomId(), k: e.k, poin: String(e.poin) })) ?? [blank(), blank()])
  const [err, setErr] = useState("")
  const setRow = (id: string, k: "k" | "poin", v: string) => setRows((r) => r.map((x) => (x.id === id ? { ...x, [k]: v } : x)))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const filled = rows.filter((r) => r.k || r.poin)
    if (filled.length < 2) return setErr("Minimal dua kontingen per pertandingan.")
    if (filled.some((r) => !r.k || r.poin.trim() === "" || isNaN(Number(r.poin)) || Number(r.poin) < 0)) return setErr("Setiap baris harus punya kontingen dan poin (angka 0 atau lebih).")
    if (new Set(filled.map((r) => r.k)).size !== filled.length) return setErr("Satu kontingen tidak boleh muncul dua kali dalam pertandingan yang sama.")
    const m: Match = { id: initial?.id ?? randomId(), ...f, babak: f.babak.trim() || BABAK[0], catatan: f.catatan.trim(), entries: filled.map((r) => ({ k: r.k, poin: Number(r.poin) })), createdAt: initial?.createdAt ?? new Date().toISOString(), by: initial?.by ?? me }
    const all = listMatches()
    write(MATCH_KEY, all.some((x) => x.id === m.id) ? all.map((x) => (x.id === m.id ? m : x)) : [...all, m])
    onDone()
  }

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 20, marginBottom: 24, borderTop: `3px solid ${O}`, maxWidth: 820 }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 18, letterSpacing: 2, color: "#fff", marginBottom: 14 }}>{initial ? "UBAH HASIL PERTANDINGAN" : "INPUT HASIL PERTANDINGAN"}</div>
      <datalist id="babak-list">{BABAK.map((b) => <option key={b} value={b} />)}</datalist>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Lomba" htmlFor="s-lomba"><select id="s-lomba" className="tks-input" style={inputStyle} value={f.lomba} onChange={(e) => setF({ ...f, lomba: e.target.value })}>{LOMBA.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <Field label="Babak / Pertandingan" htmlFor="s-babak"><input id="s-babak" list="babak-list" className="tks-input" style={inputStyle} value={f.babak} onChange={(e) => setF({ ...f, babak: e.target.value })} /></Field>
        <Field label="Tanggal" htmlFor="s-tgl"><input id="s-tgl" type="date" className="tks-input" style={dateStyle} value={f.tanggal} onChange={(e) => setF({ ...f, tanggal: e.target.value })} /></Field>
      </div>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, margin: "4px 0 10px" }}>KONTINGEN & POIN</div>
      <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
        {rows.map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: 8 }}>
            <select aria-label={`Kontingen ${i + 1}`} className="tks-input" style={{ ...inputStyle, flex: 1 }} value={r.k} onChange={(e) => setRow(r.id, "k", e.target.value)}>
              <option value="">Pilih kontingen…</option>{cs.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.leader}</option>)}
            </select>
            <input aria-label={`Poin ${i + 1}`} inputMode="decimal" placeholder="Poin" className="tks-input" style={{ ...inputStyle, width: 100 }} value={r.poin} onChange={(e) => setRow(r.id, "poin", e.target.value.replace(",", "."))} />
            {rows.length > 2 && <button type="button" aria-label={`Hapus baris ${i + 1}`} className="tks-btn" onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))} style={{ ...ghost, color: "#ef9a9a" }}>×</button>}
          </div>
        ))}
      </div>
      <button type="button" className="tks-btn" onClick={() => setRows((r) => [...r, blank()])} style={{ ...ghost, color: O, borderColor: O, marginBottom: 14 }}>+ KONTINGEN LAIN</button>
      <Field label="Catatan" htmlFor="s-cat"><input id="s-cat" className="tks-input" style={inputStyle} value={f.catatan} onChange={(e) => setF({ ...f, catatan: e.target.value })} placeholder="Opsional, mis. skor akhir 3-1" /></Field>
      {err && <div role="alert" style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", marginBottom: 10 }}>{err}</div>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">{initial ? "SIMPAN" : "SIMPAN HASIL"}</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onCancel} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

function ShareBox({ cs, ms, final }: { cs: Contingent[]; ms: Match[]; final: boolean }) {
  const [snap, setSnap] = useState("")
  const [copied, setCopied] = useState("")
  const live = `${location.origin}${location.pathname}${SCORE_LIVE}`
  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
    setCopied(key)
  }
  const makeSnap = async () => {
    setSnap(`${location.origin}${location.pathname}${SCORE_SNAP}${await packJson({ c: cs, m: ms, f: final, t: new Date().toISOString() } satisfies Snapshot)}`)
    setCopied("")
  }
  return (
    <div style={{ ...cardStyle, padding: 20, marginBottom: 24, borderLeft: `3px solid ${O}` }}>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 3, color: O, marginBottom: 6 }}>HALAMAN KLASEMEN PUBLIK (TANPA LOGIN)</div>
      <p style={{ fontFamily: BB, fontSize: 13, color: "#aaa", margin: "0 0 12px", lineHeight: 1.6 }}>
        <strong style={{ color: "#ddd" }}>Tautan langsung</strong> selalu menampilkan data terbaru, tetapi hanya di browser tempat hasil diinput.
        <strong style={{ color: "#ddd" }}> Tautan snapshot</strong> membawa data klasemen di dalam tautan sehingga bisa dibuka di perangkat mana pun; buat ulang setelah ada hasil baru.
      </p>
      <input readOnly aria-label="Tautan langsung" className="tks-input" style={{ ...inputStyle, fontSize: 12 }} value={live} onFocus={(e) => e.currentTarget.select()} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 16px" }}>
        <button className="tks-btn" onClick={() => copy(live, "live")} style={solid}>{copied === "live" ? "TERSALIN ✓" : "SALIN TAUTAN LANGSUNG"}</button>
        <a className="tks-btn" href={live} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>BUKA HALAMAN</a>
      </div>
      {!snap ? <button className="tks-btn" onClick={makeSnap} style={{ ...ghost, color: O, borderColor: O }}>BUAT TAUTAN SNAPSHOT (BISA DIBUKA DI PERANGKAT LAIN)</button> : (
        <>
          <input readOnly aria-label="Tautan snapshot" className="tks-input" style={{ ...inputStyle, fontSize: 12 }} value={snap} onFocus={(e) => e.currentTarget.select()} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <button className="tks-btn" onClick={() => copy(snap, "snap")} style={solid}>{copied === "snap" ? "TERSALIN ✓" : "SALIN TAUTAN SNAPSHOT"}</button>
            <a className="tks-btn" href={`https://wa.me/?text=${encodeURIComponent(`Klasemen lomba TKS 2027 PKB GPIB:\n${snap}`)}`} target="_blank" rel="noreferrer" style={{ ...ghost, textDecoration: "none", display: "inline-block" }}>KIRIM VIA WHATSAPP</a>
            <button className="tks-btn" onClick={makeSnap} style={ghost}>PERBARUI</button>
          </div>
        </>
      )}
    </div>
  )
}

export function ScoreAdminTab({ me }: { me: string }) {
  const [ms, setMs] = useState(listMatches)
  const [final, setFinal] = useState(isFinal)
  const [form, setForm] = useState<Match | "new" | null>(null)
  const [lomba, setLomba] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [cs, setCs] = useState<Contingent[]>([])
  useEffect(() => { void loadContingents().then(setCs).catch(() => setCs([])) }, [])
  const names = useMemo(() => new Map(cs.map((c) => [c.id, c.name])), [cs])
  const rows = useMemo(() => computeStandings(cs, ms, lomba), [cs, ms, lomba])
  const reload = () => setMs(listMatches())
  const shown = ms.filter((m) => !lomba || m.lomba === lomba).sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || "") || b.createdAt.localeCompare(a.createdAt))
  const csv = () => {
    const all = computeStandings(cs, ms)
    const lines = [["Peringkat", "Kontingen", "Ketua", ...LOMBA, "Menang", "Total Poin"], ...all.map((r) => [r.rank, r.name, r.leader, ...LOMBA.map((l) => r.perLomba[l] ?? ""), r.menang, r.poin])]
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob(["﻿" + lines.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" }))
    a.download = "klasemen-tks2027.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <H>HASIL LOMBA & JUARA UMUM</H>
      {cs.length < 2 && <Banner tone="info">Baru {cs.length} kontingen yang punya peserta terdaftar. Pertandingan butuh minimal dua kontingen.</Banner>}
      <ShareBox cs={cs} ms={ms} final={final} />
      {form ? (
        <MatchForm initial={form === "new" ? null : form} cs={cs} me={me} defaultLomba={lomba} onCancel={() => setForm(null)} onDone={() => { setForm(null); reload() }} />
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <PrimaryButton onClick={() => setForm("new")}>+ INPUT HASIL PERTANDINGAN</PrimaryButton>
          <button className="tks-btn" onClick={csv} style={{ ...ghost, color: O, borderColor: O }}>EXPORT CSV</button>
          <label style={{ display: "inline-flex", gap: 8, alignItems: "center", fontFamily: BB, fontSize: 14, color: "#ddd", cursor: "pointer" }}>
            <input type="checkbox" checked={final} onChange={(e) => { write(SCORE_FINAL_KEY, e.target.checked); setFinal(e.target.checked) }} />
            Tetapkan klasemen final (tampilkan sebagai Juara Umum)
          </label>
        </div>
      )}
      <LombaFilter value={lomba} onChange={setLomba} matches={ms} />
      <Podium rows={rows} final={final} lomba={lomba} />
      {rows.length === 0 ? <Empty>Belum ada kontingen terdaftar.</Empty> : <StandingsTable rows={rows} lomba={lomba} />}
      <H>RIWAYAT PERTANDINGAN ({shown.length})</H>
      {shown.length === 0 ? <Empty>Belum ada hasil pertandingan.</Empty> : (
        <div style={{ display: "grid", gap: 10 }}>
          {shown.map((m) => (
            <MatchCard key={m.id} m={m} names={names} actions={
              <>
                <button className="tks-btn" onClick={() => { setForm(m); window.scrollTo({ top: 0, behavior: "smooth" }) }} style={ghost}>UBAH</button>
                <DeleteControl id={m.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus hasil?" onDelete={() => { write(MATCH_KEY, listMatches().filter((x) => x.id !== m.id)); setConfirmId(null); reload() }} />
              </>
            } />
          ))}
        </div>
      )}
    </div>
  )
}
