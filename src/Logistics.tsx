import React, { useState } from "react"
import {
  read,
  write,
  randomId,
  upsert,
  removeById,
  REG_KEY,
  TRAVEL_KEY,
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
  type Medical,
  type TravelGroup,
  type User,
} from "@/Account"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

const GOLONGAN = ["A", "B", "AB", "O", "Tidak tahu"]
const PENYAKIT = ["Asma", "Diabetes", "Hipertensi", "Penyakit jantung", "Epilepsi", "Maag / lambung", "Alergi berat (anafilaksis)"]
const HUBUNGAN = ["Orang tua", "Suami / Istri", "Saudara", "Pendeta / Pembina", "Lainnya"]
const WA_RE = /^(\+?62|0)8\d{7,12}$/

const emptyMed = (): Medical => ({
  golongan: "",
  alergi: "",
  penyakit: [],
  penyakitLain: "",
  obat: "",
  riwayatRawat: "",
  kondisiKhusus: "",
  kontakNama: "",
  kontakHubungan: "",
  kontakTelp: "",
  updatedAt: "",
})

const patchReg = (id: string, patch: Partial<Registration>) =>
  write(
    REG_KEY,
    read<Registration[]>(REG_KEY, []).map((r) => ((r.id ?? r.regNo) === id ? { ...r, ...patch } : r)),
  )

const dateColor = { ...inputStyle, colorScheme: "dark" } as React.CSSProperties

