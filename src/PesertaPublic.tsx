import React, { useEffect, useState } from "react"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"
import { mupelText } from "@/Account"
import { supabase } from "@/lib/supabase"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

export const KARTU_PREFIX = "#/kartu/"

export type AgendaHari = { date: string; day: string; items: { time: string; activity: string }[] }

export function kartuUrl(regNo: string) {
  return `${location.origin}${location.pathname}${KARTU_PREFIX}${encodeURIComponent(regNo)}`
}

type Kartu = { nomor: string; nama: string; gereja: string; mupel: string; hotel: string; kamar: string }

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #3a3a3a" }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2, color: "#999" }}>{label}</div>
      <div style={{ fontFamily: BB, fontSize: 16, color: "#fff", marginTop: 2, lineHeight: 1.45 }}>{value || "Belum ditentukan"}</div>
    </div>
  )
}

export function PublicPeserta({ agenda }: { agenda: AgendaHari[] }) {
  const nomor = decodeURIComponent(location.hash.slice(KARTU_PREFIX.length)).trim()
  const [kartu, setKartu] = useState<Kartu | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let live = true
    if (!nomor) {
      setState("missing")
      return
    }
    setState("loading")
    void supabase.rpc("kartu_peserta", { nomor }).then(({ data, error }) => {
      if (!live) return
      if (error) {
        setMessage(/kartu_peserta|schema cache|could not find/i.test(error.message)
          ? "Halaman kartu belum aktif. Jalankan skrip supabase/kartu-peserta.sql di SQL Editor."
          : "Data peserta tidak dapat dimuat. Periksa koneksi, lalu pindai ulang.")
        setState("error")
        return
      }
      const row = (data ?? [])[0] as { nomor_registrasi: string; nama: string; gereja: string; mupel: string; hotel: string; kamar: string } | undefined
      if (!row) {
        setState("missing")
        return
      }
      setKartu({ nomor: row.nomor_registrasi, nama: row.nama, gereja: row.gereja, mupel: row.mupel, hotel: row.hotel, kamar: row.kamar })
      setState("ready")
    })
    return () => { live = false }
  }, [nomor])

  useEffect(() => {
    document.title = kartu ? `${kartu.nama} · TKS 2027` : "Kartu Peserta · TKS 2027"
  }, [kartu])

  return (
    <div style={{ minHeight: "100vh", background: "#1a1a1a", color: "#fff", padding: "20px 16px 64px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <img src={logo} alt="" style={{ width: 48, height: 48, objectFit: "contain", background: "#fff", borderRadius: "50%" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 1, lineHeight: 1 }}>TKS 2027 PKB GPIB</div>
            <div style={{ fontFamily: BC, fontWeight: 600, fontSize: 12, letterSpacing: 2, color: O }}>KARTU PESERTA</div>
          </div>
          <a href={location.pathname} style={{ fontFamily: BC, fontWeight: 700, letterSpacing: 1.5, fontSize: 13, color: "#ddd", textDecoration: "none" }}>SITUS</a>
        </div>

        {state === "loading" && <p style={{ fontFamily: BB, color: "#aaa" }}>Memuat data peserta…</p>}
        {state === "missing" && (
          <div style={{ background: "#2d2d2d", border: "1px solid #4a4a4a", padding: 24, fontFamily: BB, color: "#ddd", lineHeight: 1.6 }}>
            Data peserta untuk nomor {nomor || "ini"} tidak ditemukan.
          </div>
        )}
        {state === "error" && (
          <div style={{ background: "#2d2d2d", border: "1px solid #4a4a4a", padding: 24, fontFamily: BB, color: "#ffcc80", lineHeight: 1.6 }}>{message}</div>
        )}

        {state === "ready" && kartu && (
          <>
            <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2, color: O }}>{kartu.nomor}</div>
            <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(32px, 8vw, 44px)", letterSpacing: 0.5, lineHeight: 0.95, margin: "6px 0 18px", textTransform: "uppercase" }}>{kartu.nama}</h1>
            <div style={{ background: "#2d2d2d", border: "1px solid #4a4a4a", padding: "4px 18px 8px", marginBottom: 28 }}>
              <FieldRow label="NAMA LENGKAP" value={kartu.nama} />
              <FieldRow label="ASAL MUPEL" value={mupelText(kartu.mupel)} />
              <FieldRow label="GEREJA" value={kartu.gereja} />
              <FieldRow label="HOTEL" value={kartu.hotel} />
              <FieldRow label="KAMAR" value={kartu.kamar} />
            </div>
          </>
        )}

        <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, margin: "8px 0 12px" }}>JADWAL ACARA</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {agenda.map((day) => (
            <section key={day.date} style={{ background: "#2d2d2d", border: "1px solid #4a4a4a", padding: "14px 16px" }}>
              <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 1, color: O }}>{day.day.toUpperCase()} · {day.date}</div>
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {day.items.map((item) => (
                  <div key={item.time + item.activity} style={{ display: "grid", gridTemplateColumns: "108px 1fr", gap: 8 }}>
                    <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 13, color: "#bbb" }}>{item.time}</div>
                    <div style={{ fontFamily: BB, fontSize: 14, color: "#eee", lineHeight: 1.4 }}>{item.activity}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
