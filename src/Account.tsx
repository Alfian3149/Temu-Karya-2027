import { MedicalTab, TravelTab } from "@/Logistics"
import React, { useState, useEffect, useRef } from "react"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"

const BC = "'Barlow Condensed', sans-serif"
const BB = "'Barlow', sans-serif"
const O = "#FF6D00"

// ── Storage + auth ─────────────────────────────────────────────────────────────
export type Role = "user" | "superuser" | "reg_admin" | "race_admin" | "accom_admin" | "bendahara" | "sekretaris" | "panitia_inti"
export type User = { id: string; name: string; email: string; role: Role }
export const ROLE_LABEL: Record<Role, string> = {
  user: "Ketua Kontingen",
  superuser: "Superuser",
  reg_admin: "Admin Registrasi",
  race_admin: "Admin Lomba",
  accom_admin: "Admin Akomodasi",
  bendahara: "Bendahara",
  sekretaris: "Sekretaris",
  panitia_inti: "Panitia Inti",
}
export const isStaff = (u?: User | null) => !!u && u.role !== "user"
export type StoredUser = User & { salt: string; hash: string }

export const USERS_KEY = "tks27_users"
const SESSION_KEY = "tks27_session"
export const REG_KEY = "tks27_registrations"

export function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

export function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

async function hashPassword(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const buf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export const randomId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

const toUser = (u: StoredUser): User => ({ id: u.id, name: u.name, email: u.email, role: u.role ?? "user" })

function loadSession(): User | null {
  const email =
    localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY)
  if (!email) return null
  const u = read<StoredUser[]>(USERS_KEY, []).find((x) => x.email === email)
  return u ? toUser(u) : null
}

export const SEED_ADMIN = { email: "admin@tks2027.id", password: "Admin2027!" }

async function seedSuperuser() {
  const users = read<StoredUser[]>(USERS_KEY, [])
  if (users.some((u) => u.role === "superuser")) return
  const salt = randomId()
  write(USERS_KEY, [
    ...users.filter((u) => u.email !== SEED_ADMIN.email),
    {
      id: randomId(),
      name: "Superuser",
      email: SEED_ADMIN.email,
      role: "superuser",
      salt,
      hash: await hashPassword(SEED_ADMIN.password, salt),
    } as StoredUser,
  ])
}
seedSuperuser()

export const listUsers = () => read<StoredUser[]>(USERS_KEY, [])

export async function createAccount(name: string, email: string, password: string, role: Role) {
  const users = listUsers()
  const mail = email.trim().toLowerCase()
  if (users.some((u) => u.email === mail)) throw new Error("Email sudah terdaftar.")
  const salt = randomId()
  write(USERS_KEY, [
    ...users,
    { id: randomId(), name: name.trim(), email: mail, role, salt, hash: await hashPassword(password, salt) },
  ])
}

function guardLastSuperuser(users: StoredUser[], id: string) {
  const target = users.find((u) => u.id === id)
  if (target?.role === "superuser" && users.filter((u) => u.role === "superuser").length <= 1)
    throw new Error("Tidak dapat mengubah atau menghapus Superuser terakhir.")
}

export function setUserRole(id: string, role: Role) {
  const users = listUsers()
  if (role !== "superuser") guardLastSuperuser(users, id)
  write(USERS_KEY, users.map((u) => (u.id === id ? { ...u, role } : u)))
}

export function deleteUser(id: string) {
  const users = listUsers()
  guardLastSuperuser(users, id)
  const target = users.find((u) => u.id === id)
  if (target && read<Registration[]>(REG_KEY, []).some((r) => r.email === target.email))
    throw new Error("Akun ini memiliki data peserta dan tidak dapat dihapus.")
  write(USERS_KEY, users.filter((u) => u.id !== id))
}

export async function setUserPassword(id: string, password: string) {
  const users = listUsers()
  const salt = randomId()
  const hash = await hashPassword(password, salt)
  write(USERS_KEY, users.map((u) => (u.id === id ? { ...u, salt, hash } : u)))
}

export type Auth = ReturnType<typeof useAuth>

export function useAuth() {
  const [user, setUser] = useState<User | null>(loadSession)

  const startSession = (u: StoredUser, remember: boolean) => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    ;(remember ? localStorage : sessionStorage).setItem(SESSION_KEY, u.email)
    setUser(toUser(u))
  }

  const signup = async (name: string, email: string, password: string) => {
    const users = read<StoredUser[]>(USERS_KEY, [])
    const mail = email.trim().toLowerCase()
    if (users.some((u) => u.email === mail))
      throw new Error("Email sudah terdaftar. Silakan masuk.")
    const salt = randomId()
    const created: StoredUser = {
      id: randomId(),
      name: name.trim(),
      email: mail,
      role: "user",
      salt,
      hash: await hashPassword(password, salt),
    }
    write(USERS_KEY, [...users, created])
    startSession(created, true)
  }

  const login = async (email: string, password: string, remember: boolean) => {
    const mail = email.trim().toLowerCase()
    const found = read<StoredUser[]>(USERS_KEY, []).find((u) => u.email === mail)
    const ok = found && (await hashPassword(password, found.salt)) === found.hash
    if (!found || !ok) throw new Error("Email atau kata sandi salah.")
    startSession(found, remember)
  }

  const resetPassword = async (email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    const users = read<StoredUser[]>(USERS_KEY, [])
    const idx = users.findIndex((u) => u.email === mail)
    if (idx < 0) throw new Error("Email tidak ditemukan.")
    const salt = randomId()
    users[idx] = { ...users[idx], salt, hash: await hashPassword(password, salt) }
    write(USERS_KEY, users)
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return { user, signup, login, logout, resetPassword }
}

// ── Registration data ──────────────────────────────────────────────────────────
export const JENIS = ["Peserta", "Undangan", "Pendamping", "KMJ"] as const
const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"] as const
export const LOMBA = [
  "Paduan Suara",
  "Cerdas Cermat Alkitab",
  "Tenis Meja",
  "Bulu Tangkis",
  "Catur",
  "Pelatihan Kekaryaan",
  "Seminar",
] as const
export const FEE = 2_000_000
export const rupiah = (n: number) => `Rp ${n.toLocaleString("id-ID")}`
const GENDERS = ["Laki-laki", "Perempuan"] as const

export type FileInfo = { name: string; type: string; size: number; data: string }
export type Medical = {
  golongan: string
  alergi: string
  penyakit: string[]
  penyakitLain: string
  obat: string
  riwayatRawat: string
  kondisiKhusus: string
  kontakNama: string
  kontakHubungan: string
  kontakTelp: string
  updatedAt: string
}
export type TravelGroup = {
  id: string
  owner: string
  createdAt: string
  nama: string
  regIds: string[]
  lokasiDatang: string
  tglDatang: string
  lokasiBerangkat: string
  tglBerangkat: string
  jamBerangkat: string
}
export const TRAVEL_KEY = "tks27_travel"

export type Registration = {
  id: string
  regNo: string
  email: string
  nama: string
  jenis: string
  tempat: string
  tanggal: string
  gender: string
  gereja: string
  mupel: string
  foto: string
  wa: string
  ukuran: string
  lomba: string[]
  lombaStatus?: Record<string, { status: string; note?: string }>
  medical?: Medical
  akomodasi?: { roomId?: string; transportId?: string; status: string; note?: string }
  adminNote?: string
  status: string
  createdAt: string
}

