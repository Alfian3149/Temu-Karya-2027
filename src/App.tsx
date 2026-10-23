import React, { useState, useEffect } from "react"
import { SharedMinutes, SHARE_PREFIX } from "@/Secretary"
import { PublicScoreboard, SCORE_LIVE, SCORE_SNAP } from "@/Scoreboard"
import { DocsPortal, DOC_PREFIX, listExternalDocs } from "@/Documents"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"
import heroImage from "@/imports/hero-logo.png"
import image1 from "@/imports/image-1.png" 
import image2 from "@/imports/image-2.png"
import { useAuth, LoginPage, RegistrationPage, ProfilePage, isStaff, isMupel, mupelText, ROLE_LABEL, type User } from "@/Account"
import { AdminPanel } from "@/Admin"

// ── Style tokens ───────────────────────────────────────────────────────────────
const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

// ── Nav data ───────────────────────────────────────────────────────────────────
type SubItem = { label: string; tab: string }
type NavItem = { label: string; anchor: string; sub?: SubItem[] }

const NAV_ITEMS: NavItem[] = [
  { label: "HOME", anchor: "home" },
  {
    label: "ABOUT",
    anchor: "about",
    sub: [
      { label: "Background", tab: "background" },
      { label: "Theme", tab: "theme" },
      { label: "Welcome", tab: "welcome" },
    ],
  },
  {
    label: "SCHEDULE",
    anchor: "schedule",
    sub: [
      { label: "Rundown", tab: "rundown" },
      { label: "Speakers", tab: "speakers" },
      { label: "Venue", tab: "venue" },
    ],
  },
  {
    label: "INFORMATION",
    anchor: "information",
    sub: [
      { label: "Accommodation", tab: "accommodation" },
      { label: "FAQ", tab: "faq" },
      { label: "Downloads", tab: "downloads" },
    ],
  },
  { label: "REGISTRATION", anchor: "registration" },
  { label: "GALLERY", anchor: "gallery" },
  { label: "CONTACT", anchor: "contact" },
]

// ── Content data ───────────────────────────────────────────────────────────────
const SPEAKERS = [
  {
    name: "Pdt. Nitis Putrasana Harsono, M.Th",
    role: "Ketua Majelis Sinode GPIB",
    topic: "Penguatan Spiritualitas Kaum Bapak di Era Modern",
    initial: "ML",
  },
  {
    name: "Prof. Dr. Ir. Samuel Tobing",
    role: "Pakar Kepemimpinan Kristen",
    topic: "Kepemimpinan Berbasis Iman dan Integritas",
    initial: "ST",
  },
  {
    name: "Pdt. Yeremia Sitohang, M.Th",
    role: "Fasilitator Workshop",
    topic: "Pemuridan dalam Keluarga Kristen",
    initial: "YS",
  },
  {
    name: "Dr. Hendra Wattimena",
    role: "Pembicara Tamu",
    topic: "Pelayanan Diakonia Kontemporer",
    initial: "HW",
  },
]

type DaySchedule = {
  date: string
  day: string
  items: { time: string; activity: string }[]
}

