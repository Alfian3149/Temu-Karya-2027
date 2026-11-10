import React, { useState, useEffect, useMemo, useRef } from "react"
import { SharedMinutes, SHARE_PREFIX } from "@/Secretary"
import { PublicScoreboard, SCORE_LIVE, SCORE_SNAP } from "@/Scoreboard"
import { DocsPortal, DOC_PREFIX, listExternalDocs } from "@/Documents"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"
import heroImage from "@/imports/hero-logo.png"
import image1 from "@/imports/image-1.png" 
import image2 from "@/imports/image-2.png"
import { useAuth, LoginPage, RegistrationPage, ProfilePage, isStaff, isMupel, mupelText, ROLE_LABEL, type User } from "@/Account"
import { AdminPanel } from "@/Admin"
import { PublicPeserta, KARTU_PREFIX } from "@/PesertaPublic"
import { SiteProvider, useSite, type NavItem } from "@/siteContent"
import { DEFAULT_RUNDOWN, httpUrl, youtubeId } from "@/siteDefaults"

// ── Style tokens ───────────────────────────────────────────────────────────────
const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"
const GALLERY_SHOTS: (string | null)[] = [image1 as string, null, image2 as string, null, null, null]

// ── Countdown hook ─────────────────────────────────────────────────────────────
function calcTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function useCountdown(target: Date) {
  const [t, setT] = useState(() => calcTimeLeft(target))
  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(target)), 1000)
    return () => clearInterval(id)
  }, [target])
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
  const site = useSite()
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
    const parent = site.nav.find((n) => n.anchor === anchor)
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
          {site.nav.map((item) => (
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
          {site.nav.map((item) => (
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

function TeaserModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
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
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Hero ───────────────────────────────────────────────────────────────────────
function Hero() {
  const site = useSite()
  const hero = site.hero
  const [teaserOpen, setTeaserOpen] = useState(false)
  const closeTeaser = useMemo(() => () => setTeaserOpen(false), [])
  const target = useMemo(() => {
    const date = new Date(hero?.mulai || "2027-07-14T08:00:00+07:00")
    return Number.isNaN(date.getTime()) ? new Date("2027-07-14T08:00:00+07:00") : date
  }, [hero?.mulai])
  const { days, hours, minutes, seconds } = useCountdown(target)
  if (!site.show("home") || !hero) return null
  const teaserId = hero.videoAktif ? youtubeId(hero.youtube) : ""
  const teaserLabel = hero.tombolVideo.trim() || "TONTON TEASER"

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
              {hero.judul}
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
              {hero.baris1}
              <br />
              {hero.baris2}
            </p>
            {(site.show("registration") || teaserId) && (
              <div className="hero-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignSelf: "flex-start" }}>
                {site.show("registration") && <a
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
                  {hero.tombol}
                </a>}
                {teaserId && (
                  <button
                    type="button"
                    className="hero-cta hero-teaser"
                    onClick={() => setTeaserOpen(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      fontFamily: BC,
                      fontWeight: 800,
                      fontSize: 14,
                      letterSpacing: 3,
                      color: "#fff",
                      background: "transparent",
                      padding: "14px 32px",
                      border: "2px solid #fff",
                      cursor: "pointer",
                      transition: "background 0.2s, color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#fff"
                      e.currentTarget.style.color = O
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = "#fff"
                    }}
                  >
                    <span aria-hidden style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "10px solid currentColor", flex: "none" }} />
                    {teaserLabel}
                  </button>
                )}
              </div>
            )}
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
                {hero.hitung}
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
      {teaserOpen && teaserId && <TeaserModal videoId={teaserId} title={teaserLabel} onClose={closeTeaser} />}
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
  const site = useSite()
  const subs = site.children("about")
  const head = site.aboutHead
  const background = site.background
  const theme = site.theme
  const welcome = site.welcome
  useEffect(() => {
    if (subs.length && !subs.some((item) => item.tab === tab)) setTab(subs[0].tab)
  }, [subs, tab, setTab])
  if (!site.show("about")) return null
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
            {head.kicker}
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
            {head.judul} <span style={{ color: O }}>{head.judulAksen}</span>
          </h2>
        </div>

        <Tabs
          tabs={subs.map((item) => item.label.toUpperCase())}
          active={(subs.find((item) => item.tab === tab)?.label ?? tab).toUpperCase()}
          onChange={(label) => {
            const found = subs.find((item) => item.label.toUpperCase() === label)
            if (found) setTab(found.tab)
          }}
        />

        {tab === "background" && background && (
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
                {background.heading}
              </h3>
              {background.paragraf.map((paragraph) => (
                <p key={paragraph} style={{ fontFamily: BB, color: "#999", lineHeight: 1.8, marginBottom: 20 }}>{paragraph}</p>
              ))}
              <div
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
              >
                {background.pilar.map((item) => (
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

        {tab === "theme" && theme && (
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
                {theme.kicker}
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
                "{theme.baris1}
                <br />
                <span style={{ color: O }}>{theme.baris2}"</span>
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
                {theme.deskripsi}
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
              {theme.subtema.map((item) => (
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

        {tab === "welcome" && welcome && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}
            className="section-grid"
          >
            {welcome.orang.map((person) => (
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
  const site = useSite()
  const subs = site.children("schedule")
  const head = site.scheduleHead
  const rundown = site.rundown
  const speakers = site.speakers
  const venue = site.venue
  const [activeDay, setActiveDay] = useState(0)
  const hari = rundown?.hari ?? []
  const day = hari[Math.min(activeDay, Math.max(hari.length - 1, 0))]
  useEffect(() => {
    if (subs.length && !subs.some((item) => item.tab === tab)) setTab(subs[0].tab)
  }, [subs, tab, setTab])
  if (!site.show("schedule")) return null

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
            {head.kicker}
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
            {head.judul} <span style={{ color: O }}>{head.judulAksen}</span>
          </h2>
        </div>

        <Tabs
          tabs={subs.map((item) => item.label.toUpperCase())}
          active={(subs.find((item) => item.tab === tab)?.label ?? tab).toUpperCase()}
          onChange={(label) => {
            const found = subs.find((item) => item.label.toUpperCase() === label)
            if (found) setTab(found.tab)
          }}
        />

        {tab === "rundown" && rundown && (
          <div
            style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }}
            className="program-grid"
          >
            <div style={{ borderRight: "1px solid rgba(255,109,0,0.2)" }}>
              {hari.map((item, i) => (
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
                    {item.day.toUpperCase()}
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
                    {item.date}
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
                {day ? `${day.day.toUpperCase()} — ${day.date}` : "Belum ada kegiatan."}
              </h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {(day?.items ?? []).map((item, j) => (
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

        {tab === "speakers" && speakers && (
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24 }}
            className="section-grid"
          >
            {speakers.pembicara.map((sp) => (
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

        {tab === "venue" && venue && (
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
                  {venue.judulVenue}
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
                    {venue.nama}
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
                    {venue.peran}
                  </div>
                  <p style={{ fontFamily: BB, color: "#888", fontSize: 14, lineHeight: 1.7, margin: "0 0 16px" }}>
                    {venue.alamat}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {venue.fasilitas.map(
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
                  {venue.fakta.map((item) => (
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
                  {venue.judulRute}
                </h3>
                {venue.rute.map((route) => (
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
  const site = useSite()
  const subs = site.children("information")
  const head = site.infoHead
  const stay = site.accommodation
  const faq = site.faq
  const downloads = site.downloads
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  useEffect(() => {
    if (subs.length && !subs.some((item) => item.tab === tab)) setTab(subs[0].tab)
  }, [subs, tab, setTab])
  if (!site.show("information")) return null

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
            {head.kicker}
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
            {head.judul} <span style={{ color: O }}>{head.judulAksen}</span>
          </h2>
        </div>

        <Tabs
          tabs={subs.map((item) => item.label.toUpperCase())}
          active={(subs.find((item) => item.tab === tab)?.label ?? tab).toUpperCase()}
          onChange={(label) => {
            const found = subs.find((item) => item.label.toUpperCase() === label)
            if (found) setTab(found.tab)
          }}
        />

        {tab === "accommodation" && stay && (
          <div>
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}
              className="card-grid"
            >
              {stay.hotel.map((acc) => (
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
                {stay.transportJudul}
              </div>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}
                className="card-grid"
              >
                {stay.transport.map((t) => (
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

        {tab === "faq" && faq && (
          <div style={{ maxWidth: 800 }}>
            {faq.items.map((item, i) => (
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

        {tab === "downloads" && downloads && (
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
                : downloads.berkas.map((d) => ({ ...d, href: "", name: "" }))
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
              {downloads.catatan}
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
  const site = useSite()
  const copy = site.registration
  if (!site.show("registration") || !copy) return null
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
              {copy.kicker}
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
              {copy.judulBaris1}
              <br />
              {copy.judulBaris2}
            </h2>
            <p style={{ fontFamily: BB, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, marginBottom: 32, fontSize: 16 }}>
              {copy.paragraf}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              {copy.statistik.map((item) => (
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
                {copy.langkahJudul}
              </div>
              {copy.langkah.map((s, i) => (
                <div
                  key={s.step}
                  style={{
                    display: "flex",
                    gap: 20,
                    marginBottom: i < copy.langkah.length - 1 ? 20 : 0,
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
  const site = useSite()
  const copy = site.gallery
  if (!site.show("gallery") || !copy) return null
  const shots = copy.item.map((item, index) => ({ ...item, img: GALLERY_SHOTS[index] ?? null }))
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
            {copy.kicker}
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
            {copy.judul} <span style={{ color: O }}>{copy.judulAksen}</span>
          </h2>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}
          className="gallery-grid"
        >
          {shots.map((item, i) => (
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
            color: "#fff",
            textAlign: "center",
            marginTop: 32,
          }}
        >
          {copy.catatan}
        </p>
      </div>
    </section>
  )
}

// ── Contact ────────────────────────────────────────────────────────────────────
function officialSocial(items: { nama: string; link: string }[]) {
  return items.flatMap((item) => {
    const href = httpUrl(item.link)
    const nama = item.nama.trim()
    return href && nama ? [{ nama, href }] : []
  })
}

function Contact() {
  const site = useSite()
  const copy = site.contact
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [sent, setSent] = useState(false)
  if (!site.show("contact") || !copy) return null
  const sosial = officialSocial(copy.sosial)

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
              {copy.kicker}
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
              {copy.judul} <span style={{ color: O }}>{copy.judulAksen}</span>
            </h2>
            <p style={{ fontFamily: BB, color: "#888", lineHeight: 1.8, marginBottom: 32 }}>
              {copy.paragraf}
            </p>

            {copy.saluran.map((c) => (
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

            {sosial.length > 0 && (
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
                {copy.sosialJudul}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {sosial.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
                    {item.nama.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
            )}
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
  const site = useSite()
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
            {site.nav.map((item) => (
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
            {site.footer.hakCipta}
            <br />
            {site.footer.tambahan}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 20,
            textAlign: "center",
            fontFamily: BB,
            fontSize: 12,
            color: "#fff",
          }}
        >
          {site.footer.lokasi}
        </div>
      </div>
    </footer>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SiteProvider>
      <AppRoutes />
    </SiteProvider>
  )
}

function AppRoutes() {
  const site = useSite()
  const route = () => (location.hash.startsWith(SHARE_PREFIX) ? "minutes" : location.hash.startsWith(DOC_PREFIX) ? "docs" : location.hash === SCORE_LIVE || location.hash.startsWith(SCORE_SNAP) ? "score" : location.hash.startsWith(KARTU_PREFIX) ? "kartu" : "")
  const [shared, setShared] = useState(route)
  useEffect(() => {
    const f = () => setShared(route())
    window.addEventListener("hashchange", f)
    return () => window.removeEventListener("hashchange", f)
  }, [])
  const agenda = (site.rundown ?? DEFAULT_RUNDOWN).hari
  return shared === "minutes" ? <SharedMinutes /> : shared === "docs" ? <DocsPortal /> : shared === "score" ? <PublicScoreboard key={location.hash.slice(0, 40)} /> : shared === "kartu" ? <PublicPeserta agenda={agenda} /> : <MainApp />
}

function MainApp() {
  const site = useSite()
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
    if (view === "home") site.reload()
  }, [view, site.reload])

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
    const anchors = site.nav.map((n) => n.anchor)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const item = site.nav.find((n) => n.anchor === entry.target.id)
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
  }, [view, site.nav])

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
          .hero-actions { flex-direction: column !important; align-self: stretch !important; width: 100%; }
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