export const listRegs = (email: string) =>
  read<Registration[]>(REG_KEY, [])
    .filter((r) => r.email === email)
    .map((r) => ({ ...r, id: r.id ?? r.regNo }))

function saveReg(reg: Registration) {
  const all = read<Registration[]>(REG_KEY, []).filter(
    (r) => (r.id ?? r.regNo) !== reg.id,
  )
  write(REG_KEY, [...all, reg])
}

export function deleteReg(id: string) {
  write(
    TRAVEL_KEY,
    read<TravelGroup[]>(TRAVEL_KEY, []).map((g) => ({ ...g, regIds: g.regIds.filter((x) => x !== id) })),
  )
  write(
    REG_KEY,
    read<Registration[]>(REG_KEY, []).filter((r) => (r.id ?? r.regNo) !== id),
  )
}

export type Payment = {
  id: string
  owner: string
  file: FileInfo
  amount: number
  date: string
  note: string
  regIds: string[]
  createdAt: string
  status?: string
  adminNote?: string
}
export type Doc = { id: string; owner: string; file: FileInfo; note: string; createdAt: string; status?: string; adminNote?: string }

export const ST = { wait: "Menunggu Verifikasi", ok: "Terverifikasi", no: "Ditolak" } as const
export const statusTone = (s?: string) => (s === ST.ok ? "green" : s === ST.no ? "red" : "orange") as "green" | "red" | "orange"
export function StatusChip({ s }: { s?: string }) {
  const v = s ?? ST.wait
  return <Chip tone={statusTone(v)}>{v.toUpperCase()}</Chip>
}

export type Hotel = { id: string; name: string; address: string }
export type Room = { id: string; hotelId: string; name: string; type: string; capacity: number }
export type Trans = { id: string; kind: string; name: string; route: string; depart: string; capacity: number }
export const HOTEL_KEY = "tks27_hotels"
export const ROOM_KEY = "tks27_rooms"
export const TRANS_KEY = "tks27_transport"

export const PAY_KEY = "tks27_payments"
export const DOC_KEY = "tks27_suratTugas"

const listOwned = <T extends { owner: string; createdAt: string }>(key: string, owner: string) =>
  read<T[]>(key, [])
    .filter((x) => x.owner === owner)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

export function upsert<T extends { id: string }>(key: string, item: T) {
  const all = read<T[]>(key, [])
  const i = all.findIndex((x) => x.id === item.id)
  if (i >= 0) all[i] = item
  else all.push(item)
  write(key, all)
}

export function removeById<T extends { id: string }>(key: string, id: string) {
  write(
    key,
    read<T[]>(key, []).filter((x) => x.id !== id),
  )
}

export function detachReg(regId: string) {
  const pays = read<Payment[]>(PAY_KEY, [])
  write(
    PAY_KEY,
    pays.map((p) => ({ ...p, regIds: p.regIds.filter((x) => x !== regId) })),
  )
}

const readAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error("Gagal membaca berkas."))
    r.readAsDataURL(file)
  })

export async function compressPhoto(file: File, maxDim = 600): Promise<string> {
  const src = await readAsDataURL(file)
  const img = new Image()
  await new Promise<void>((res, rej) => {
    img.onload = () => res()
    img.onerror = () => rej(new Error("Berkas foto tidak valid."))
    img.src = src
  })
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.82)
}

const MAX_SURAT = 1024 * 1024