const RUNDOWN: DaySchedule[] = [
  {
    date: "14 Juli 2027",
    day: "Hari 1",
    items: [
      { time: "08.00 – 12.00", activity: "Registrasi & Check-in Hotel" },
      { time: "13.00 – 15.00", activity: "Makan Siang & Orientasi Peserta" },
      { time: "16.00 – 18.00", activity: "Pembukaan Resmi TKS 2027" },
      { time: "19.00 – 21.00", activity: "Ibadah Pembukaan & Malam Perkenalan" },
    ],
  },
  {
    date: "15 Juli 2027",
    day: "Hari 2",
    items: [
      { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
      { time: "08.30 – 12.00", activity: "Sesi Pleno I: Penguatan Spiritualitas" },
      { time: "13.00 – 17.00", activity: "Sesi Pleno II: Kepemimpinan Kristen" },
      { time: "19.00 – 21.00", activity: "Malam Kebersamaan & Kreasi Seni" },
    ],
  },
  {
    date: "16 Juli 2027",
    day: "Hari 3",
    items: [
      { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
      { time: "08.30 – 12.00", activity: "Workshop: Pelayanan & Diakonia" },
      { time: "13.00 – 17.00", activity: "Workshop: Pengembangan Diri & Skill" },
      { time: "19.00 – 21.00", activity: "Perlombaan Antar Klasis" },
    ],
  },
  {
    date: "17 Juli 2027",
    day: "Hari 4",
    items: [
      { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
      { time: "08.30 – 12.00", activity: "Sidang Kerja & Rekomendasi Sinodal" },
      { time: "13.00 – 15.00", activity: "Kunjungan Wisata Rohani" },
      { time: "19.00 – 21.00", activity: "Gala Dinner & Penghargaan" },
    ],
  },
  {
    date: "18 Juli 2027",
    day: "Hari 5",
    items: [
      { time: "07.00 – 08.00", activity: "Saat Teduh & Sarapan" },
      { time: "09.00 – 11.00", activity: "Pelantikan Pengurus Baru PKB" },
      { time: "11.00 – 12.00", activity: "Ibadah Penutupan TKS 2027" },
      { time: "13.00 – 15.00", activity: "Makan Siang & Check-out" },
    ],
  },
]

const FAQ_ITEMS = [
  {
    q: "Siapa yang dapat mengikuti TKS 2027?",
    a: "TKS 2027 terbuka untuk seluruh anggota Pelkat PKB GPIB dari berbagai klasis di seluruh Indonesia. Setiap jemaat dapat mengirimkan delegasi sesuai kuota yang ditetapkan panitia.",
  },
  {
    q: "Apa saja dokumen yang perlu disiapkan untuk registrasi?",
    a: "Peserta wajib menyiapkan: Surat Rekomendasi dari Majelis Jemaat, KTP/Identitas Diri, bukti transfer biaya pendaftaran, dan pas foto terbaru 3x4. Dokumen diunggah melalui portal pendaftaran atau dikirim ke sekretariat.",
  },
  {
    q: "Berapa biaya pendaftaran TKS 2027?",
    a: "Biaya pendaftaran adalah Rp 2.000.000 per peserta, mencakup akomodasi (4 malam), konsumsi selama acara, seminar kit, dan transportasi antar venue. Biaya belum termasuk transportasi ke dan dari lokasi acara.",
  },
  {
    q: "Di mana lokasi penyelenggaraan TKS 2027?",
    a: "TKS 2027 diselenggarakan di KotaJ akarta. Venue utama adalah Hotel Millenium, dengan kegiatan lapangan di kawasan wisata sekitar kota.",
  },
  {
    q: "Apakah tersedia beasiswa atau subsidi untuk peserta?",
    a: "Panitia menyediakan subsidi terbatas bagi jemaat kecil atau yang berada di wilayah terpencil. Pengajuan subsidi dilakukan melalui surat resmi kepada panitia pusat sebelum 1 April 2027.",
  },
  {
    q: "Apa yang perlu dibawa selama acara berlangsung?",
    a: "Peserta disarankan membawa: Alkitab, buku nyanyian GPIB, pakaian resmi dan kasual, obat-obatan pribadi, dan perlengkapan ibadah. Detail lengkap tersedia di Petunjuk Teknis yang dapat diunduh pada halaman Informasi.",
  },
]

const DOWNLOADS = [
  {
    title: "Surat Edaran TKS 2027",
    type: "PDF",
    size: "1.2 MB",
    desc: "Surat resmi pemberitahuan penyelenggaraan TKS 2027",
  },
  {
    title: "Petunjuk Teknis (Juknis)",
    type: "PDF",
    size: "3.4 MB",
    desc: "Panduan lengkap teknis pelaksanaan kegiatan",
  },
  {
    title: "Proposal Kegiatan",
    type: "PDF",
    size: "5.8 MB",
    desc: "Proposal resmi TKS 2027 PKB GPIB",
  },
  {
    title: "Formulir Pendaftaran Offline",
    type: "PDF",
    size: "0.8 MB",
    desc: "Formulir cetak untuk jemaat tanpa akses internet",
  },
  {
    title: "Jadwal Lengkap Kegiatan",
    type: "PDF",
    size: "1.1 MB",
    desc: "Rundown acara lengkap selama 5 hari pelaksanaan",
  },
]

const ACCOMMODATIONS = [
  {
    name: "Hotel Grand Clarion Jakarta",
    type: "Venue Utama",
    stars: 5,
    note: "Hotel penyelenggaraan utama TKS 2027 — akomodasi termasuk dalam paket peserta.",
  },
  {
    name: "Hotel Horison Ultima Jakarta",
    type: "Akomodasi Alternatif",
    stars: 4,
    note: "10 menit dari venue utama. Tarif khusus tersedia bagi peserta TKS 2027.",
  },
  {
    name: "Whiz Prime Hotel Makassar",
    type: "Akomodasi Ekonomis",
    stars: 3,
    note: "Pilihan hemat, 15 menit dari venue. Layanan shuttle disediakan panitia.",
  },
]

const GALLERY_ITEMS = [
  { label: "Ibadah Bersama", bg: "#505050", img: image1 as string },
  { label: "Seminar", bg: "#484848", img: null },
  { label: "Workshop", bg: "#525252", img: image2 as string },
  { label: "Paduan Suara", bg: "#464646", img: null },
  { label: "Olahraga", bg: "#545454", img: null },
  { label: "Penutupan", bg: "#505050", img: null },
]

// ── Countdown hook ─────────────────────────────────────────────────────────────
const TARGET_DATE = new Date("2027-07-14T08:00:00+07:00")

function calcTimeLeft() {
  const diff = TARGET_DATE.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function useCountdown() {
  const [t, setT] = useState(calcTimeLeft)
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

// ── Shared components ──────────────────────────────────────────────────────────
function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[]
  active: string
  onChange: (t: string) => void
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        marginBottom: 48,
        borderBottom: "1px solid rgba(255,109,0,0.2)",
        flexWrap: "wrap",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            fontFamily: BC,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: 3,
            color: active === t ? O : "#666",
            background: "none",
            border: "none",
            borderBottom: active === t ? `2px solid ${O}` : "2px solid transparent",
            padding: "14px 24px",
            cursor: "pointer",
            transition: "color 0.2s",
            marginBottom: -1,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar({
  active,
  onNav,
  onSubNav,
  user,
  onLogin,
  onLogout,
  onRegister,
  onProfile,
  onGoHome,
  isHome,
}: {
  active: string
  onNav: (label: string) => void
  onSubNav: (anchor: string, tab: string) => void
  user: User | null
  onLogin: () => void
  onLogout: () => void
  onRegister: () => void
  onProfile: () => void
  onGoHome: () => void
  isHome: boolean
}) {
  const [userMenu, setUserMenu] = useState(false)
  const scrollTo = (anchor: string) => {
    if (isHome) {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" })
    } else {
      onGoHome()
      setTimeout(
        () => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" }),
        80,
      )
    }
  }
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  const handleNav = (item: NavItem) => {
    setOpenDropdown(null)
    setUserMenu(false)
    if (item.anchor === "registration" && user) {
      onRegister()
      return
    }
    onNav(item.label)
    scrollTo(item.anchor)
  }

  const handleSub = (anchor: string, tab: string) => {
    const parent = NAV_ITEMS.find((n) => n.anchor === anchor)
    if (parent) onNav(parent.label)
    onSubNav(anchor, tab)
    setOpenDropdown(null)
    setMenuOpen(false)
    scrollTo(anchor)
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(77,77,77,0.97)" : "#4D4D4D",
        borderBottom: "1px solid rgba(255,109,0,0.15)",
        transition: "background 0.3s",
        backdropFilter: scrolled ? "blur(12px)" : "none",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 24px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src={logo}
            alt="TKS2027PKBGPIB Logo"
            style={{ width: 44, height: 44, objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: 2,
              color: "#fff",
            }}
          >
            TKS<span style={{ color: O }}>2027PKBGPIB</span>
          </span>
        </div>

        {/* Desktop nav */}
        <div
          style={{ display: "flex", gap: 2, alignItems: "center" }}
          className="hidden-mobile"
        >
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{ position: "relative" }}
              onMouseEnter={() => item.sub && setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <a
                href={`#${item.anchor}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleNav(item)
                }}
                style={{
                  fontFamily: BC,
                  fontWeight: 600,
                  fontSize: 12,
                  letterSpacing: 2,
                  color: active === item.label ? O : "#ccc",
                  padding: "6px 10px",
                  borderBottom:
                    active === item.label
                      ? `2px solid ${O}`
                      : "2px solid transparent",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {item.label}
                {item.sub && (
                  <span style={{ fontSize: 9, opacity: 0.5 }}>▾</span>
                )}
              </a>

              {/* Dropdown */}
              {item.sub && openDropdown === item.label && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 1px)",
                    left: 0,
                    background: "#2e2e2e",
                    border: "1px solid rgba(255,109,0,0.2)",
                    minWidth: 180,
                    zIndex: 200,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  {item.sub.map((sub) => (
                    <button
                      key={sub.tab}
                      onClick={() => handleSub(item.anchor, sub.tab)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "12px 20px",
                        fontFamily: BC,
                        fontWeight: 600,
                        fontSize: 12,
                        letterSpacing: 2,
                        color: "#ccc",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid rgba(255,109,0,0.08)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget
                        el.style.color = O
                        el.style.background = "rgba(255,109,0,0.06)"
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget
                        el.style.color = "#ccc"
                        el.style.background = "none"
                      }}
                    >
                      {sub.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{ position: "relative", marginLeft: 10 }}>
            {user ? (
              <>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  aria-haspopup="menu"
                  aria-expanded={userMenu}
                  style={{
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 2,
                    color: "#fff",
                    background: "rgba(255,109,0,0.15)",
                    border: `1px solid ${O}`,
                    padding: "7px 14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    maxWidth: 190,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: O,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      flexShrink: 0,
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.name.split(" ")[0].toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
                </button>
                {userMenu && (
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      right: 0,
                      background: "#2e2e2e",
                      border: "1px solid rgba(255,109,0,0.2)",
                      minWidth: 220,
                      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                    }}
                  >
                    <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,109,0,0.12)" }}>
                      <div style={{ fontFamily: BB, fontSize: 14, color: "#fff" }}>{user.name}</div>
                      <div style={{ fontFamily: BB, fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.email}
                      </div>
                      {isStaff(user) ? (
                        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2, color: "#FF6D00", marginTop: 4 }}>
                          {ROLE_LABEL[user.role].toUpperCase()}
                        </div>
                      ) : isMupel(user.mupel) ? (
                        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: "#FF6D00", marginTop: 4 }}>
                          {mupelText(user.mupel).toUpperCase()}
                        </div>
                      ) : null}
                    </div>
                    {[
                      { label: isStaff(user) ? "PANEL ADMIN" : "REGISTRASI SAYA", fn: () => { setUserMenu(false); onRegister() } },
                      ...(!isStaff(user) ? [{ label: "EDIT PROFIL", fn: () => { setUserMenu(false); onProfile() } }] : []),
                      { label: "KELUAR", fn: () => { setUserMenu(false); onLogout() } },
                    ].map((m) => (
                      <button
                        key={m.label}
                        role="menuitem"
                        onClick={m.fn}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "12px 20px",
                          fontFamily: BC,
                          fontWeight: 600,
                          fontSize: 12,
                          letterSpacing: 2,
                          color: "#ccc",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid rgba(255,109,0,0.08)",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={onLogin}
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: 2.5,
                  color: "#fff",
                  background: O,
                  border: "none",
                  padding: "9px 20px",
                  cursor: "pointer",
                }}
              >
                LOGIN
              </button>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="show-mobile"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ display: "block", width: 24, height: 2, background: O }}
            />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "#2e2e2e",
            borderTop: "1px solid rgba(255,109,0,0.2)",
            padding: "8px 0",
          }}
        >
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <a
                  href={`#${item.anchor}`}
                  onClick={(e) => {
                    e.preventDefault()
                    handleNav(item)
                    if (!item.sub) setMenuOpen(false)
                  }}
                  style={{
                    flex: 1,
                    display: "block",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 17,
                    letterSpacing: 3,
                    color: active === item.label ? O : "#ccc",
                    padding: "12px 24px",
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
                {item.sub && (
                  <button
                    onClick={() =>
                      setExpandedMobile(
                        expandedMobile === item.label ? null : item.label,
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: O,
                      fontSize: 14,
                      padding: "12px 24px",
                      cursor: "pointer",
                    }}
                  >
                    {expandedMobile === item.label ? "▲" : "▼"}
                  </button>
                )}
              </div>
              {item.sub && expandedMobile === item.label && (
                <div style={{ background: "#252525", paddingLeft: 24 }}>
                  {item.sub.map((sub) => (
                    <button
                      key={sub.tab}
                      onClick={() => {
                        handleSub(item.anchor, sub.tab)
                        setMenuOpen(false)
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        fontFamily: BC,
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: 2,
                        color: "#888",
                        background: "none",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        padding: "10px 16px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      — {sub.label.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ padding: "12px 24px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8 }}>
            {user ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: BB, fontSize: 14, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.name}
                </span>
                <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {!isStaff(user) && (
                    <button
                      onClick={() => { setMenuOpen(false); onProfile() }}
                      style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 2, color: "#fff", background: O, border: "none", padding: "8px 16px", cursor: "pointer" }}
                    >
                      PROFIL
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onLogout() }}
                    style={{ fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 2, color: O, background: "none", border: `1px solid ${O}`, padding: "8px 16px", cursor: "pointer" }}
                  >
                    KELUAR
                  </button>
                </span>
              </div>
            ) : (
              <button
                onClick={() => { setMenuOpen(false); onLogin() }}
                style={{ width: "100%", fontFamily: BC, fontWeight: 800, fontSize: 15, letterSpacing: 3, color: "#fff", background: O, border: "none", padding: "13px 0", cursor: "pointer" }}
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function Hero() {
  const { days, hours, minutes, seconds } = useCountdown()

  return (
    <section
      id="home"
      style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: 68,
        overflow: "hidden",
      }}
    >
      {/* Split panel */}
      <div
        style={{ display: "flex", minHeight: "calc(100vh - 68px)" }}
        className="hero-split"
      >
        {/* LEFT */}
        <div
          style={{
            flex: "0 0 58%",
            background: `linear-gradient(to bottom, ${O} 70%, #4D4D4D 70%)`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          className="hero-left"
        >
          {/* Orange zone */}
          <div
            className="hero-orange"
            style={{
              height: "70%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 clamp(32px, 5vw, 72px)",
            }}
          >
            <h1
              className="hero-title"
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: "clamp(22px, 4vw, 68px)",
                letterSpacing: "0.08em",
                lineHeight: 1.05,
                color: "#fff",
                margin: "0 0 14px",
                textTransform: "uppercase",
              }}
            >
              TKS 2027 PKB GPIB
            </h1>
            <div
              style={{
                width: 60,
                height: 3,
                background: "#00A8FF",
                marginBottom: 16,
              }}
            />
            <p
              style={{
                fontFamily: BC,
                fontWeight: 600,
                fontSize: "clamp(12px, 1.4vw, 17px)",
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.85)",
                margin: "0 0 28px",
                lineHeight: 1.5,
              }}
            >
              TEMU KARYA SINODAL 2027
              <br />
              PELKAT PKB GPIB
            </p>
            <a
              href="#registration"
              className="hero-cta"
              style={{
                display: "inline-block",
                fontFamily: BC,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: 3,
                color: O,
                background: "#fff",
                padding: "14px 32px",
                textDecoration: "none",
                alignSelf: "flex-start",
                border: "2px solid #fff",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                const a = e.currentTarget as HTMLAnchorElement
                a.style.background = "transparent"
                a.style.color = "#fff"
              }}
              onMouseLeave={(e) => {
                const a = e.currentTarget as HTMLAnchorElement
                a.style.background = "#fff"
                a.style.color = O
              }}
            >
              DAFTAR SEKARANG
            </a>
          </div>

          {/* Grey zone: countdown */}
          <div
            className="hero-grey"
            style={{
              height: "30%",
              display: "flex",
              alignItems: "center",
              padding: "0 clamp(32px, 5vw, 72px)",
            }}
          >
            <div className="hero-cd">
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: 4,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: 12,
                }}
              >
                MENGHITUNG MUNDUR
              </div>
              <div className="hero-cd-row" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {[
                  { val: days, label: "HARI" },
                  { val: hours, label: "JAM" },
                  { val: minutes, label: "MENIT" },
                  { val: seconds, label: "DETIK" },
                ].map(({ val, label }) => (
                  <div key={label} className="hero-cd-tile" style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 800,
                        fontSize: "clamp(28px, 3.5vw, 52px)",
                        color: "#fff",
                        lineHeight: 1,
                      }}
                    >
                      {String(val).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 9,
                        letterSpacing: 2,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 4,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: logo panel — orange top mirrors left panel orange zone */}
        <div
          style={{ flex: "0 0 42%", position: "relative", overflow: "hidden" }}
          className="hero-right hidden-mobile"
        >
          <img
            src={heroImage}
            alt="TKS2027PKBGPIB emblem"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
            }}
          />
        </div>
      </div>

    </section>
  )
}

// ── About ──────────────────────────────────────────────────────────────────────
function About({
  tab,
  setTab,
}: {
  tab: string
  setTab: (t: string) => void
}) {
  return (
    <section id="about" style={{ background: "#4a4a4a", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 4,
              color: O,
              marginBottom: 16,
            }}
          >
            TENTANG TKS 2027
          </div>
          <h2
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: "clamp(36px, 5vw, 60px)",
              letterSpacing: 2,
              color: "#fff",
              margin: "0 0 40px",
              lineHeight: 1.1,
            }}
          >
            TEMU KARYA <span style={{ color: O }}>SINODAL</span>
          </h2>
        </div>

        <Tabs
          tabs={["BACKGROUND", "THEME", "WELCOME"]}
          active={tab.toUpperCase()}
          onChange={(t) => setTab(t.toLowerCase())}
        />

        {tab === "background" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "start" }}
            className="section-grid"
          >
            <div>
              <h3
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: "clamp(22px, 2.5vw, 36px)",
                  letterSpacing: 2,
                  color: "#fff",
                  margin: "0 0 20px",
                }}
              >
                LATAR BELAKANG TKS 2027
              </h3>
              <p style={{ fontFamily: BB, color: "#999", lineHeight: 1.8, marginBottom: 20 }}>
                Temu Karya Sinodal (TKS) merupakan forum pertemuan resmi Pelkat
                PKB GPIB yang diselenggarakan secara periodik untuk membahas
                hasil pelayanan, berbagi pengalaman, dan merumuskan arah
                pelayanan ke depan bagi seluruh kaum bapak di lingkungan GPIB.
              </p>
              <p style={{ fontFamily: BB, color: "#999", lineHeight: 1.8, marginBottom: 36 }}>
                TKS 2027 menjadi momentum penting untuk mempererat tali
                persaudaraan antar kaum bapak dari seluruh klasis di Indonesia,
                sekaligus memperkuat spiritualitas, keilmuan, dan keterampilan
                sebagai wujud iman, doa, rasa syukur, dan kesaksian yang
                mendalam.
              </p>
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
              >
                {[
                  { icon: "✝", title: "Iman", desc: "Memperkuat pondasi iman dalam Kristus" },
                  { icon: "🤝", title: "Persekutuan", desc: "Membangun persatuan antar klasis" },
                  { icon: "🌱", title: "Pelayanan", desc: "Mengembangkan jiwa melayani" },
                  { icon: "⚡", title: "Pembaruan", desc: "Transformasi diri dan gereja" },
                ].map((item) => (
                  <div
                    key={item.title}
                    style={{
                      background: "#555",
                      border: "1px solid rgba(255,109,0,0.15)",
                      padding: 20,
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: 1,
                        color: O,
                        marginBottom: 6,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 13, color: "#777", fontFamily: BB }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: O, padding: 4 }}>
              <div
                style={{
                  background: "#3a3a3a",
                  padding: "48px 40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 24,
                }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  style={{ width: 180, height: 180, objectFit: "contain" }}
                />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 28,
                      letterSpacing: 4,
                      color: "#fff",
                    }}
                  >
                    OFFICIAL LOGO
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 500,
                      fontSize: 13,
                      letterSpacing: 3,
                      color: O,
                      marginTop: 8,
                    }}
                  >
                    TEMU KARYA SINODAL 2027 PKB GPIB
                  </div>
                  <div
                    style={{ width: 40, height: 3, background: O, margin: "16px auto 0" }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "theme" && (
          <div>
            <div
              style={{
                background: "#3a3a3a",
                border: `1px solid rgba(255,109,0,0.3)`,
                padding: "48px 56px",
                marginBottom: 48,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 4,
                  color: "rgba(255,109,0,0.6)",
                  marginBottom: 16,
                }}
              >
                TEMA TKS 2027
              </div>
              <h3
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: "clamp(22px, 3vw, 44px)",
                  letterSpacing: 2,
                  color: "#fff",
                  margin: "0 0 16px",
                  lineHeight: 1.2,
                }}
              >
                "BERSATU DALAM IMAN,
                <br />
                <span style={{ color: O }}>BERKARYA UNTUK BANGSA"</span>
              </h3>
              <div
                style={{ width: 60, height: 3, background: O, margin: "0 auto 24px" }}
              />
              <p
                style={{
                  fontFamily: BB,
                  color: "#888",
                  maxWidth: 600,
                  margin: "0 auto",
                  lineHeight: 1.8,
                }}
              >
                Tema ini mencerminkan semangat persatuan seluruh kaum bapak GPIB
                dalam satu tekad untuk melayani Tuhan melalui karya nyata bagi
                bangsa dan masyarakat Indonesia.
              </p>
            </div>

            <div
              style={{
                fontFamily: BC,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 4,
                color: O,
                marginBottom: 24,
              }}
            >
              SUB-TEMA
            </div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
              className="card-grid"
            >
              {[
                {
                  num: "01",
                  title: "Spiritualitas",
                  sub: "Penguatan Iman dan Doa",
                  desc: "Memperdalam kehidupan rohani dan spiritualitas kaum bapak sebagai fondasi pelayanan yang kuat",
                },
                {
                  num: "02",
                  title: "Keilmuan",
                  sub: "Pengembangan Kapasitas",
                  desc: "Meningkatkan wawasan dan pengetahuan untuk mendukung pelayanan yang lebih efektif dan berdampak",
                },
                {
                  num: "03",
                  title: "Keterampilan",
                  sub: "Aksi Nyata Pelayanan",
                  desc: "Mengembangkan keterampilan praktis untuk pelayanan diakonia dan misi gereja di tengah masyarakat",
                },
              ].map((item) => (
                <div
                  key={item.num}
                  style={{
                    background: "#3a3a3a",
                    border: "1px solid rgba(255,109,0,0.15)",
                    padding: 32,
                  }}
                >
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 52,
                      color: "rgba(255,109,0,0.12)",
                      lineHeight: 1,
                      marginBottom: -8,
                    }}
                  >
                    {item.num}
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 22,
                      letterSpacing: 2,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 600,
                      fontSize: 12,
                      letterSpacing: 2,
                      color: O,
                      marginBottom: 16,
                    }}
                  >
                    {item.sub}
                  </div>
                  <div
                    style={{
                      height: 1,
                      background: "rgba(255,109,0,0.15)",
                      marginBottom: 16,
                    }}
                  />
                  <p style={{ fontFamily: BB, color: "#777", fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "welcome" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}
            className="section-grid"
          >
            {[
              {
                role: "Ketua Majelis Sinode GPIB",
                name: "Pdt. Dr. Marthen Leiwakabessy",
                initial: "ML",
                message:
                  "Temu Karya Sinodal 2027 merupakan momentum yang sangat berharga bagi seluruh keluarga besar PKB GPIB. Saya mengajak semua peserta untuk hadir dengan hati yang terbuka, semangat yang membara, dan tekad yang kuat untuk bersama-sama merumuskan langkah pelayanan yang lebih bermakna bagi gereja dan masyarakat Indonesia.",
              },
              {
                role: "Ketua Umum TKS 2027",
                name: "Once Mekel",
                initial: "DS",
                message:
                  "Dengan penuh syukur dan sukacita, kami menyambut seluruh peserta TKS 2027 dari berbagai penjuru Indonesia. Panitia telah menyiapkan seluruh rangkaian kegiatan dengan sepenuh hati agar setiap peserta dapat mengalami pertumbuhan iman, persekutuan yang hangat, dan kecakapan pelayanan yang semakin terasah.",
              },
            ].map((person) => (
              <div
                key={person.initial}
                style={{
                  background: "#3a3a3a",
                  border: "1px solid rgba(255,109,0,0.15)",
                  padding: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    marginBottom: 28,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: O,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 22,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {person.initial}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 800,
                        fontSize: 18,
                        letterSpacing: 1,
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {person.name}
                    </div>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: 3,
                        color: O,
                      }}
                    >
                      {person.role.toUpperCase()}
                    </div>
                  </div>
                </div>
                <div style={{ width: 40, height: 3, background: O, marginBottom: 20 }} />
                <p
                  style={{
                    fontFamily: BB,
                    color: "#888",
                    lineHeight: 1.85,
                    fontSize: 15,
                    margin: 0,
                    fontStyle: "italic",
                  }}
                >
                  "{person.message}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Schedule ───────────────────────────────────────────────────────────────────
function Schedule({
  tab,
  setTab,
}: {
  tab: string
  setTab: (t: string) => void
}) {
  const [activeDay, setActiveDay] = useState(0)

  return (
    <section id="schedule" style={{ background: "#3a3a3a", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 4,
              color: O,
              marginBottom: 16,
            }}
          >
            JADWAL & KEGIATAN
          </div>
          <h2
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: "clamp(36px, 5vw, 60px)",
              letterSpacing: 2,
              color: "#fff",
              margin: "0 0 40px",
              lineHeight: 1.1,
            }}
          >
            AGENDA <span style={{ color: O }}>TKS 2027</span>
          </h2>
        </div>

        <Tabs
          tabs={["RUNDOWN", "SPEAKERS", "VENUE"]}
          active={tab.toUpperCase()}
          onChange={(t) => setTab(t.toLowerCase())}
        />

        {tab === "rundown" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }}
            className="program-grid"
          >
            <div style={{ borderRight: "1px solid rgba(255,109,0,0.2)" }}>
              {RUNDOWN.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setActiveDay(i)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "16px 20px",
                    background: activeDay === i ? "rgba(255,109,0,0.1)" : "transparent",
                    border: "none",
                    borderLeft:
                      activeDay === i
                        ? `3px solid ${O}`
                        : "3px solid transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: activeDay === i ? O : "#555",
                      marginBottom: 4,
                    }}
                  >
                    {day.day.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 600,
                      fontSize: 13,
                      color: activeDay === i ? "#fff" : "#666",
                      letterSpacing: 1,
                    }}
                  >
                    {day.date}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ padding: "32px 40px" }}>
              <h3
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: 2,
                  color: "#fff",
                  margin: "0 0 28px",
                }}
              >
                {RUNDOWN[activeDay].day.toUpperCase()} — {RUNDOWN[activeDay].date}
              </h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {RUNDOWN[activeDay].items.map((item, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      gap: 0,
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{ width: 160, padding: "20px 20px 20px 0", flexShrink: 0 }}
                    >
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 700,
                          fontSize: 13,
                          letterSpacing: 1,
                          color: O,
                        }}
                      >
                        {item.time}
                      </div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        padding: "20px 0 20px 20px",
                        borderLeft: "2px solid rgba(255,109,0,0.12)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 600,
                          fontSize: 16,
                          letterSpacing: 1,
                          color: "#ddd",
                        }}
                      >
                        {item.activity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "speakers" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}
            className="section-grid"
          >
            {SPEAKERS.map((sp) => (
              <div
                key={sp.initial}
                style={{
                  background: "#4a4a4a",
                  border: "1px solid rgba(255,109,0,0.15)",
                  padding: 32,
                  display: "flex",
                  gap: 24,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${O}, #cc5500)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 24,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {sp.initial}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 18,
                      letterSpacing: 1,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {sp.name}
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 3,
                      color: O,
                      marginBottom: 16,
                    }}
                  >
                    {sp.role.toUpperCase()}
                  </div>
                  <div style={{ height: 1, background: "rgba(255,109,0,0.15)", marginBottom: 16 }} />
                  <div style={{ fontFamily: BB, fontSize: 14, color: "#888", lineHeight: 1.6 }}>
                    <span style={{ color: "#666", fontStyle: "italic" }}>Topik: </span>
                    {sp.topic}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "venue" && (
          <div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}
              className="section-grid"
            >
              <div>
                <h3
                  style={{
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 24,
                    letterSpacing: 2,
                    color: "#fff",
                    margin: "0 0 20px",
                  }}
                >
                  VENUE UTAMA
                </h3>
                <div
                  style={{
                    background: "#4a4a4a",
                    border: `1px solid rgba(255,109,0,0.3)`,
                    padding: 32,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 20,
                      letterSpacing: 1,
                      color: "#fff",
                      marginBottom: 6,
                    }}
                  >
                    Hotel Grand Clarion Makassar
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 3,
                      color: O,
                      marginBottom: 14,
                    }}
                  >
                    VENUE UTAMA TKS 2027
                  </div>
                  <p style={{ fontFamily: BB, color: "#888", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
                    Jl. A. Pettarani No. 3, Makassar, Sulawesi Selatan 90231
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Ballroom 1500 Orang", "WiFi Gratis", "Shuttle Bus", "Parkir Luas"].map(
                      (f) => (
                        <div
                          key={f}
                          style={{
                            fontFamily: BC,
                            fontWeight: 600,
                            fontSize: 10,
                            letterSpacing: 2,
                            color: "#888",
                            background: "#555",
                            padding: "6px 12px",
                          }}
                        >
                          {f}
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Tanggal", value: "14 – 18 Juli 2027" },
                    { label: "Kota", value: "Makassar, Sulsel" },
                    { label: "Kapasitas", value: "1.500 Peserta" },
                    { label: "Klasis", value: "Seluruh Indonesia" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        background: "#4a4a4a",
                        padding: 16,
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 700,
                          fontSize: 10,
                          letterSpacing: 3,
                          color: O,
                          marginBottom: 4,
                        }}
                      >
                        {item.label.toUpperCase()}
                      </div>
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 700,
                          fontSize: 15,
                          color: "#ccc",
                        }}
                      >
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3
                  style={{
                    fontFamily: BC,
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: 2,
                    color: "#fff",
                    margin: "0 0 20px",
                  }}
                >
                  RUTE & TRANSPORTASI
                </h3>
                {[
                  {
                    icon: "✈",
                    title: "Dari Bandara",
                    desc: "Bandara Sultan Hasanuddin — 45 menit dengan taksi/GoCar. Shuttle bus panitia tersedia pukul 08.00–14.00.",
                  },
                  {
                    icon: "🚢",
                    title: "Dari Pelabuhan",
                    desc: "Pelabuhan Soekarno-Hatta Makassar — 20 menit ke venue utama. Transportasi online tersedia 24 jam.",
                  },
                  {
                    icon: "🚌",
                    title: "Shuttle Panitia",
                    desc: "Shuttle gratis dari hotel rekanan ke venue utama, setiap 30 menit mulai pukul 06.30 WIT.",
                  },
                ].map((route) => (
                  <div
                    key={route.icon}
                    style={{
                      display: "flex",
                      gap: 16,
                      marginBottom: 16,
                      background: "#4a4a4a",
                      padding: 20,
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{route.icon}</div>
                    <div>
                      <div
                        style={{
                          fontFamily: BC,
                          fontWeight: 700,
                          fontSize: 16,
                          letterSpacing: 1,
                          color: "#fff",
                          marginBottom: 6,
                        }}
                      >
                        {route.title}
                      </div>
                      <div style={{ fontFamily: BB, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                        {route.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Information ────────────────────────────────────────────────────────────────
function Information({
  tab,
  setTab,
}: {
  tab: string
  setTab: (t: string) => void
}) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <section id="information" style={{ background: "#4a4a4a", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 4,
              color: O,
              marginBottom: 16,
            }}
          >
            INFORMASI PESERTA
          </div>
          <h2
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: "clamp(36px, 5vw, 60px)",
              letterSpacing: 2,
              color: "#fff",
              margin: "0 0 40px",
              lineHeight: 1.1,
            }}
          >
            PANDUAN <span style={{ color: O }}>PESERTA</span>
          </h2>
        </div>

        <Tabs
          tabs={["ACCOMMODATION", "FAQ", "DOWNLOADS"]}
          active={tab.toUpperCase()}
          onChange={(t) => setTab(t.toLowerCase())}
        />

        {tab === "accommodation" && (
          <div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}
              className="card-grid"
            >
              {ACCOMMODATIONS.map((acc) => (
                <div
                  key={acc.name}
                  style={{
                    background: "#3a3a3a",
                    border: "1px solid rgba(255,109,0,0.15)",
                    padding: 28,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 10,
                        letterSpacing: 3,
                        color: O,
                      }}
                    >
                      {acc.type.toUpperCase()}
                    </div>
                    <div style={{ color: O, fontSize: 14, letterSpacing: 2 }}>
                      {"★".repeat(acc.stars)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 17,
                      letterSpacing: 1,
                      color: "#fff",
                      marginBottom: 12,
                      lineHeight: 1.3,
                    }}
                  >
                    {acc.name}
                  </div>
                  <div
                    style={{ height: 1, background: "rgba(255,109,0,0.12)", marginBottom: 12 }}
                  />
                  <p style={{ fontFamily: BB, fontSize: 13, color: "#888", lineHeight: 1.6, margin: 0 }}>
                    {acc.note}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#3a3a3a",
                border: "1px solid rgba(255,109,0,0.2)",
                padding: "32px 40px",
              }}
            >
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: 2,
                  color: "#fff",
                  marginBottom: 20,
                }}
              >
                TRANSPORTASI LOKAL
              </div>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
                className="card-grid"
              >
                {[
                  { title: "Shuttle Resmi", desc: "Layanan shuttle antar hotel rekanan ke venue, berangkat setiap 30 menit" },
                  { title: "Transportasi Online", desc: "Gojek dan Grab tersedia 24 jam di seluruh kota Jakarta" },
                  { title: "Taksi Resmi", desc: "Taksi ber-argometer tersedia di bandara, pelabuhan, dan hotel utama" },
                ].map((t) => (
                  <div
                    key={t.title}
                    style={{ padding: 20, background: "#444", border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: 1,
                        color: O,
                        marginBottom: 8,
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontFamily: BB, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
                      {t.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "faq" && (
          <div style={{ maxWidth: 800 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{ borderBottom: "1px solid rgba(255,109,0,0.1)", overflow: "hidden" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "24px 0",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    gap: 20,
                  }}
                >
                  <span
                    style={{
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 18,
                      letterSpacing: 1,
                      color: openFaq === i ? O : "#ccc",
                      transition: "color 0.2s",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 24,
                      color: O,
                      flexShrink: 0,
                      lineHeight: 1,
                    }}
                  >
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 24 }}>
                    <p style={{ fontFamily: BB, color: "#888", lineHeight: 1.8, margin: 0, fontSize: 15 }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "downloads" && (
          <div>
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
              className="section-grid"
            >
              {(listExternalDocs().length
                ? listExternalDocs().map((d) => ({
                    title: d.judul,
                    type: (d.file.name.split(".").pop() ?? "FILE").toUpperCase().slice(0, 4),
                    size: d.file.size >= 1048576 ? `${(d.file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(d.file.size / 1024))} KB`,
                    desc: d.deskripsi || d.kategori,
                    href: d.file.data,
                    name: d.file.name,
                  }))
                : DOWNLOADS.map((d) => ({ ...d, href: "", name: "" }))
              ).map((dl) => (
                <div
                  key={dl.title}
                  role={dl.href ? "link" : undefined}
                  tabIndex={dl.href ? 0 : undefined}
                  onClick={() => {
                    if (!dl.href) return
                    const el = document.createElement("a")
                    el.href = dl.href
                    el.download = dl.name
                    el.click()
                  }}
                  onKeyDown={(e) => {
                    if (dl.href && (e.key === "Enter" || e.key === " ")) (e.currentTarget as HTMLDivElement).click()
                  }}
                  style={{
                    background: "#3a3a3a",
                    border: "1px solid rgba(255,109,0,0.15)",
                    padding: 24,
                    display: "flex",
                    gap: 20,
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = O
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,109,0,0.15)"
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 60,
                      background: O,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: 1,
                        color: "#fff",
                        textAlign: "center",
                        lineHeight: 1.4,
                      }}
                    >
                      {dl.type}
                      <br />↓
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: 1,
                        color: "#fff",
                        marginBottom: 6,
                      }}
                    >
                      {dl.title}
                    </div>
                    <div style={{ fontFamily: BB, fontSize: 13, color: "#888", marginBottom: 8 }}>
                      {dl.desc}
                    </div>
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: 2,
                        color: "#555",
                      }}
                    >
                      {dl.type} · {dl.size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: BB, fontSize: 13, color: "#555", marginTop: 24, lineHeight: 1.7 }}>
              * Berkas unduhan tersedia setelah registrasi dikonfirmasi. Hubungi sekretariat panitia
              untuk informasi lebih lanjut.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

// ── Registration ───────────────────────────────────────────────────────────────
function Registration({
  user,
  onRegister,
}: {
  user: User | null
  onRegister: () => void
}) {
  return (
    <section id="registration" style={{ background: O, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
          className="section-grid"
        >
          <div>
            <div
              style={{
                fontFamily: BC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 4,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 16,
              }}
            >
              REGISTRASI / REGISTRATION
            </div>
            <h2
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: "clamp(40px, 6vw, 72px)",
                letterSpacing: 2,
                color: "#fff",
                margin: "0 0 24px",
                lineHeight: 1.0,
              }}
            >
              DAFTAR
              <br />
              SEKARANG
            </h2>
            <p style={{ fontFamily: BB, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 32, fontSize: 16 }}>
              Jadilah bagian dari Temu Karya Sinodal 2027. Pendaftaran dibuka
              hingga 30 Juni 2027. Jangan lewatkan kesempatan bersejarah ini
              bersama ribuan kaum bapak GPIB dari seluruh Indonesia.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              {[
                { label: "Batas Daftar", value: "30 Juni 2027" },
                { label: "Kuota", value: "1.500 Peserta" },
                { label: "Biaya", value: "Rp 2.000.000" },
              ].map((item) => (
                <div key={item.label} style={{ background: "rgba(0,0,0,0.15)", padding: "16px 24px" }}>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: 3,
                      color: "rgba(255,255,255,0.6)",
                      marginBottom: 4,
                    }}
                  >
                    {item.label.toUpperCase()}
                  </div>
                  <div
                    style={{ fontFamily: BC, fontWeight: 800, fontSize: 18, color: "#fff" }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={onRegister}
              style={{
                display: "inline-block",
                border: "none",
                cursor: "pointer",
                fontFamily: BC,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: 3,
                color: O,
                background: "#fff",
                padding: "18px 44px",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fff"
              }}
            >
              {user ? "ISI FORMULIR PENDAFTARAN" : "LOGIN UNTUK MENDAFTAR"}
            </button>
          </div>

          <div>
            <div style={{ background: "rgba(0,0,0,0.15)", padding: 40 }}>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 17,
                  letterSpacing: 3,
                  color: "#fff",
                  marginBottom: 28,
                }}
              >
                LANGKAH PENDAFTARAN
              </div>
              {[
                { step: "01", title: "Buat Akun & Login", desc: "Daftar akun baru atau masuk dengan akun yang sudah ada" },
                { step: "02", title: "Isi Formulir Online", desc: "Lengkapi data peserta, unggah foto dan surat tugas" },
                { step: "03", title: "Kirim Pendaftaran", desc: "Dapatkan nomor pendaftaran dan pantau status verifikasi" },
                { step: "04", title: "Konfirmasi Pembayaran", desc: "Transfer biaya dan kirim bukti ke sekretariat" },
                { step: "05", title: "Terima ID Peserta", desc: "Panitia mengirimkan nomor ID dan informasi acara" },
              ].map((s, i) => (
                <div
                  key={s.step}
                  style={{
                    display: "flex",
                    gap: 20,
                    marginBottom: i < 4 ? 20 : 0,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 26,
                      color: "rgba(255,255,255,0.22)",
                      lineHeight: 1,
                      flexShrink: 0,
                      width: 36,
                    }}
                  >
                    {s.step}
                  </div>
                  <div
                    style={{
                      borderLeft: "2px solid rgba(255,255,255,0.2)",
                      paddingLeft: 20,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 16,
                        letterSpacing: 1,
                        color: "#fff",
                        marginBottom: 4,
                      }}
                    >
                      {s.title}
                    </div>
                    <div style={{ fontFamily: BB, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Gallery ────────────────────────────────────────────────────────────────────
function Gallery() {
  return (
    <section id="gallery" style={{ background: "#4a4a4a", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 4,
              color: O,
              marginBottom: 16,
            }}
          >
            DOKUMENTASI
          </div>
          <h2
            style={{
              fontFamily: BC,
              fontWeight: 800,
              fontSize: "clamp(36px, 5vw, 60px)",
              letterSpacing: 2,
              color: "#fff",
              margin: 0,
            }}
          >
            GALERI <span style={{ color: O }}>KEGIATAN</span>
          </h2>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}
          className="gallery-grid"
        >
          {GALLERY_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "4/3",
                background: item.bg,
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid rgba(255,109,0,0.1)",
              }}
              onMouseEnter={(e) => {
                const ov = e.currentTarget.querySelector(
                  ".gallery-overlay",
                ) as HTMLElement
                if (ov) ov.style.opacity = "1"
              }}
              onMouseLeave={(e) => {
                const ov = e.currentTarget.querySelector(
                  ".gallery-overlay",
                ) as HTMLElement
                if (ov) ov.style.opacity = "0"
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {item.img ? (
                  <img
                    src={item.img}
                    alt={item.label}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <img
                    src={logo}
                    alt="TKS2027PKBGPIB"
                    style={{ width: 80, height: 80, objectFit: "contain" }}
                  />
                )}
              </div>
              <div
                className="gallery-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,109,0,0.88)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
              >
                <span
                  style={{
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: 3,
                    color: "#fff",
                  }}
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontFamily: BB,
            fontSize: 13,
            color: "#555",
            textAlign: "center",
            marginTop: 32,
          }}
        >
          Foto & video dokumentasi pra-acara akan diperbarui secara berkala. Kilas balik TKS
          sebelumnya tersedia di media sosial resmi panitia.
        </p>
      </div>
    </section>
  )
}

// ── Contact ────────────────────────────────────────────────────────────────────
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section id="contact" style={{ background: "#3a3a3a", padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}
          className="section-grid"
        >
          {/* Left: info */}
          <div>
            <div
              style={{
                fontFamily: BC,
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 4,
                color: O,
                marginBottom: 16,
              }}
            >
              HUBUNGI KAMI
            </div>
            <h2
              style={{
                fontFamily: BC,
                fontWeight: 800,
                fontSize: "clamp(36px, 5vw, 60px)",
                letterSpacing: 2,
                color: "#fff",
                margin: "0 0 24px",
                lineHeight: 1.1,
              }}
            >
              ADA <span style={{ color: O }}>PERTANYAAN?</span>
            </h2>
            <p style={{ fontFamily: BB, color: "#888", lineHeight: 1.8, marginBottom: 32 }}>
              Kami siap menjawab setiap pertanyaan Anda tentang Temu Karya
              Sinodal 2027. Jangan ragu menghubungi kami melalui saluran
              resmi berikut.
            </p>

            {[
              { label: "Email", value: "tkspkbgpib2027@gmail.com" },
              { label: "WhatsApp Sekretariat", value: "+62 812-0000-2027" },
              { label: "WhatsApp Ketua Panitia", value: "+62 811-0000-2027" },
              { label: "Instagram", value: "@tkspkbgpib2027" },
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 14,
                  padding: "16px 20px",
                  background: "#555",
                  border: "1px solid rgba(255,109,0,0.1)",
                }}
              >
                <div
                  style={{ width: 4, height: 40, background: O, flexShrink: 0 }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: 3,
                      color: O,
                      marginBottom: 4,
                    }}
                  >
                    {c.label.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: BB, color: "#ccc", fontSize: 15 }}>
                    {c.value}
                  </div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: 4,
                  color: "#555",
                  marginBottom: 14,
                }}
              >
                MEDIA SOSIAL RESMI
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["Instagram", "Facebook", "YouTube"].map((s) => (
                  <a
                    key={s}
                    href="#contact"
                    style={{
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 11,
                      letterSpacing: 2,
                      color: "#777",
                      padding: "10px 16px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      textDecoration: "none",
                      transition: "color 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const a = e.currentTarget as HTMLAnchorElement
                      a.style.color = O
                      a.style.borderColor = O
                    }}
                    onMouseLeave={(e) => {
                      const a = e.currentTarget as HTMLAnchorElement
                      a.style.color = "#777"
                      a.style.borderColor = "rgba(255,255,255,0.1)"
                    }}
                  >
                    {s.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {sent ? (
              <div
                style={{
                  background: "rgba(255,109,0,0.1)",
                  border: `1px solid ${O}`,
                  padding: "48px 40px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <div
                  style={{
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 24,
                    letterSpacing: 2,
                    color: O,
                    marginBottom: 12,
                  }}
                >
                  PESAN TERKIRIM!
                </div>
                <p style={{ color: "#888", fontFamily: BB }}>
                  Terima kasih. Kami akan segera membalas pesan Anda.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {(["name", "email"] as const).map((field) => (
                  <div key={field}>
                    <label
                      style={{
                        display: "block",
                        fontFamily: BC,
                        fontWeight: 700,
                        fontSize: 12,
                        letterSpacing: 3,
                        color: O,
                        marginBottom: 8,
                      }}
                    >
                      {field === "name" ? "NAMA LENGKAP" : "EMAIL"}
                    </label>
                    <input
                      type={field === "email" ? "email" : "text"}
                      required
                      value={form[field]}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      style={{
                        width: "100%",
                        background: "#555",
                        border: "1px solid rgba(255,109,0,0.2)",
                        color: "#fff",
                        fontFamily: BB,
                        fontSize: 15,
                        padding: "14px 16px",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = O
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,109,0,0.2)"
                      }}
                      placeholder={field === "name" ? "Nama Anda" : "email@anda.com"}
                    />
                  </div>
                ))}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 12,
                      letterSpacing: 3,
                      color: O,
                      marginBottom: 8,
                    }}
                  >
                    PESAN
                  </label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    style={{
                      width: "100%",
                      background: "#555",
                      border: "1px solid rgba(255,109,0,0.2)",
                      color: "#fff",
                      fontFamily: BB,
                      fontSize: 15,
                      padding: "14px 16px",
                      outline: "none",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = O
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,109,0,0.2)"
                    }}
                    placeholder="Tulis pesan Anda di sini..."
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: O,
                    color: "#fff",
                    fontFamily: BC,
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: 3,
                    padding: "16px 32px",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                    alignSelf: "flex-start",
                  }}
                  onMouseEnter={(e) => {
                    ;(e.target as HTMLButtonElement).style.background = "#e55c00"
                  }}
                  onMouseLeave={(e) => {
                    ;(e.target as HTMLButtonElement).style.background = O
                  }}
                >
                  KIRIM PESAN
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: "#2e2e2e",
        borderTop: "1px solid rgba(255,109,0,0.15)",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "start",
            gap: 40,
            marginBottom: 32,
          }}
          className="footer-grid"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src={logo}
              alt="Logo"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <div>
              <div
                style={{
                  fontFamily: BC,
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: 2,
                  color: "#fff",
                }}
              >
                TKS<span style={{ color: O }}>2027PKBGPIB</span>
              </div>
              <div
                style={{ fontFamily: BC, fontSize: 10, letterSpacing: 2, color: "#444" }}
              >
                TEMU KARYA SINODAL 2027
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={`#${item.anchor}`}
                style={{
                  fontFamily: BC,
                  fontWeight: 600,
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "#555",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  ;(e.target as HTMLAnchorElement).style.color = O
                }}
                onMouseLeave={(e) => {
                  ;(e.target as HTMLAnchorElement).style.color = "#555"
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div style={{ textAlign: "right", fontFamily: BB, fontSize: 12, color: "#444" }}>
            © 2027 Pelkat PKB GPIB.
            <br />
            All rights reserved.
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 20,
            textAlign: "center",
            fontFamily: BB,
            fontSize: 12,
            color: "#333",
          }}
        >
          DKI Jakarta· 14 – 18 Juli 2027
        </div>
      </div>
    </footer>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const route = () => (location.hash.startsWith(SHARE_PREFIX) ? "minutes" : location.hash.startsWith(DOC_PREFIX) ? "docs" : location.hash === SCORE_LIVE || location.hash.startsWith(SCORE_SNAP) ? "score" : "")
  const [shared, setShared] = useState(route)
  useEffect(() => {
    const f = () => setShared(route())
    window.addEventListener("hashchange", f)
    return () => window.removeEventListener("hashchange", f)
  }, [])
  return shared === "minutes" ? <SharedMinutes /> : shared === "docs" ? <DocsPortal /> : shared === "score" ? <PublicScoreboard key={location.hash.slice(0, 40)} /> : <MainApp />
}

function MainApp() {
  const [activeNav, setActiveNav] = useState("HOME")
  const [aboutTab, setAboutTab] = useState("background")
  const [scheduleTab, setScheduleTab] = useState("rundown")
  const [infoTab, setInfoTab] = useState("accommodation")
  const auth = useAuth()
  const { user } = auth
  const [view, setView] = useState<"home" | "login" | "registration" | "admin" | "profile">("home")
  const [profileNotice, setProfileNotice] = useState("")
  const [afterLogin, setAfterLogin] = useState<"home" | "registration">("home")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (view !== "home") window.scrollTo({ top: 0 })
  }, [view])

  useEffect(() => {
    if (!user && (view === "registration" || view === "admin" || view === "profile")) setView("login")
    else if (user && isStaff(user) && (view === "registration" || view === "profile")) setView("admin")
    else if (user && !isStaff(user) && view === "admin") setView("registration")
  }, [user, view])

  useEffect(() => {
    if (user && view === "login") setView(isStaff(user) ? "admin" : afterLogin)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const openLogin = () => {
    setAfterLogin("home")
    setNotice("")
    setView("login")
  }
  const openProfile = (message = "") => {
    setProfileNotice(message)
    setView("profile")
  }
  const openRegistration = () => {
    if (user) {
      setView(isStaff(user) ? "admin" : "registration")
    } else {
      setAfterLogin("registration")
      setNotice("Silakan masuk atau buat akun terlebih dahulu untuk mengisi formulir pendaftaran.")
      setView("login")
    }
  }

  const handleSubNav = (anchor: string, tab: string) => {
    if (anchor === "about") setAboutTab(tab)
    if (anchor === "schedule") setScheduleTab(tab)
    if (anchor === "information") setInfoTab(tab)
  }

  useEffect(() => {
    if (view !== "home") return
    const anchors = NAV_ITEMS.map((n) => n.anchor)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const item = NAV_ITEMS.find((n) => n.anchor === entry.target.id)
            if (item) setActiveNav(item.label)
          }
        })
      },
      { threshold: 0.3 },
    )
    anchors.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [view])

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
          .hero-split { flex-direction: column !important; }
          .hero-split { min-height: 0 !important; }
          .hero-left { flex: none !important; width: 100% !important; background: ${O} !important; }
          .hero-orange { height: auto !important; justify-content: flex-start !important; align-items: center; text-align: center; padding: 64px 24px 44px !important; }
          .hero-title { font-size: clamp(38px, 11vw, 56px) !important; letter-spacing: 0.06em !important; margin-bottom: 18px !important; }
          .hero-orange > div:nth-of-type(1) { margin: 0 auto 20px !important; width: 56px !important; }
          .hero-orange p { font-size: 15px !important; margin-bottom: 32px !important; }
          .hero-cta { align-self: stretch !important; text-align: center; padding: 16px 24px !important; }
          .hero-grey { height: auto !important; background: #4D4D4D; padding: 32px 20px 40px !important; justify-content: center; }
          .hero-cd { width: 100%; max-width: 420px; margin: 0 auto; }
          .hero-cd > div:first-child { text-align: center; font-size: 11px !important; margin-bottom: 16px !important; }
          .hero-cd-row { display: grid !important; grid-template-columns: repeat(4, 1fr); gap: 8px !important; }
          .hero-cd-tile { background: rgba(255,255,255,0.07); border-top: 3px solid ${O}; padding: 14px 4px 10px; }
          .hero-cd-tile > div:first-child { font-size: 34px !important; }
          .hero-cd-tile > div:last-child { font-size: 10px !important; margin-top: 6px !important; }
          .section-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .program-grid { grid-template-columns: 1fr !important; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .card-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
          .footer-grid > div:last-child { text-align: left !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
      <Navbar
        active={view === "registration" || view === "admin" ? "REGISTRATION" : view === "home" ? activeNav : ""}
        onNav={setActiveNav}
        onSubNav={handleSubNav}
        user={user}
        onLogin={openLogin}
        onLogout={() => {
          auth.logout()
          setView("home")
        }}
        onRegister={openRegistration}
        onProfile={() => openProfile(user && isMupel(user.mupel) ? "" : "Isi asal mupel. Setiap peserta kontingen memakai mupel ini.")}
        onGoHome={() => setView("home")}
        isHome={view === "home"}
      />
      {view === "login" && (
        <LoginPage
          auth={auth}
          notice={notice}
          onSuccess={() => {}}
        />
      )}
      {view === "registration" && user && !isStaff(user) && (
        <RegistrationPage
          user={user}
          onEditProfile={() => openProfile(isMupel(user.mupel) ? "" : "Isi asal mupel sebelum menambah peserta. Setiap peserta kontingen memakai mupel ini.")}
        />
      )}
      {view === "profile" && user && !isStaff(user) && (
        <ProfilePage
          user={user}
          notice={profileNotice}
          onSave={auth.updateProfile}
          onBack={() => setView("registration")}
        />
      )}
      {view === "admin" && user && isStaff(user) && <AdminPanel user={user} />}
      {view === "home" && (
        <>
          <Hero />
          <About tab={aboutTab} setTab={setAboutTab} />
          <Schedule tab={scheduleTab} setTab={setScheduleTab} />
          <Information tab={infoTab} setTab={setInfoTab} />
          <Registration user={user} onRegister={openRegistration} />
          <Gallery />
          <Contact />
        </>
      )}
      <Footer />
    </>
  )
}