// ── Medical history ────────────────────────────────────────────────────────────
function MedicalForm({ reg, onClose, onSaved }: { reg: Registration; onClose: () => void; onSaved: () => void }) {
  const [m, setM] = useState<Medical>(reg.medical ?? emptyMed())
  const [agree, setAgree] = useState(!!reg.medical)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = <K extends keyof Medical>(k: K, v: Medical[K]) => setM((s) => ({ ...s, [k]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (!m.golongan) er.golongan = "Pilih golongan darah."
    if (m.kontakNama.trim().length < 3) er.kontakNama = "Isi nama kontak darurat."
    if (!m.kontakHubungan) er.kontakHubungan = "Pilih hubungan."
    if (!WA_RE.test(m.kontakTelp.replace(/[\s-]/g, ""))) er.kontakTelp = "Nomor telepon tidak valid (contoh: 081234567890)."
    if (!agree) er.agree = "Centang pernyataan kebenaran data."
    setErrs(er)
    if (Object.keys(er).length) return
    patchReg(reg.id, { medical: { ...m, kontakTelp: m.kontakTelp.replace(/[\s-]/g, ""), updatedAt: new Date().toISOString() } })
    onSaved()
  }

  const toggle = (p: string) => set("penyakit", m.penyakit.includes(p) ? m.penyakit.filter((x) => x !== p) : [...m.penyakit, p])
  const id = (k: string) => `med-${k}`

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 24, maxWidth: 720 }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 4, color: O, marginBottom: 4 }}>RIWAYAT MEDIS</div>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 30, color: "#fff", letterSpacing: 1, margin: "0 0 20px" }}>{reg.nama}</h2>

      <Field label="Golongan Darah" htmlFor={id("gol")} error={errs.golongan}>
        <select id={id("gol")} className="tks-input" style={inputStyle} value={m.golongan} onChange={(e) => set("golongan", e.target.value)}>
          <option value="">Pilih…</option>
          {GOLONGAN.map((g) => <option key={g}>{g}</option>)}
        </select>
      </Field>

      <Field label="Riwayat Penyakit" hint="Centang bila pernah atau sedang menderita.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PENYAKIT.map((p) => {
            const on = m.penyakit.includes(p)
            return (
              <label key={p} style={{ fontFamily: BB, fontSize: 14, color: on ? "#fff" : "#ccc", background: on ? "rgba(255,109,0,.25)" : "#262626", border: `1px solid ${on ? O : "#555"}`, padding: "8px 12px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={on} onChange={() => toggle(p)} style={{ accentColor: O }} />
                {p}
              </label>
            )
          })}
        </div>
      </Field>

      <Field label="Penyakit Lainnya" htmlFor={id("lain")}>
        <input id={id("lain")} className="tks-input" style={inputStyle} value={m.penyakitLain} onChange={(e) => set("penyakitLain", e.target.value)} placeholder="Kosongkan bila tidak ada" />
      </Field>
      <Field label="Alergi (obat / makanan / lainnya)" htmlFor={id("alergi")}>
        <input id={id("alergi")} className="tks-input" style={inputStyle} value={m.alergi} onChange={(e) => set("alergi", e.target.value)} placeholder="Contoh: Kacang, Penisilin. Kosongkan bila tidak ada" />
      </Field>
      <Field label="Obat yang Dikonsumsi Rutin" htmlFor={id("obat")}>
        <input id={id("obat")} className="tks-input" style={inputStyle} value={m.obat} onChange={(e) => set("obat", e.target.value)} placeholder="Nama obat dan dosis" />
      </Field>
      <Field label="Riwayat Operasi / Rawat Inap" htmlFor={id("rawat")}>
        <textarea id={id("rawat")} className="tks-input" rows={2} style={{ ...inputStyle, resize: "vertical" }} value={m.riwayatRawat} onChange={(e) => set("riwayatRawat", e.target.value)} />
      </Field>
      <Field label="Kondisi / Kebutuhan Khusus" htmlFor={id("khusus")} hint="Mis. kursi roda, diet khusus, pantangan aktivitas fisik.">
        <textarea id={id("khusus")} className="tks-input" rows={2} style={{ ...inputStyle, resize: "vertical" }} value={m.kondisiKhusus} onChange={(e) => set("kondisiKhusus", e.target.value)} />
      </Field>

      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 14, letterSpacing: 3, color: O, margin: "8px 0 14px" }}>KONTAK DARURAT</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Nama" htmlFor={id("kn")} error={errs.kontakNama}>
          <input id={id("kn")} className="tks-input" style={inputStyle} value={m.kontakNama} onChange={(e) => set("kontakNama", e.target.value)} />
        </Field>
        <Field label="Hubungan" htmlFor={id("kh")} error={errs.kontakHubungan}>
          <select id={id("kh")} className="tks-input" style={inputStyle} value={m.kontakHubungan} onChange={(e) => set("kontakHubungan", e.target.value)}>
            <option value="">Pilih…</option>
            {HUBUNGAN.map((h) => <option key={h}>{h}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Nomor Telepon / WhatsApp" htmlFor={id("kt")} error={errs.kontakTelp}>
        <input id={id("kt")} inputMode="tel" className="tks-input" style={inputStyle} value={m.kontakTelp} onChange={(e) => set("kontakTelp", e.target.value)} placeholder="081234567890" />
      </Field>

      <Field label="" error={errs.agree}>
        <label style={{ display: "flex", gap: 10, fontFamily: BB, fontSize: 14, color: "#ddd", cursor: "pointer", lineHeight: 1.5 }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ accentColor: O, marginTop: 3 }} />
          Saya menyatakan data riwayat medis ini benar dan bersedia digunakan panitia untuk penanganan kesehatan selama acara.
        </label>
      </Field>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">SIMPAN RIWAYAT MEDIS</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onClose} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

export function MedicalTab({ regs, refresh }: { regs: Registration[]; refresh: () => void }) {
  const [editId, setEditId] = useState<string | null>(null)
  const [saved, setSaved] = useState("")
  const editing = regs.find((r) => r.id === editId)
  const done = regs.filter((r) => r.medical).length

  if (editing) {
    return <MedicalForm reg={editing} onClose={() => setEditId(null)} onSaved={() => { setSaved(editing.nama); setEditId(null); refresh(); window.scrollTo({ top: 0 }) }} />
  }

  return (
    <div>
      {saved && <Banner tone="ok">Riwayat medis {saved} tersimpan.</Banner>}
      {regs.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "48px 24px", textAlign: "center", fontFamily: BB, color: "#aaa" }}>
          Daftarkan peserta terlebih dahulu pada tab PESERTA.
        </div>
      ) : (
        <>
          <p style={{ fontFamily: BB, fontSize: 14, color: "#bbb", margin: "0 0 16px" }}>
            Lengkapi riwayat medis setiap peserta. <strong style={{ color: "#fff" }}>{done} dari {regs.length}</strong> sudah diisi.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {[...regs].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((r) => (
              <article key={r.id} style={{ ...cardStyle, padding: 14, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <img src={r.foto} alt="" style={{ width: 44, height: 56, objectFit: "cover", border: `1px solid ${O}` }} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 20, color: "#fff" }}>{r.nama}</div>
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#999" }}>
                    {r.jenis} · {r.regNo}
                    {r.medical && <> · Gol. darah {r.medical.golongan}{r.medical.penyakit.length ? ` · ${r.medical.penyakit.join(", ")}` : " · tanpa riwayat penyakit"}{r.medical.alergi && ` · alergi: ${r.medical.alergi}`}</>}
                  </div>
                </div>
                <Chip tone={r.medical ? "green" : "gray"}>{r.medical ? "SUDAH DIISI" : "BELUM DIISI"}</Chip>
                <button className="tks-btn" onClick={() => { setSaved(""); setEditId(r.id) }} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>
                  {r.medical ? "UBAH" : "ISI"}
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Arrival / departure groups ─────────────────────────────────────────────────
const LOKASI = ["Bandara Soekarno-Hatta", "Bandara Halim Perdanakusuma", "Stasiun Gambir", "Stasiun Pasar Senen", "Pelabuhan Tanjung Priok", "Terminal Pulo Gebang"]

type TForm = Omit<TravelGroup, "id" | "owner" | "createdAt">
const emptyT = (): TForm => ({ nama: "", regIds: [], lokasiDatang: "", tglDatang: "", lokasiBerangkat: "", tglBerangkat: "", jamBerangkat: "" })

function TravelForm({ user, regs, groups, existing, onClose, onSaved }: { user: User; regs: Registration[]; groups: TravelGroup[]; existing: TravelGroup | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<TForm>(existing ? { ...existing } : emptyT())
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = <K extends keyof TForm>(k: K, v: TForm[K]) => setF((s) => ({ ...s, [k]: v }))
  const takenBy = (rid: string) => groups.find((g) => g.id !== existing?.id && g.regIds.includes(rid))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.nama.trim().length < 2) er.nama = "Beri nama grup."
    if (!f.regIds.length) er.regIds = "Pilih minimal satu peserta."
    if (!f.lokasiDatang.trim()) er.lokasiDatang = "Wajib diisi."
    if (!f.tglDatang) er.tglDatang = "Wajib diisi."
    if (!f.lokasiBerangkat.trim()) er.lokasiBerangkat = "Wajib diisi."
    if (!f.tglBerangkat) er.tglBerangkat = "Wajib diisi."
    else if (f.tglDatang && f.tglBerangkat < f.tglDatang) er.tglBerangkat = "Tanggal keberangkatan tidak boleh sebelum kedatangan."
    if (!f.jamBerangkat) er.jamBerangkat = "Wajib diisi."
    setErrs(er)
    if (Object.keys(er).length) return
    upsert<TravelGroup>(TRAVEL_KEY, {
      ...f,
      nama: f.nama.trim(),
      lokasiDatang: f.lokasiDatang.trim(),
      lokasiBerangkat: f.lokasiBerangkat.trim(),
      id: existing?.id ?? randomId(),
      owner: user.email,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
    onSaved()
  }

  const toggle = (id: string) => set("regIds", f.regIds.includes(id) ? f.regIds.filter((x) => x !== id) : [...f.regIds, id])
  const sectionTitle = (t: string) => <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 14, letterSpacing: 3, color: O, margin: "8px 0 14px" }}>{t}</div>

  return (
    <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: 24, maxWidth: 720 }}>
      <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: 1, margin: "0 0 20px" }}>{existing ? "UBAH GRUP" : "GRUP BARU"}</h2>

      <Field label="Nama Grup" htmlFor="tg-nama" error={errs.nama} hint="Contoh: Rombongan Bus 1, Tim Paduan Suara.">
        <input id="tg-nama" className="tks-input" style={inputStyle} value={f.nama} onChange={(e) => set("nama", e.target.value)} />
      </Field>

      <Field label={`Anggota Grup (${f.regIds.length})`} error={errs.regIds} hint="Satu peserta hanya dapat berada di satu grup.">
        <div style={{ display: "grid", gap: 6, maxHeight: 260, overflowY: "auto", border: "1px solid #444", padding: 8 }}>
          {regs.map((r) => {
            const other = takenBy(r.id)
            const on = f.regIds.includes(r.id)
            return (
              <label key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: BB, fontSize: 14, color: other ? "#777" : "#eee", cursor: other ? "not-allowed" : "pointer", padding: "6px 8px", background: on ? "rgba(255,109,0,.15)" : "none" }}>
                <input type="checkbox" checked={on} disabled={!!other} onChange={() => toggle(r.id)} style={{ accentColor: O }} />
                <span style={{ flex: 1 }}>{r.nama} <span style={{ color: "#888" }}>· {r.jenis}</span></span>
                {other && <span style={{ fontSize: 12 }}>di grup {other.nama}</span>}
              </label>
            )
          })}
        </div>
      </Field>

      <datalist id="lokasi-jkt">{LOKASI.map((l) => <option key={l} value={l} />)}</datalist>

      {sectionTitle("KEDATANGAN DI JAKARTA")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Lokasi Kedatangan" htmlFor="tg-ld" error={errs.lokasiDatang}>
          <input id="tg-ld" list="lokasi-jkt" className="tks-input" style={inputStyle} value={f.lokasiDatang} onChange={(e) => set("lokasiDatang", e.target.value)} placeholder="Bandara, stasiun, terminal…" />
        </Field>
        <Field label="Tanggal Kedatangan" htmlFor="tg-td" error={errs.tglDatang}>
          <input id="tg-td" type="date" className="tks-input" style={dateColor} value={f.tglDatang} onChange={(e) => set("tglDatang", e.target.value)} />
        </Field>
      </div>

      {sectionTitle("KEBERANGKATAN DARI JAKARTA")}
      <Field label="Lokasi Keberangkatan" htmlFor="tg-lb" error={errs.lokasiBerangkat}>
        <input id="tg-lb" list="lokasi-jkt" className="tks-input" style={inputStyle} value={f.lokasiBerangkat} onChange={(e) => set("lokasiBerangkat", e.target.value)} placeholder="Bandara, stasiun, terminal…" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="card-grid">
        <Field label="Tanggal Keberangkatan" htmlFor="tg-tb" error={errs.tglBerangkat}>
          <input id="tg-tb" type="date" min={f.tglDatang || undefined} className="tks-input" style={dateColor} value={f.tglBerangkat} onChange={(e) => set("tglBerangkat", e.target.value)} />
        </Field>
        <Field label="Jam Keberangkatan" htmlFor="tg-jb" error={errs.jamBerangkat}>
          <input id="tg-jb" type="time" className="tks-input" style={dateColor} value={f.jamBerangkat} onChange={(e) => set("jamBerangkat", e.target.value)} />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <PrimaryButton type="submit">SIMPAN GRUP</PrimaryButton>
        <button type="button" className="tks-btn" onClick={onClose} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
      </div>
    </form>
  )
}