export async function readProof(file: File, label: string): Promise<FileInfo> {
  if (!/^(application\/pdf|image\/(jpeg|png))$/.test(file.type))
    throw new Error(`${label} harus berformat PDF, JPG, atau PNG.`)
  if (file.type === "application/pdf") {
    if (file.size > MAX_SURAT) throw new Error(`Ukuran PDF ${label.toLowerCase()} maksimal 1 MB.`)
    return { name: file.name, type: file.type, size: file.size, data: await readAsDataURL(file) }
  }
  if (file.size > 8 * 1024 * 1024) throw new Error(`Ukuran gambar maksimal 8 MB.`)
  const data = await compressPhoto(file, 1400)
  return { name: file.name, type: "image/jpeg", size: Math.round(data.length * 0.75), data }
}
export const fmtSize = (n: number) =>
  n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`

// ── Shared UI ──────────────────────────────────────────────────────────────────
export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#262626",
  border: "1px solid #555",
  color: "#fff",
  padding: "13px 14px",
  fontFamily: BB,
  fontSize: 15,
  outline: "none",
  borderRadius: 0,
}

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: BC,
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: 2.5,
  color: "#bbb",
  marginBottom: 8,
}

function Styles() {
  return (
    <style>{`
      .tks-input:focus { border-color: ${O} !important; box-shadow: 0 0 0 1px ${O}; }
      .tks-input::placeholder { color: #777; }
      .tks-input[type="date"] { color-scheme: dark; }
      .reg-layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 40px; align-items: start; }
      .reg-nav { position: sticky; top: 92px; display: flex; flex-direction: column; border: 1px solid #4a4a4a; background: #2d2d2d; }
      .reg-nav-item { display: flex; align-items: center; gap: 12px; padding: 16px 18px; background: none; border: none; border-left: 3px solid transparent; border-bottom: 1px solid #3d3d3d; cursor: pointer; text-align: left; font-family: ${BC}; font-weight: 700; font-size: 15px; letter-spacing: 2.5px; color: #aaa; }
      .reg-nav-item:last-child { border-bottom: none; }
      .reg-nav-item:hover { background: #343434; color: #fff; }
      .reg-nav-item[data-on="true"] { border-left-color: ${O}; background: rgba(255,109,0,.12); color: ${O}; }
      .reg-nav-no { width: 24px; height: 24px; flex: none; display: grid; place-items: center; font-size: 13px; border: 1px solid currentColor; }
      .reg-nav-label { flex: 1; }
      .reg-short { display: none; }
      .reg-nav-label { line-height: 1.2; }
      .reg-nav-count { font-size: 13px; min-width: 24px; text-align: center; padding: 2px 8px; background: #1f1f1f; color: #ddd; }
      .reg-nav-item[data-on="true"] .reg-nav-count { background: ${O}; color: #fff; }
      @media (max-width: 900px) {
        .reg-layout { grid-template-columns: 1fr; gap: 0; }
        .reg-page { padding-bottom: 120px !important; }
        .reg-nav { position: fixed; z-index: 40; left: 0; right: 0; bottom: 0; top: auto; flex-direction: row; border: none; border-top: 1px solid #555; background: #262626; }
        .reg-nav-item { flex: 1; min-width: 0; flex-direction: column; gap: 4px; padding: 10px 2px; border-left: none; border-bottom: none; border-top: 3px solid transparent; font-size: 10px; letter-spacing: 1px; text-align: center; }
        .reg-nav-item[data-on="true"] { border-left-color: transparent; border-top-color: ${O}; }
        .reg-nav-scroll { overflow-x: auto; }
        .reg-nav-scroll .reg-nav-item { flex: 0 0 auto; min-width: 84px; padding-left: 8px; padding-right: 8px; }
        .reg-nav-count:empty { display: none; }
        .reg-nav-no { display: none; }
        .reg-long { display: none; }
        .reg-short { display: inline; }
        .reg-nav-label { flex: none; overflow: hidden; text-overflow: ellipsis; max-width: 100%; white-space: nowrap; }
      }
      .tks-btn { transition: background .2s, transform .1s, opacity .2s; }
      .tks-btn:hover:not(:disabled) { filter: brightness(1.08); }
      .tks-btn:active:not(:disabled) { transform: translateY(1px); }
      .tks-btn:disabled { opacity: .55; cursor: not-allowed; }
      .tks-btn:focus-visible, .tks-seg:focus-visible, .tks-link:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      .tks-seg:hover { border-color: ${O} !important; }
    `}</style>
  )
}

export function Field({
  label,
  error,
  hint,
  htmlFor,
  children,
}: {
  label: string
  error?: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label htmlFor={htmlFor} style={labelStyle}>
        {label.toUpperCase()}
      </label>
      {children}
      {hint && !error && (
        <div style={{ fontFamily: BB, fontSize: 12, color: "#888", marginTop: 6 }}>{hint}</div>
      )}
      {error && (
        <div role="alert" style={{ fontFamily: BB, fontSize: 13, color: "#ff8a65", marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  )
}

export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="tks-btn"
      style={{
        width: "100%",
        fontFamily: BC,
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: 3,
        color: "#fff",
        background: O,
        border: "none",
        padding: "16px 24px",
        cursor: "pointer",
        ...rest.style,
      }}
    >
      {children}
    </button>
  )
}

export function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly string[]
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const on = value === o
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            className="tks-seg"
            onClick={() => onChange(o)}
            style={{
              fontFamily: BC,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 2,
              padding: "11px 20px",
              cursor: "pointer",
              background: on ? O : "#262626",
              color: on ? "#fff" : "#ccc",
              border: `1px solid ${on ? O : "#555"}`,
              transition: "background .2s, color .2s",
            }}
          >
            {o.toUpperCase()}
          </button>
        )
      })}
    </div>
  )
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ paddingTop: 68, minHeight: "100vh", background: "#3a3a3a" }}>
      <Styles />
      {children}
    </main>
  )
}

// ── Login page ─────────────────────────────────────────────────────────────────
type Mode = "login" | "signup" | "reset"
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_ATTEMPTS = 5
const LOCK_SECONDS = 30

export function LoginPage({
  auth,
  onSuccess,
  notice,
}: {
  auth: Auth
  onSuccess: () => void
  notice?: string
}) {
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [remember, setRemember] = useState(true)
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [info, setInfo] = useState("")
  const [busy, setBusy] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockLeft, setLockLeft] = useState(0)

  useEffect(() => {
    if (lockLeft <= 0) return
    const t = setTimeout(() => setLockLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [lockLeft])

  const switchMode = (m: Mode) => {
    setMode(m)
    setErrors({})
    setFormError("")
    setInfo("")
    setPassword("")
    setConfirm("")
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === "signup" && name.trim().length < 3) e.name = "Nama minimal 3 karakter."
    if (!EMAIL_RE.test(email.trim())) e.email = "Masukkan alamat email yang valid."
    if (mode === "login") {
      if (!password) e.password = "Kata sandi wajib diisi."
    } else {
      if (password.length < 8) e.password = "Kata sandi minimal 8 karakter."
      else if (!/[A-Za-z]/.test(password) || !/\d/.test(password))
        e.password = "Gunakan kombinasi huruf dan angka."
      if (confirm !== password) e.confirm = "Konfirmasi kata sandi tidak cocok."
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setFormError("")
    setInfo("")
    if (lockLeft > 0 || !validate()) return
    setBusy(true)
    try {
      if (mode === "login") {
        try {
          await auth.login(email, password, remember)
          onSuccess()
        } catch (err) {
          const n = attempts + 1
          setAttempts(n)
          if (n >= MAX_ATTEMPTS) {
            setAttempts(0)
            setLockLeft(LOCK_SECONDS)
            setFormError(`Terlalu banyak percobaan. Coba lagi dalam ${LOCK_SECONDS} detik.`)
          } else {
            setFormError(`${(err as Error).message} (${MAX_ATTEMPTS - n} percobaan tersisa)`)
          }
        }
      } else if (mode === "signup") {
        await auth.signup(name, email, password)
        onSuccess()
      } else {
        await auth.resetPassword(email, password)
        setMode("login")
        setPassword("")
        setConfirm("")
        setInfo("Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.")
      }
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const title = { login: "MASUK", signup: "BUAT AKUN", reset: "ATUR ULANG SANDI" }[mode]
  const cta = { login: "MASUK", signup: "DAFTAR AKUN", reset: "SIMPAN KATA SANDI" }[mode]

  const err = (k: string) => (errors[k] ? { borderColor: "#ff8a65" } : {})

  return (
    <PageShell>
      <div
        className="section-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100vh - 68px)",
        }}
      >
        <div
          style={{
            background: `linear-gradient(160deg, ${O} 0%, #e65100 70%, #4D4D4D 130%)`,
            padding: "64px 48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <img src="/imports/LOGO_TKSGPIB27__3_.png" alt="Logo TKS 2027 PKB GPIB" style={{ width: 120, height: 120, objectFit: "contain", marginBottom: 32 }} />
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 4, color: "rgba(255,255,255,0.7)", marginBottom: 14 }}>
            PORTAL PESERTA
          </div>
          <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(40px,5vw,64px)", lineHeight: 1, letterSpacing: 2, color: "#fff", margin: "0 0 20px" }}>
            TKS 2027
            <br />
            PKB GPIB
          </h1>
          <p style={{ fontFamily: BB, fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.85)", maxWidth: 420, margin: 0 }}>
            Masuk atau buat akun untuk mendaftarkan diri sebagai peserta, undangan, pendamping, atau KMJ pada Temu Karya Sinodal 2027.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
          <form onSubmit={submit} noValidate style={{ width: "100%", maxWidth: 420 }}>
            {mode !== "reset" && (
              <div role="tablist" style={{ display: "flex", marginBottom: 32, borderBottom: "1px solid #555" }}>
                {(["login", "signup"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      borderBottom: `3px solid ${mode === m ? O : "transparent"}`,
                      marginBottom: -1,
                      padding: "12px 0",
                      fontFamily: BC,
                      fontWeight: 700,
                      fontSize: 15,
                      letterSpacing: 3,
                      color: mode === m ? O : "#999",
                      cursor: "pointer",
                    }}
                  >
                    {m === "login" ? "MASUK" : "AKUN BARU"}
                  </button>
                ))}
              </div>
            )}

            <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 30, letterSpacing: 2, color: "#fff", margin: "0 0 24px" }}>
              {title}
            </h2>

            {notice && mode === "login" && !info && (
              <Banner tone="info">{notice}</Banner>
            )}
            {info && <Banner tone="ok">{info}</Banner>}
            {formError && <Banner tone="error">{lockLeft > 0 ? `Terlalu banyak percobaan. Coba lagi dalam ${lockLeft} detik.` : formError}</Banner>}

            {mode === "signup" && (
              <Field label="Nama Lengkap" htmlFor="auth-name" error={errors.name}>
                <input id="auth-name" className="tks-input" style={{ ...inputStyle, ...err("name") }} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Nama sesuai identitas" />
              </Field>
            )}

            <Field label="Email" htmlFor="auth-email" error={errors.email}>
              <input id="auth-email" type="email" className="tks-input" style={{ ...inputStyle, ...err("email") }} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="nama@email.com" />
            </Field>

            <Field label={mode === "reset" ? "Kata Sandi Baru" : "Kata Sandi"} htmlFor="auth-pass" error={errors.password} hint={mode !== "login" ? "Minimal 8 karakter, kombinasi huruf dan angka." : undefined}>
              <div style={{ position: "relative" }}>
                <input id="auth-pass" type={show ? "text" : "password"} className="tks-input" style={{ ...inputStyle, ...err("password"), paddingRight: 72 }} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 64, background: "none", border: "none", color: O, fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: "pointer" }}>
                  {show ? "HIDE" : "SHOW"}
                </button>
              </div>
            </Field>

            {mode !== "login" && (
              <Field label="Konfirmasi Kata Sandi" htmlFor="auth-confirm" error={errors.confirm}>
                <input id="auth-confirm" type={show ? "text" : "password"} className="tks-input" style={{ ...inputStyle, ...err("confirm") }} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" placeholder="••••••••" />
              </Field>
            )}

            {mode === "login" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: BB, fontSize: 14, color: "#ccc", cursor: "pointer" }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: O, width: 16, height: 16 }} />
                  Ingat saya
                </label>
                <button type="button" className="tks-link" onClick={() => switchMode("reset")} style={{ background: "none", border: "none", padding: 0, fontFamily: BB, fontSize: 14, color: O, cursor: "pointer", textDecoration: "underline" }}>
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <PrimaryButton type="submit" disabled={busy || lockLeft > 0}>
              {busy ? "MEMPROSES…" : lockLeft > 0 ? `TUNGGU ${lockLeft}s` : cta}
            </PrimaryButton>

            {mode === "reset" && (
              <button type="button" className="tks-link" onClick={() => switchMode("login")} style={{ display: "block", margin: "20px auto 0", background: "none", border: "none", fontFamily: BB, fontSize: 14, color: O, cursor: "pointer", textDecoration: "underline" }}>
                Kembali ke halaman masuk
              </button>
            )}
          </form>
        </div>
      </div>
    </PageShell>
  )
}

