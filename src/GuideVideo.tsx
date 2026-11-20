import React, { useEffect, useRef, useState } from "react"
import { useSite } from "@/siteContent"
import { panduanFrom, type Panduan } from "@/siteDefaults"

const BC = "'Barlow Condensed', sans-serif"
const O = "#FF6D00"

function embedSrc(id: string) {
  const params = new URLSearchParams({ rel: "0", autoplay: "1" })
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`
}

function PanduanDialog({
  title,
  id,
  onClose,
}: {
  title: string
  id: string
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div onClick={(event) => event.stopPropagation()} style={{ width: "min(960px, 100%)", background: "#1c1c1c" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "14px 16px" }}>
          <div style={{ fontFamily: BC, fontWeight: 800, letterSpacing: 2, color: "#fff" }}>{title}</div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{ fontFamily: BC, fontWeight: 800, letterSpacing: 2, color: "#fff", background: "transparent", border: "1px solid rgba(255,255,255,0.4)", padding: "8px 14px", cursor: "pointer" }}
          >
            TUTUP
          </button>
        </div>
        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
          <iframe
            title={title}
            src={embedSrc(id)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      </div>
    </div>
  )
}

export function PanduanTautan({ bagian, tampilan = "tombol" }: { bagian: "akun" | "peserta"; tampilan?: "tombol" | "panel" }) {
  const site = useSite()
  const panduan = panduanFrom(site.registration)
  const [open, setOpen] = useState(false)
  const chapter = panduan?.[bagian]
  if (!panduan || !chapter) return null
  const panel = tampilan === "panel"
  return (
    <div style={panel ? { marginTop: 28 } : { margin: "0 0 20px" }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={panel ? {
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: BC,
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 1.6,
          color: "#fff",
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.55)",
          padding: "0 0 6px",
          cursor: "pointer",
        } : {
          fontFamily: BC,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: 1.5,
          color: O,
          background: "transparent",
          border: `1px solid ${O}`,
          padding: "10px 16px",
          cursor: "pointer",
        }}
      >
        {panel && <PlayMark />}
        {panel ? chapter.label.toUpperCase() : `TONTON PANDUAN · ${chapter.label.toUpperCase()}`}
      </button>
      {open && <PanduanDialog title={chapter.label.toUpperCase()} id={chapter.id} onClose={() => setOpen(false)} />}
    </div>
  )
}

function PlayMark() {
  return (
    <span aria-hidden style={{ width: 28, height: 28, border: "1.5px solid #fff", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #fff", marginLeft: 2 }} />
    </span>
  )
}

export function PanduanPlayer({ panduan }: { panduan: Panduan }) {
  const [open, setOpen] = useState<null | "akun" | "peserta">(null)
  const choices = (["akun", "peserta"] as const).flatMap((id) => {
    const bab = panduan[id]
    return bab ? [{ id, label: bab.label }] : []
  })
  const pertama = choices[0]
  const dipilih = open ? panduan[open] : null
  return (
    <div style={{ marginTop: 48, background: "rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", padding: "26px 28px" }}>
      <button
        type="button"
        aria-label={`Putar ${panduan.judul}`}
        onClick={() => pertama && setOpen(pertama.id)}
        style={{ width: 72, height: 72, borderRadius: "50%", border: "1.5px solid #fff", background: "transparent", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <span aria-hidden style={{ width: 0, height: 0, borderTop: "10px solid transparent", borderBottom: "10px solid transparent", borderLeft: "16px solid #fff", marginLeft: 4 }} />
      </button>
      <div style={{ flex: "1 1 240px", minWidth: 0 }}>
        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 3, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>
          PANDUAN VIDEO
        </div>
        <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 26, letterSpacing: 1.5, color: "#fff", lineHeight: 1 }}>
          {panduan.judul}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 14 }}>
          {choices.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(item.id)}
              style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 1.2, color: "#fff", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.45)", padding: "0 0 3px", cursor: "pointer" }}
            >
              {item.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {dipilih && <PanduanDialog title={dipilih.label.toUpperCase()} id={dipilih.id} onClose={() => setOpen(null)} />}
    </div>
  )
}

export const PANDUAN_FAQ = "Bagaimana cara mendaftarkan akun dan peserta?"