export function TravelTab({ user, regs, groups, refresh }: { user: User; regs: Registration[]; groups: TravelGroup[]; refresh: () => void }) {
  const [editing, setEditing] = useState<TravelGroup | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const ungrouped = regs.filter((r) => !groups.some((g) => g.regIds.includes(r.id))).length

  if (editing) {
    return <TravelForm user={user} regs={regs} groups={groups} existing={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); window.scrollTo({ top: 0 }) }} />
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <p style={{ fontFamily: BB, fontSize: 14, color: "#bbb", margin: 0 }}>
          {regs.length ? <>Kelompokkan peserta yang tiba dan berangkat bersama. <strong style={{ color: ungrouped ? "#ffb74d" : "#a5d6a7" }}>{ungrouped} peserta belum masuk grup.</strong></> : "Daftarkan peserta terlebih dahulu pada tab PESERTA."}
        </p>
        {regs.length > 0 && <PrimaryButton onClick={() => setEditing("new")}>+ BUAT GRUP</PrimaryButton>}
      </div>

      {groups.length === 0 ? (
        regs.length > 0 && <div style={{ ...cardStyle, border: "1px dashed #666", padding: "48px 24px", textAlign: "center", fontFamily: BB, color: "#aaa" }}>Belum ada grup kedatangan dan keberangkatan.</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map((g) => {
            const members = g.regIds.map((id) => regs.find((r) => r.id === id)?.nama).filter(Boolean) as string[]
            const cell = (k: string, v: string) => (
              <div>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 3, color: "#999" }}>{k}</div>
                <div style={{ fontFamily: BB, fontSize: 15, color: "#fff" }}>{v}</div>
              </div>
            )
            return (
              <article key={g.id} style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                  <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 24, color: "#fff", letterSpacing: 1 }}>{g.nama}</div>
                  <Chip tone="gray">{members.length} PESERTA</Chip>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 14 }} className="card-grid">
                  <div style={{ borderLeft: `3px solid ${O}`, paddingLeft: 14, display: "grid", gap: 8 }}>
                    <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 12, letterSpacing: 3, color: O }}>KEDATANGAN</div>
                    {cell("LOKASI", g.lokasiDatang)}
                    {cell("TANGGAL", fmtDate(g.tglDatang))}
                  </div>
                  <div style={{ borderLeft: "3px solid #888", paddingLeft: 14, display: "grid", gap: 8 }}>
                    <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 12, letterSpacing: 3, color: "#bbb" }}>KEBERANGKATAN</div>
                    {cell("LOKASI", g.lokasiBerangkat)}
                    {cell("TANGGAL & JAM", `${fmtDate(g.tglBerangkat)} · ${g.jamBerangkat}`)}
                  </div>
                </div>
                <div style={{ fontFamily: BB, fontSize: 13, color: "#bbb", marginBottom: 14 }}>{members.join(", ") || "Belum ada anggota"}</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button className="tks-btn" onClick={() => setEditing(g)} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>UBAH</button>
                  <DeleteControl id={g.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus grup ini?" onDelete={() => { removeById<TravelGroup>(TRAVEL_KEY, g.id); setConfirmId(null); refresh() }} />
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