export function Banner({ tone, children }: { tone: "info" | "ok" | "error"; children: React.ReactNode }) {
  const c = { info: O, ok: "#66bb6a", error: "#ff8a65" }[tone]
  return (
    <div role={tone === "error" ? "alert" : "status"} style={{ borderLeft: `3px solid ${c}`, background: "rgba(0,0,0,0.25)", padding: "12px 14px", marginBottom: 22, fontFamily: BB, fontSize: 14, color: "#eee", lineHeight: 1.5 }}>
      {children}
    </div>
  )
}

// ── Participant registration page ──────────────────────────────────────────────
type FormState = {
  nama: string
  jenis: string
  tempat: string
  tanggal: string
  gender: string
  gereja: string
  mupel: string
  wa: string
  ukuran: string
}

const emptyForm = (name: string): FormState => ({
  nama: name,
  jenis: "",
  tempat: "",
  tanggal: "",
  gender: "",
  gereja: "",
  mupel: "",
  wa: "",
  ukuran: "",
})

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })

type Tab = "peserta" | "medis" | "perjalanan" | "pembayaran" | "surat"

export function RegistrationPage({ user }: { user: User }) {
  const [regs, setRegs] = useState<Registration[]>(() => listRegs(user.email))
  const [pays, setPays] = useState<Payment[]>(() => listOwned<Payment>(PAY_KEY, user.email))
  const [docs, setDocs] = useState<Doc[]>(() => listOwned<Doc>(DOC_KEY, user.email))
  const [groups, setGroups] = useState<TravelGroup[]>(() => listOwned<TravelGroup>(TRAVEL_KEY, user.email))
  const [tab, setTab] = useState<Tab>("peserta")
  const [editing, setEditing] = useState<Registration | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const refresh = () => {
    setRegs(listRegs(user.email))
    setPays(listOwned<Payment>(PAY_KEY, user.email))
    setDocs(listOwned<Doc>(DOC_KEY, user.email))
    setGroups(listOwned<TravelGroup>(TRAVEL_KEY, user.email))
  }

  if (editing) {
    return (
      <PageShell>
        <RegistrationForm
          user={user}
          existing={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            refresh()
            setEditing(null)
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        />
      </PageShell>
    )
  }

  const tabs: [Tab, string, number][] = [
    ["peserta", "PESERTA", regs.length],
    ["medis", "RIWAYAT MEDIS", regs.filter((r) => r.medical).length],
    ["perjalanan", "KEDATANGAN & KEBERANGKATAN", groups.length],
    ["pembayaran", "PEMBAYARAN", pays.length],
    ["surat", "SURAT TUGAS", docs.length],
  ]

  return (
    <PageShell>
      <div className="reg-page" style={{ width: "100%", padding: "48px clamp(16px,3vw,56px) 96px" }}>
        <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 4, color: O, marginBottom: 12 }}>
          PENDAFTARAN KONTINGEN
        </div>
        <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(36px,5vw,56px)", letterSpacing: 2, lineHeight: 1, color: "#fff", margin: "0 0 12px" }}>
          KONTINGEN {user.name.toUpperCase()}
        </h1>
        <p style={{ fontFamily: BB, fontSize: 15, color: "#bbb", margin: "0 0 28px", lineHeight: 1.7 }}>
          Ketua kontingen: <strong style={{ color: "#fff" }}>{user.name}</strong> ({user.email}). Kelola peserta, riwayat medis, jadwal kedatangan dan keberangkatan, bukti pembayaran, dan surat tugas dari satu tempat.
        </p>

        <div className="reg-layout">
        <nav role="tablist" aria-orientation="vertical" className="reg-nav">
          {tabs.map(([k, label, n], i) => {
            const on = tab === k
            return (
              <button key={k} role="tab" aria-selected={on} onClick={() => { setTab(k); window.scrollTo({ top: 0 }) }} className="reg-nav-item" data-on={on}>
                <span className="reg-nav-no">{i + 1}</span>
                <span className="reg-nav-label"><span className="reg-long">{label}</span><span className="reg-short">{({ peserta: "PESERTA", medis: "MEDIS", perjalanan: "JADWAL", pembayaran: "BAYAR", surat: "SURAT" } as Record<string, string>)[k]}</span></span>
                <span className="reg-nav-count">{n}</span>
              </button>
            )
          })}
        </nav>
        <div className="reg-content">
        {tab === "peserta" && (
          <ParticipantList
            regs={regs}
            pays={pays}
            confirmId={confirmId}
            setConfirmId={setConfirmId}
            onAdd={() => setEditing("new")}
            onEdit={setEditing}
            onDelete={(id) => {
              deleteReg(id)
              detachReg(id)
              setConfirmId(null)
              refresh()
            }}
          />
        )}
        {tab === "medis" && <MedicalTab regs={regs} refresh={refresh} />}
        {tab === "perjalanan" && <TravelTab user={user} regs={regs} groups={groups} refresh={refresh} />}
        {tab === "pembayaran" && <PaymentsTab user={user} regs={regs} pays={pays} refresh={refresh} />}
        {tab === "surat" && <DocsTab user={user} docs={docs} refresh={refresh} />}
        </div>
        </div>
      </div>
    </PageShell>
  )
}

