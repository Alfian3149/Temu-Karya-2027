import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  listTrips,
  updateTrip,
  Banner,
  Chip,
  Field,
  PrimaryButton,
  inputStyle,
  smallBtn,
  cardStyle,
  fmtDate,
  type Trans,
  type Trip,
  type TripStatus,
} from "@/Account"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

const when = (trip: Trip) => `${fmtDate(trip.tanggal)} · ${trip.jam}`

function TripTable({ trip }: { trip: Trip }) {
  const cell = { border: "1px solid #ccc", padding: "6px 8px", textAlign: "left" as const, fontSize: 12 }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: BB, color: "#111" }}>
      <thead>
        <tr>
          {["No", "Nama Peserta", "Asal Mupel", "Dari Lokasi", "Ke Lokasi", "Tanggal & Jam", "Diorganisir Oleh", "Kendaraan"].map((h) => (
            <th key={h} style={{ ...cell, background: "#f3f3f3", fontFamily: BC, letterSpacing: 0.5 }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {trip.passengers.map((p, i) => (
          <tr key={p.id}>
            <td style={cell}>{i + 1}</td>
            <td style={cell}>{p.nama}</td>
            <td style={cell}>{p.mupel}</td>
            <td style={cell}>{trip.dari || "-"}</td>
            <td style={cell}>{trip.ke || "-"}</td>
            <td style={cell}>{when(trip)}</td>
            <td style={cell}>{trip.organizer}</td>
            <td style={cell}>{trip.kendaraan || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TripPrint({ trip, onClose }: { trip: Trip; onClose: () => void }) {
  useEffect(() => {
    document.body.classList.add("tks-printing")
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => { document.body.classList.remove("tks-printing"); window.removeEventListener("keydown", onKey) }
  }, [onClose])

  return createPortal(
    <div className="tks-print-overlay" role="dialog" aria-label="Cetak jadwal trip" style={{ position: "fixed", inset: 0, zIndex: 200, background: "#2a2a2a", overflow: "auto" }}>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
          body.tks-printing #root { display: none !important; }
          .tks-print-overlay { position: static !important; background: #fff !important; overflow: visible !important; }
          .tks-print-bar { display: none !important; }
        }
      `}</style>
      <div className="tks-print-bar" style={{ position: "sticky", top: 0, zIndex: 1, background: "#1f1f1f", borderBottom: "1px solid #555", padding: "12px 24px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <strong style={{ fontFamily: BC, fontSize: 18, letterSpacing: 2, color: "#fff", flex: 1 }}>CETAK {trip.jenis.toUpperCase()} · {trip.nama}</strong>
        <button className="tks-btn" onClick={() => window.print()} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>CETAK / SIMPAN PDF</button>
        <button className="tks-btn" onClick={onClose} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>TUTUP</button>
      </div>
      <div style={{ background: "#fff", color: "#111", margin: "24px auto", maxWidth: 1100, padding: 28 }}>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, letterSpacing: 1 }}>JADWAL {trip.jenis.toUpperCase()}</div>
        <div style={{ fontFamily: BB, fontSize: 14, margin: "4px 0 16px" }}>{trip.nama} · {when(trip)} · {trip.passengers.length} peserta · Status {trip.status}</div>
        <TripTable trip={trip} />
      </div>
    </div>,
    document.body,
  )
}

export function TripSchedule({ trans }: { trans: Trans[] }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState("")
  const [q, setQ] = useState("")
  const [jenis, setJenis] = useState("")
  const [status, setStatus] = useState("")
  const [detail, setDetail] = useState<Trip | null>(null)
  const [printTrip, setPrintTrip] = useState<Trip | null>(null)
  const [lokasi, setLokasi] = useState("")
  const [kendaraanId, setKendaraanId] = useState("")

  const load = async () => {
    try {
      const rows = await listTrips()
      setTrips(rows)
      setErr("")
      setDetail((current) => current ? rows.find((row) => row.id === current.id) ?? null : null)
    } catch (error) {
      setErr((error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const openDetail = (trip: Trip) => {
    setDetail(trip)
    setLokasi(trip.leg === "datang" ? trip.dari : trip.ke)
    setKendaraanId(trip.kendaraanId)
    setErr("")
  }

  const saveDetail = () => {
    if (!detail) return
    void updateTrip(detail.groupId, detail.leg, { lokasi: lokasi.trim(), kendaraanId }).then(load).catch((error: Error) => setErr(error.message))
  }

  const markTrip = (trip: Trip, next: TripStatus) => {
    void updateTrip(trip.groupId, trip.leg, { status: next }).then(load).catch((error: Error) => setErr(error.message))
  }

  const list = trips
    .filter((trip) => !jenis || trip.jenis === jenis)
    .filter((trip) => !status || trip.status === status)
    .filter((trip) => {
      const blob = [trip.nama, trip.dari, trip.ke, trip.organizer, trip.kendaraan, ...trip.passengers.flatMap((p) => [p.nama, p.mupel])].join(" ").toLowerCase()
      return !q || blob.includes(q.toLowerCase())
    })

  return (
    <div>
      {err && <Banner tone="error">{err}</Banner>}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input className="tks-input" aria-label="Cari jadwal" style={{ ...inputStyle, flex: 1, minWidth: 200, padding: "10px 14px" }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari peserta, mupel, lokasi, kendaraan…" />
        <select className="tks-input" aria-label="Jenis trip" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={jenis} onChange={(e) => setJenis(e.target.value)}>
          <option value="">Kedatangan dan kepulangan</option>
          <option>Kedatangan</option>
          <option>Kepulangan</option>
        </select>
        <select className="tks-input" aria-label="Status trip" style={{ ...inputStyle, width: "auto", padding: "10px 14px" }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          <option>Belum</option>
          <option>Selesai</option>
        </select>
      </div>
      {loading ? <div style={{ fontFamily: BB, color: "#aaa" }}>Memuat jadwal…</div> : list.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, color: "#aaa" }}>Belum ada jadwal trip. Kontingen mengisi kedatangan dan kepulangan pada menu registrasi.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {list.map((trip) => (
            <article key={trip.id} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2, color: O }}>{trip.jenis.toUpperCase()} · {trip.nama}</div>
                <Chip tone={trip.status === "Selesai" ? "green" : "orange"}>{trip.status.toUpperCase()}</Chip>
              </div>
              <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, color: "#fff", margin: "4px 0" }}>{trip.dari || "-"} → {trip.ke || "-"}</div>
              <div style={{ fontFamily: BB, fontSize: 13, color: "#ccc", lineHeight: 1.7 }}>
                {when(trip)} · {trip.passengers.length} peserta · Diorganisir {trip.organizer} · Kendaraan {trip.kendaraan || "belum ditentukan"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button className="tks-btn" onClick={() => openDetail(trip)} style={{ ...smallBtn, color: "#fff", background: O, border: "none" }}>DETAIL</button>
                <button className="tks-btn" onClick={() => setPrintTrip(trip)} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>CETAK TRIP</button>
                <button className="tks-btn" onClick={() => markTrip(trip, trip.status === "Selesai" ? "Belum" : "Selesai")} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>
                  {trip.status === "Selesai" ? "TANDAI BELUM" : "TANDAI SELESAI"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {detail && (
        <div role="dialog" aria-label="Detail trip" style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,.72)", overflow: "auto", padding: 24 }}>
          <div style={{ ...cardStyle, maxWidth: 980, margin: "0 auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2, color: O }}>{detail.jenis.toUpperCase()} · {detail.nama}</div>
                <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff", margin: "4px 0" }}>{detail.dari || "-"} → {detail.ke || "-"}</h2>
                <div style={{ fontFamily: BB, fontSize: 14, color: "#ccc" }}>{when(detail)} · Diorganisir oleh {detail.organizer}</div>
              </div>
              <Chip tone={detail.status === "Selesai" ? "green" : "orange"}>{detail.status.toUpperCase()}</Chip>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 18 }} className="card-grid">
              <Field label={detail.leg === "datang" ? "Dari Lokasi" : "Ke Lokasi"} htmlFor="trip-lokasi">
                <input id="trip-lokasi" className="tks-input" style={inputStyle} value={lokasi} onChange={(e) => setLokasi(e.target.value)} />
              </Field>
              <Field label="Kendaraan" htmlFor="trip-kendaraan">
                <select id="trip-kendaraan" className="tks-input" style={inputStyle} value={kendaraanId} onChange={(e) => setKendaraanId(e.target.value)}>
                  <option value="">Belum ditentukan</option>
                  {trans.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.kind} · {item.route}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 18px" }}>
              <PrimaryButton type="button" onClick={saveDetail}>SIMPAN PERUBAHAN</PrimaryButton>
              <button className="tks-btn" onClick={() => markTrip(detail, detail.status === "Selesai" ? "Belum" : "Selesai")} style={{ ...smallBtn, color: "#fff", background: detail.status === "Selesai" ? "#666" : "#2e7d32", border: "none" }}>
                {detail.status === "Selesai" ? "TANDAI BELUM SELESAI" : "TANDAI SELESAI"}
              </button>
              <button className="tks-btn" onClick={() => setPrintTrip(detail)} style={{ ...smallBtn, color: O, background: "none", border: `1px solid ${O}` }}>CETAK TRIP INI</button>
              <button className="tks-btn" onClick={() => setDetail(null)} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>TUTUP</button>
            </div>
            <div style={{ overflowX: "auto", background: "#fff", padding: 12 }}>
              <TripTable trip={{ ...detail, dari: detail.leg === "datang" ? lokasi : detail.dari, ke: detail.leg === "berangkat" ? lokasi : detail.ke, kendaraan: trans.find((item) => item.id === kendaraanId)?.name || detail.kendaraan }} />
            </div>
          </div>
        </div>
      )}
      {printTrip && <TripPrint trip={printTrip} onClose={() => setPrintTrip(null)} />}
    </div>
  )
}