function RegistrationForm({
  user,
  existing,
  onSaved,
  onCancel,
}: {
  user: User
  existing: Registration | null
  onSaved: () => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState<FormState>(() =>
    existing
      ? {
          nama: existing.nama,
          jenis: existing.jenis,
          tempat: existing.tempat,
          tanggal: existing.tanggal,
          gender: existing.gender,
          gereja: existing.gereja,
          mupel: existing.mupel,
          wa: existing.wa ?? "",
          ukuran: existing.ukuran ?? "",
        }
      : emptyForm(""),
  )
  const [foto, setFoto] = useState<string>(existing?.foto ?? "")
  const [lomba, setLomba] = useState<string[]>(existing?.lomba ?? [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState("")
  const [agree, setAgree] = useState(!!existing)
  const [busy, setBusy] = useState(false)
  const fotoRef = useRef<HTMLInputElement>(null)

  const set = (k: keyof FormState) => (v: string) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: "" }))
  }
  const text = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value)
  const err = (k: string) => (errors[k] ? { borderColor: "#ff8a65" } : {})

  const pickFoto = async (file?: File) => {
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type))
      return setErrors((e) => ({ ...e, foto: "Foto harus berformat JPG, PNG, atau WEBP." }))
    if (file.size > 5 * 1024 * 1024)
      return setErrors((e) => ({ ...e, foto: "Ukuran foto maksimal 5 MB." }))
    try {
      setFoto(await compressPhoto(file))
      setErrors((e) => ({ ...e, foto: "" }))
    } catch (x) {
      setErrors((e) => ({ ...e, foto: (x as Error).message }))
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (form.nama.trim().length < 3) e.nama = "Nama peserta minimal 3 karakter."
    if (!form.jenis) e.jenis = "Pilih jenis peserta."
    if (!form.tempat.trim()) e.tempat = "Tempat lahir wajib diisi."
    if (!form.tanggal) e.tanggal = "Tanggal lahir wajib diisi."
    else if (new Date(form.tanggal) > new Date()) e.tanggal = "Tanggal lahir tidak valid."
    if (!form.gender) e.gender = "Pilih jenis kelamin."
    if (!foto) e.foto = "Foto wajib diunggah."
    if (!form.gereja.trim()) e.gereja = "Asal gereja wajib diisi."
    if (!form.mupel.trim()) e.mupel = "Asal mupel wajib diisi."
    if (!/^(\+?62|0)8\d{7,12}$/.test(form.wa.replace(/[\s-]/g, "")))
      e.wa = "Masukkan nomor WhatsApp yang valid, contoh 081234567890."
    if (!form.ukuran) e.ukuran = "Pilih ukuran kaos."
    if (!agree) e.agree = "Anda harus menyatakan data sudah benar."
    setErrors(e)
    if (Object.keys(e).length) {
      requestAnimationFrame(() =>
        document.querySelector('[role="alert"]')?.scrollIntoView({ block: "center", behavior: "smooth" }),
      )
    }
    return Object.keys(e).length === 0
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    setFormError("")
    if (!validate()) return
    setBusy(true)
    const record: Registration = {
      ...existing,
      id: existing?.id ?? randomId(),
      regNo:
        existing?.regNo ??
        `TKS27-${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 4)}`.toUpperCase(),
      email: user.email,
      nama: form.nama.trim(),
      jenis: form.jenis,
      tempat: form.tempat.trim(),
      tanggal: form.tanggal,
      gender: form.gender,
      gereja: form.gereja.trim(),
      mupel: form.mupel.trim(),
      foto,
      wa: form.wa.replace(/[\s-]/g, ""),
      ukuran: form.ukuran,
      lomba,
      lombaStatus: Object.fromEntries(
        Object.entries(existing?.lombaStatus ?? {}).filter(([k]) => lomba.includes(k)),
      ),
      adminNote: undefined,
      status: ST.wait,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    try {
      saveReg(record)
      onSaved()
    } catch {
      setFormError("Penyimpanan gagal karena ruang penyimpanan peramban penuh. Gunakan berkas yang lebih kecil.")
    } finally {
      setBusy(false)
    }
  }

  const drop: React.CSSProperties = {
    ...inputStyle,
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    textAlign: "left",
    borderStyle: "dashed",
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 24px 96px" }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 4, color: O, marginBottom: 12 }}>
        FORMULIR PENDAFTARAN
      </div>
      <h1 style={{ fontFamily: BC, fontWeight: 800, fontSize: "clamp(36px,5vw,56px)", letterSpacing: 2, lineHeight: 1, color: "#fff", margin: "0 0 12px" }}>
        {existing ? "UBAH DATA PESERTA" : "TAMBAH PESERTA"}
      </h1>
      <p style={{ fontFamily: BB, fontSize: 15, color: "#bbb", margin: "0 0 40px", lineHeight: 1.7 }}>
        Didaftarkan oleh <strong style={{ color: "#fff" }}>{user.name}</strong> ({user.email}). Lengkapi seluruh kolom di bawah ini.
      </p>

      <form onSubmit={submit} noValidate style={{ background: "#2d2d2d", border: "1px solid #4a4a4a", padding: "36px clamp(20px,4vw,40px)" }}>
        {formError && <Banner tone="error">{formError}</Banner>}

        <Field label="1. Nama Peserta" htmlFor="r-nama" error={errors.nama}>
          <input id="r-nama" className="tks-input" style={{ ...inputStyle, ...err("nama") }} value={form.nama} onChange={text("nama")} placeholder="Nama lengkap beserta gelar" autoComplete="name" />
        </Field>

        <Field label="2. Jenis Peserta" error={errors.jenis}>
          <Segmented label="Jenis Peserta" options={JENIS} value={form.jenis} onChange={set("jenis")} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="card-grid">
          <Field label="3. Tempat Lahir" htmlFor="r-tempat" error={errors.tempat}>
            <input id="r-tempat" className="tks-input" style={{ ...inputStyle, ...err("tempat") }} value={form.tempat} onChange={text("tempat")} placeholder="Kota kelahiran" />
          </Field>
          <Field label="Tanggal Lahir" htmlFor="r-tanggal" error={errors.tanggal}>
            <input id="r-tanggal" type="date" max={new Date().toISOString().slice(0, 10)} className="tks-input" style={{ ...inputStyle, ...err("tanggal") }} value={form.tanggal} onChange={text("tanggal")} />
          </Field>
        </div>

        <Field label="4. Jenis Kelamin" error={errors.gender}>
          <Segmented label="Jenis Kelamin" options={GENDERS} value={form.gender} onChange={set("gender")} />
        </Field>

        <Field label="5. Foto" error={errors.foto} hint="JPG, PNG, atau WEBP. Disarankan pas foto berlatar polos.">
          <input ref={fotoRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pickFoto(e.target.files?.[0]); e.target.value = "" }} />
          <button type="button" className="tks-input" onClick={() => fotoRef.current?.click()} style={{ ...drop, ...err("foto") }} aria-label="Unggah foto">
            {foto ? (
              <img src={foto} alt="Pratinjau foto" style={{ width: 72, height: 92, objectFit: "cover", border: `1px solid ${O}` }} />
            ) : (
              <span style={{ width: 72, height: 92, border: "1px dashed #666", display: "flex", alignItems: "center", justifyContent: "center", color: "#777", fontSize: 28 }}>+</span>
            )}
            <span style={{ fontFamily: BB, fontSize: 14, color: "#ccc" }}>
              {foto ? "Klik untuk mengganti foto" : "Klik untuk memilih foto"}
            </span>
          </button>
        </Field>

        <Field label="6. Asal Gereja" htmlFor="r-gereja" error={errors.gereja}>
          <input id="r-gereja" className="tks-input" style={{ ...inputStyle, ...err("gereja") }} value={form.gereja} onChange={text("gereja")} placeholder="Nama jemaat GPIB" />
        </Field>

        <Field label="7. Asal Mupel" htmlFor="r-mupel" error={errors.mupel}>
          <input id="r-mupel" className="tks-input" style={{ ...inputStyle, ...err("mupel") }} value={form.mupel} onChange={text("mupel")} placeholder="Majelis Pekerja Umum Lingkup Pelayanan" />
        </Field>

        <Field label="8. Kontak WhatsApp (Contact Person)" htmlFor="r-wa" error={errors.wa} hint="Nomor WhatsApp aktif yang dapat dihubungi panitia.">
          <input id="r-wa" type="tel" inputMode="tel" className="tks-input" style={{ ...inputStyle, ...err("wa") }} value={form.wa} onChange={text("wa")} placeholder="081234567890" autoComplete="tel" />
        </Field>

        <Field label="9. Ukuran Kaos" error={errors.ukuran}>
          <Segmented label="Ukuran Kaos" options={SIZES} value={form.ukuran} onChange={set("ukuran")} />
        </Field>

        <Field label="10. Pendaftaran Lomba" hint="Opsional. Pilih satu atau lebih cabang lomba / kegiatan.">
          <div role="group" aria-label="Pendaftaran Lomba" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LOMBA.map((l) => {
              const on = lomba.includes(l)
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  className="tks-seg"
                  onClick={() => setLomba((cur) => (on ? cur.filter((x) => x !== l) : [...cur, l]))}
                  style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 2, padding: "11px 18px", cursor: "pointer", background: on ? O : "#262626", color: on ? "#fff" : "#ccc", border: `1px solid ${on ? O : "#555"}`, transition: "background .2s, color .2s" }}
                >
                  {on ? "✓ " : ""}
                  {l.toUpperCase()}
                </button>
              )
            })}
          </div>
        </Field>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontFamily: BB, fontSize: 14, color: "#ccc", lineHeight: 1.6, cursor: "pointer" }}>
            <input type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, agree: "" })) }} style={{ accentColor: O, width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
            Saya menyatakan bahwa seluruh data peserta di atas benar dan dapat dipertanggungjawabkan.
          </label>
          {errors.agree && <div role="alert" style={{ fontFamily: BB, fontSize: 13, color: "#ff8a65", marginTop: 6 }}>{errors.agree}</div>}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <PrimaryButton type="submit" disabled={busy} style={{ flex: 1, minWidth: 200 }}>
            {existing ? "SIMPAN PERUBAHAN" : "SIMPAN PESERTA"}
          </PrimaryButton>
          {onCancel && (
            <button type="button" className="tks-btn" onClick={onCancel} style={{ fontFamily: BC, fontWeight: 800, fontSize: 16, letterSpacing: 3, color: "#ddd", background: "none", border: "1px solid #666", padding: "16px 28px", cursor: "pointer" }}>
              BATAL
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export const smallBtn: React.CSSProperties = { fontFamily: BC, fontWeight: 800, fontSize: 13, letterSpacing: 2.5, padding: "10px 20px", cursor: "pointer" }
export const cardStyle: React.CSSProperties = { background: "#2d2d2d", border: "1px solid #4a4a4a" }

export function Chip({ children, tone = "orange" }: { children: React.ReactNode; tone?: "orange" | "green" | "gray" | "red" }) {
  const c = { orange: ["rgba(255,109,0,0.25)", "#fff"], green: ["rgba(102,187,106,0.22)", "#a5d6a7"], gray: ["#3a3a3a", "#bbb"], red: ["rgba(239,83,80,0.22)", "#ef9a9a"] }[tone]
  return (
    <span style={{ fontFamily: BC, fontWeight: 800, fontSize: 11, letterSpacing: 2, color: c[1], background: c[0], padding: "3px 10px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  )
}

function ParticipantList({
  regs,
  pays,
  confirmId,
  setConfirmId,
  onAdd,
  onEdit,
  onDelete,
}: {
  regs: Registration[]
  pays: Payment[]
  confirmId: string | null
  setConfirmId: (id: string | null) => void
  onAdd: () => void
  onEdit: (r: Registration) => void
  onDelete: (id: string) => void
}) {
  const btn = smallBtn
  const sorted = [...regs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const paidIds = new Set(pays.flatMap((p) => p.regIds))
  const stats: [string, number][] = [
    ["TOTAL", regs.length],
    ...JENIS.map((j): [string, number] => [j.toUpperCase(), regs.filter((r) => r.jenis === j).length]),
  ]

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {stats.map(([k, v]) => (
            <div key={k} style={{ ...cardStyle, padding: "12px 20px", minWidth: 100 }}>
              <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 3, color: "#999" }}>{k}</div>
              <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: k === "TOTAL" ? O : "#fff", lineHeight: 1.2 }}>{v}</div>
            </div>
          ))}
        </div>
        <button className="tks-btn" onClick={onAdd} style={{ ...btn, fontSize: 15, padding: "14px 28px", color: "#fff", background: O, border: "none" }}>
          + TAMBAH PESERTA
        </button>
      </div>

      {regs.length > 0 && (
        <div style={{ ...cardStyle, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 3, color: "#999", marginBottom: 10 }}>REKAP LOMBA</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LOMBA.map((l) => (
              <Chip key={l} tone={regs.some((r) => r.lomba?.includes(l)) ? "orange" : "gray"}>
                {l.toUpperCase()} · {regs.filter((r) => r.lomba?.includes(l)).length}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", marginBottom: 8 }}>BELUM ADA PESERTA</div>
          <p style={{ fontFamily: BB, fontSize: 14, color: "#aaa", margin: "0 0 24px" }}>Mulai dengan menambahkan peserta pertama dari kontingen Anda.</p>
          <button className="tks-btn" onClick={onAdd} style={{ ...btn, color: "#fff", background: O, border: "none" }}>+ TAMBAH PESERTA</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 460px), 1fr))" }}>
          {sorted.map((r, i) => (
            <article key={r.id} style={{ ...cardStyle, display: "grid", gridTemplateColumns: "96px 1fr", gap: 20, padding: 20 }}>
              <img src={r.foto} alt={`Foto ${r.nama}`} style={{ width: 96, height: 124, objectFit: "cover", border: `2px solid ${O}` }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>#{i + 1} · {r.regNo}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Chip tone={paidIds.has(r.id) ? "green" : "gray"}>{paidIds.has(r.id) ? "PEMBAYARAN TERCATAT" : "BELUM DIBAYAR"}</Chip>
                    <StatusChip s={r.status} />
                  </div>
                </div>
                <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 24, letterSpacing: 1, color: "#fff", margin: "0 0 8px", overflowWrap: "anywhere" }}>{r.nama}</h2>
                <div style={{ fontFamily: BB, fontSize: 14, color: "#ccc", lineHeight: 1.7 }}>
                  <strong style={{ color: "#fff" }}>{r.jenis}</strong> · {r.gender} · {r.tempat}, {fmtDate(r.tanggal)}
                  <br />
                  {r.gereja} · Mupel {r.mupel}
                  <br />
                  {r.wa ? (
                    <a href={`https://wa.me/${r.wa.replace(/^\+/, "").replace(/^0/, "62")}`} target="_blank" rel="noreferrer" style={{ color: O }}>WA {r.wa}</a>
                  ) : (
                    <span style={{ color: "#ff8a65" }}>Kontak WA belum diisi</span>
                  )}{" "}
                  · Kaos {r.ukuran ? <strong style={{ color: "#fff" }}>{r.ukuran}</strong> : <span style={{ color: "#ff8a65" }}>belum dipilih</span>}
                </div>
                {r.status === ST.no && r.adminNote && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", marginTop: 8 }}>Alasan penolakan: {r.adminNote}</div>
                )}
                {r.lomba?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {r.lomba.map((l) => {
                      const ls = r.lombaStatus?.[l]
                      return (
                        <Chip key={l} tone={ls ? statusTone(ls.status) : "gray"}>
                          {l.toUpperCase()}{ls?.status === ST.ok ? " ✓" : ls?.status === ST.no ? " ✕" : ""}
                        </Chip>
                      )
                    })}
                  </div>
                )}
                {r.akomodasi && (r.akomodasi.roomId || r.akomodasi.transportId) && (() => {
                  const room = read<Room[]>(ROOM_KEY, []).find((x) => x.id === r.akomodasi?.roomId)
                  const hotel = read<Hotel[]>(HOTEL_KEY, []).find((h) => h.id === room?.hotelId)
                  const tr = read<Trans[]>(TRANS_KEY, []).find((x) => x.id === r.akomodasi?.transportId)
                  return (
                    <div style={{ fontFamily: BB, fontSize: 13, color: "#ccc", marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <StatusChip s={r.akomodasi.status} />
                      {room && <span>Hotel: <strong style={{ color: "#fff" }}>{hotel?.name} · {room.name}</strong></span>}
                      {tr && <span>Transport: <strong style={{ color: "#fff" }}>{tr.name} ({tr.route}, {new Date(tr.depart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })})</strong></span>}
                    </div>
                  )
                })()}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                  <button className="tks-btn" onClick={() => onEdit(r)} style={{ ...btn, color: "#fff", background: O, border: "none" }}>UBAH</button>
                  {confirmId === r.id ? (
                    <>
                      <span style={{ fontFamily: BB, fontSize: 14, color: "#ddd" }}>Hapus peserta ini?</span>
                      <button className="tks-btn" onClick={() => onDelete(r.id)} style={{ ...btn, color: "#fff", background: "#c62828", border: "none" }}>YA, HAPUS</button>
                      <button className="tks-btn" onClick={() => setConfirmId(null)} style={{ ...btn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
                    </>
                  ) : (
                    <button className="tks-btn" onClick={() => setConfirmId(r.id)} style={{ ...btn, color: "#ddd", background: "none", border: "1px solid #666" }}>HAPUS</button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export function FileLink({ f }: { f: FileInfo }) {
  return (
    <a href={f.data} download={f.name} style={{ color: O, fontFamily: BB, fontSize: 14, wordBreak: "break-all" }}>
      {f.name}
    </a>
  )
}

export function DeleteControl({ id, confirmId, setConfirmId, onDelete, label }: { id: string; confirmId: string | null; setConfirmId: (v: string | null) => void; onDelete: () => void; label: string }) {
  return confirmId === id ? (
    <>
      <span style={{ fontFamily: BB, fontSize: 14, color: "#ddd" }}>{label}</span>
      <button className="tks-btn" onClick={onDelete} style={{ ...smallBtn, color: "#fff", background: "#c62828", border: "none" }}>YA, HAPUS</button>
      <button className="tks-btn" onClick={() => setConfirmId(null)} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>BATAL</button>
    </>
  ) : (
    <button className="tks-btn" onClick={() => setConfirmId(id)} style={{ ...smallBtn, color: "#ddd", background: "none", border: "1px solid #666" }}>HAPUS</button>
  )
}

function UploadBox({ file, onPick, label, error }: { file: FileInfo | null; onPick: (f: File) => void; label: string; error?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <Field label={label} error={error} hint="PDF, JPG, atau PNG. PDF maksimal 1 MB.">
      <input ref={ref} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = "" }} />
      <button type="button" className="tks-input" onClick={() => ref.current?.click()} aria-label={label} style={{ ...inputStyle, display: "flex", alignItems: "center", gap: 16, cursor: "pointer", textAlign: "left", borderStyle: "dashed", ...(error ? { borderColor: "#ff8a65" } : {}) }}>
        <span style={{ width: 44, height: 56, background: file ? O : "#333", color: "#fff", fontFamily: BC, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {file ? (file.type === "application/pdf" ? "PDF" : "IMG") : "+"}
        </span>
        <span style={{ fontFamily: BB, fontSize: 14, color: "#ccc", minWidth: 0 }}>
          {file ? (
            <>
              <span style={{ display: "block", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
              {fmtSize(file.size)} · klik untuk mengganti
            </>
          ) : (
            "Klik untuk memilih berkas"
          )}
        </span>
      </button>
    </Field>
  )
}

function PaymentsTab({ user, regs, pays, refresh }: { user: User; regs: Registration[]; pays: Payment[]; refresh: () => void }) {
  const [file, setFile] = useState<FileInfo | null>(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [msg, setMsg] = useState("")

  const sorted = [...regs].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const owner = new Map<string, string>()
  pays.forEach((p, i) => p.regIds.forEach((id) => owner.set(id, p.id + "|" + (i + 1))))
  const due = regs.length * FEE
  const paid = pays.reduce((n, p) => n + p.amount, 0)
  const matched = owner.size

  const pick = async (f: File) => {
    try {
      setFile(await readProof(f, "Bukti pembayaran"))
      setErrors((e) => ({ ...e, file: "" }))
    } catch (x) {
      setErrors((e) => ({ ...e, file: (x as Error).message }))
    }
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    const nominal = Number(amount.replace(/\D/g, ""))
    if (!file) e.file = "Unggah bukti pembayaran."
    if (!nominal) e.amount = "Masukkan nominal pembayaran."
    if (!date) e.date = "Tanggal transfer wajib diisi."
    setErrors(e)
    if (Object.keys(e).length) return
    try {
      upsert<Payment>(PAY_KEY, { id: randomId(), owner: user.email, file: file!, amount: nominal, date, note: note.trim(), regIds: [], createdAt: new Date().toISOString() })
      setFile(null)
      setAmount("")
      setNote("")
      setMsg("Bukti pembayaran tersimpan. Pilih peserta yang dicakup pembayaran ini pada kartu di bawah.")
      refresh()
    } catch {
      setErrors({ file: "Penyimpanan penuh. Gunakan berkas yang lebih kecil." })
    }
  }

  const toggle = (p: Payment, regId: string) => {
    const regIds = p.regIds.includes(regId) ? p.regIds.filter((x) => x !== regId) : [...p.regIds, regId]
    upsert<Payment>(PAY_KEY, { ...p, regIds })
    refresh()
  }

  const stat = (k: string, v: string, hl = false) => (
    <div style={{ ...cardStyle, padding: "12px 20px", minWidth: 150 }}>
      <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 10, letterSpacing: 3, color: "#999" }}>{k}</div>
      <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 24, color: hl ? O : "#fff", lineHeight: 1.3 }}>{v}</div>
    </div>
  )

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        {stat("TOTAL TAGIHAN", rupiah(due))}
        {stat("TOTAL BUKTI BAYAR", rupiah(paid), true)}
        {stat("SISA", rupiah(Math.max(0, due - paid)))}
        {stat("PESERTA TERCATAT", `${matched} / ${regs.length}`)}
      </div>
      <p style={{ fontFamily: BB, fontSize: 13, color: "#999", margin: "-8px 0 28px" }}>Biaya pendaftaran {rupiah(FEE)} per peserta.</p>

      <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: "28px clamp(20px,4vw,32px)", marginBottom: 32 }}>
        <h2 style={{ fontFamily: BC, fontWeight: 800, fontSize: 22, letterSpacing: 2, color: "#fff", margin: "0 0 20px" }}>UNGGAH BUKTI PEMBAYARAN</h2>
        {msg && <Banner tone="ok">{msg}</Banner>}
        <UploadBox file={file} onPick={pick} label="Berkas Bukti Transfer" error={errors.file} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="card-grid">
          <Field label="Nominal (Rp)" htmlFor="p-amount" error={errors.amount}>
            <input id="p-amount" inputMode="numeric" className="tks-input" style={inputStyle} value={amount ? Number(amount.replace(/\D/g, "")).toLocaleString("id-ID") : ""} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, "")); setMsg("") }} placeholder="2.000.000" />
          </Field>
          <Field label="Tanggal Transfer" htmlFor="p-date" error={errors.date}>
            <input id="p-date" type="date" max={new Date().toISOString().slice(0, 10)} className="tks-input" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Catatan (opsional)" htmlFor="p-note">
          <input id="p-note" className="tks-input" style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Transfer BCA tahap 1" />
        </Field>
        <PrimaryButton type="submit">SIMPAN BUKTI PEMBAYARAN</PrimaryButton>
      </form>

      {pays.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>
          Belum ada bukti pembayaran. Anda dapat mengunggah lebih dari satu bukti.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {pays.map((p, i) => {
            const covered = p.regIds.length * FEE
            const diff = p.amount - covered
            const status = p.regIds.length === 0 ? ["BELUM DICOCOKKAN", "gray"] : diff === 0 ? ["SESUAI", "green"] : diff < 0 ? [`KURANG ${rupiah(-diff)}`, "orange"] : [`LEBIH ${rupiah(diff)}`, "orange"]
            return (
              <article key={p.id} style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                  <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 2.5, color: O }}>BUKTI #{i + 1} · {fmtDate(p.date)}</div>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Chip tone={status[1] as "gray" | "green" | "orange"}>{status[0]}</Chip>
                    <StatusChip s={p.status} />
                  </span>
                </div>
                {p.status === ST.no && p.adminNote && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", margin: "4px 0" }}>Alasan penolakan: {p.adminNote}</div>
                )}
                <div style={{ fontFamily: BC, fontWeight: 800, fontSize: 28, color: "#fff", letterSpacing: 1 }}>{rupiah(p.amount)}</div>
                <div style={{ fontFamily: BB, fontSize: 14, color: "#ccc", margin: "4px 0 16px" }}>
                  <FileLink f={p.file} /> <span style={{ color: "#888" }}>({fmtSize(p.file.size)})</span>
                  {p.note && <> · {p.note}</>}
                </div>
                {p.file.type !== "application/pdf" && (
                  <a href={p.file.data} target="_blank" rel="noreferrer">
                    <img src={p.file.data} alt={`Bukti ${i + 1}`} style={{ maxWidth: 160, maxHeight: 120, objectFit: "cover", border: "1px solid #555", marginBottom: 16, display: "block" }} />
                  </a>
                )}

                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 3, color: "#999", marginBottom: 8 }}>
                  COCOKKAN DENGAN PESERTA ({p.regIds.length} dipilih · {rupiah(covered)})
                </div>
                {sorted.length === 0 ? (
                  <div style={{ fontFamily: BB, fontSize: 14, color: "#888" }}>Tambahkan peserta terlebih dahulu pada tab Peserta.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 6 }}>
                    {sorted.map((r) => {
                      const o = owner.get(r.id)
                      const other = o && !o.startsWith(p.id) ? o.split("|")[1] : null
                      const on = p.regIds.includes(r.id)
                      return (
                        <label key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 10px", background: on ? "rgba(255,109,0,0.14)" : "#262626", border: `1px solid ${on ? O : "#444"}`, fontFamily: BB, fontSize: 14, color: other ? "#777" : "#eee", cursor: other ? "not-allowed" : "pointer" }}>
                          <input type="checkbox" checked={on} disabled={!!other || p.status === ST.ok} onChange={() => toggle(p, r.id)} style={{ accentColor: O, width: 16, height: 16, flexShrink: 0 }} />
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nama}</span>
                          {other && <span style={{ marginLeft: "auto", fontSize: 11, whiteSpace: "nowrap" }}>Bukti #{other}</span>}
                        </label>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
                  {p.status !== ST.ok && <DeleteControl id={p.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus bukti ini?" onDelete={() => { removeById<Payment>(PAY_KEY, p.id); setConfirmId(null); refresh() }} />}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function DocsTab({ user, docs, refresh }: { user: User; docs: Doc[]; refresh: () => void }) {
  const [file, setFile] = useState<FileInfo | null>(null)
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const pick = async (f: File) => {
    try {
      setFile(await readProof(f, "Surat tugas"))
      setError("")
    } catch (x) {
      setError((x as Error).message)
    }
  }

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!file) return setError("Unggah berkas surat tugas.")
    try {
      upsert<Doc>(DOC_KEY, { id: randomId(), owner: user.email, file, note: note.trim(), createdAt: new Date().toISOString() })
      setFile(null)
      setNote("")
      refresh()
    } catch {
      setError("Penyimpanan penuh. Gunakan berkas yang lebih kecil.")
    }
  }

  return (
    <div>
      <p style={{ fontFamily: BB, fontSize: 15, color: "#bbb", margin: "0 0 24px", lineHeight: 1.7 }}>
        Unggah surat tugas kontingen dari majelis jemaat atau mupel. Anda dapat mengunggah lebih dari satu berkas.
      </p>
      <form onSubmit={submit} noValidate style={{ ...cardStyle, padding: "28px clamp(20px,4vw,32px)", marginBottom: 32 }}>
        <UploadBox file={file} onPick={pick} label="Berkas Surat Tugas" error={error} />
        <Field label="Keterangan (opsional)" htmlFor="d-note">
          <input id="d-note" className="tks-input" style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: Surat tugas Mupel Jakarta 1" />
        </Field>
        <PrimaryButton type="submit">UNGGAH SURAT TUGAS</PrimaryButton>
      </form>

      {docs.length === 0 ? (
        <div style={{ ...cardStyle, border: "1px dashed #666", padding: "40px 24px", textAlign: "center", fontFamily: BB, fontSize: 14, color: "#aaa" }}>
          Belum ada surat tugas yang diunggah.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {docs.map((d, i) => (
            <article key={d.id} style={{ ...cardStyle, padding: 16, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ width: 44, height: 56, background: O, color: "#fff", fontFamily: BC, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {d.file.type === "application/pdf" ? "PDF" : "IMG"}
              </span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontFamily: BC, fontWeight: 700, fontSize: 11, letterSpacing: 2.5, color: O, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>SURAT TUGAS #{i + 1} · {fmtDate(d.createdAt)} <StatusChip s={d.status} /></div>
                {d.status === ST.no && d.adminNote && <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a" }}>Alasan penolakan: {d.adminNote}</div>}
                <FileLink f={d.file} /> <span style={{ fontFamily: BB, fontSize: 13, color: "#888" }}>({fmtSize(d.file.size)})</span>
                {d.note && <div style={{ fontFamily: BB, fontSize: 14, color: "#ccc", marginTop: 2 }}>{d.note}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {d.status !== ST.ok && <DeleteControl id={d.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus surat ini?" onDelete={() => { removeById<Doc>(DOC_KEY, d.id); setConfirmId(null); refresh() }} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
