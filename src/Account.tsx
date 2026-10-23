import { MedicalTab, TravelTab } from "@/Logistics"
import React, { useState, useEffect, useRef, useCallback } from "react"
import logo from "@/imports/LOGO_TKSGPIB27__3_.png"
import { authTanpaSesi, supabase } from "@/lib/supabase"

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

export function newUuid() {
  const bytes = new Uint8Array(16)
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes)
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function profilToUser(id: string): Promise<User> {
  const { data, error } = await supabase.from("profil").select("id, nama, email, peran").eq("id", id).single()
  if (error) throw new Error(error.message)
  return { id: data.id, name: data.nama, email: data.email, role: data.peran as Role }
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
  const mail = email.trim().toLowerCase()
  const { data: existing, error: existingError } = await supabase.from("profil").select("id").eq("email", mail).maybeSingle()
  throwIf(existingError)
  if (existing) throw new Error("Email sudah terdaftar.")
  const client = authTanpaSesi()
  const { data, error } = await client.auth.signUp({
    email: mail,
    password,
    options: { data: { nama: name.trim() } },
  })
  if (error) {
    if (/already registered|already exists/i.test(error.message)) throw new Error("Email sudah terdaftar.")
    throw new Error(error.message)
  }
  if (!data.user) throw new Error("Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.")
  const { data: updated, error: roleError } = await supabase
    .from("profil")
    .update({ nama: name.trim(), peran: role })
    .eq("id", data.user.id)
    .select("id")
    .maybeSingle()
  throwIf(roleError)
  if (!updated) throw new Error("Akun dibuat, tetapi perannya belum tersimpan. Setelah email dikonfirmasi, atur peran dari daftar akun.")
}

async function guardLastSuperuser(id: string) {
  const { data, error } = await supabase.from("profil").select("id").eq("peran", "superuser")
  throwIf(error)
  const supers = data ?? []
  if (supers.some((row) => row.id === id) && supers.length <= 1)
    throw new Error("Tidak dapat mengubah atau menghapus Superuser terakhir.")
}

export async function setUserRole(id: string, role: Role) {
  if (role !== "superuser") await guardLastSuperuser(id)
  const { data, error } = await supabase.from("profil").update({ peran: role }).eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Peran tidak tersimpan. Pastikan Anda masuk sebagai Superuser.")
}

export async function deleteUser(id: string) {
  const { data: session } = await supabase.auth.getUser()
  if (session.user?.id === id) throw new Error("Tidak dapat menghapus akun yang sedang digunakan.")
  await guardLastSuperuser(id)
  const { count, error: countError } = await supabase.from("peserta").select("id", { count: "exact", head: true }).eq("kontingen_id", id)
  throwIf(countError)
  if ((count ?? 0) > 0) throw new Error("Akun ini memiliki data peserta dan tidak dapat dihapus.")
  const { data, error } = await supabase.from("profil").delete().eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Akun tidak terhapus. Jalankan skrip supabase/admin-akses.sql di SQL Editor.")
}

export async function setUserPassword(id: string, password: string) {
  const { data } = await supabase.auth.getUser()
  if (data.user?.id === id) {
    const { error } = await supabase.auth.updateUser({ password })
    throwIf(error)
    return "Kata sandi Anda diperbarui."
  }
  const { data: profil, error } = await supabase.from("profil").select("email").eq("id", id).maybeSingle()
  throwIf(error)
  if (!profil?.email) throw new Error("Akun tidak ditemukan.")
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(profil.email, { redirectTo: window.location.origin })
  throwIf(resetError)
  return `Tautan reset kata sandi dikirim ke ${profil.email}.`
}

export type Auth = ReturnType<typeof useAuth>

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let live = true
    const apply = (id?: string) => {
      if (!id) {
        setUser(null)
        return
      }
      setTimeout(() => {
        void profilToUser(id).then((next) => {
          if (live) setUser(next)
        })
      }, 0)
    }
    void supabase.auth.getSession().then(({ data }) => {
      if (live) apply(data.session?.user.id)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (live) apply(session?.user.id)
    })
    return () => {
      live = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signup = async (name: string, email: string, password: string) => {
    const mail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password,
      options: { data: { nama: name.trim() } },
    })
    if (error) {
      if (/already registered|already exists/i.test(error.message)) throw new Error("Email sudah terdaftar. Silakan masuk.")
      throw new Error(error.message)
    }
    if (!data.session || !data.user) throw new Error("Akun dibuat. Periksa email untuk konfirmasi, lalu masuk.")
    const { error: profileError } = await supabase.from("profil").update({ nama: name.trim() }).eq("id", data.user.id)
    if (profileError) throw new Error(profileError.message)
    setUser(await profilToUser(data.user.id))
  }

  const login = async (email: string, password: string, _remember: boolean) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data.user) throw new Error("Email atau kata sandi salah.")
    setUser(await profilToUser(data.user.id))
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin,
    })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    await supabase.auth.signOut()
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
  dariDatang: string
  lokasiDatang: string
  tglDatang: string
  jamDatang: string
  lokasiBerangkat: string
  keBerangkat: string
  tglBerangkat: string
  jamBerangkat: string
}
export type TripStatus = "Belum" | "Selesai"
export type Trip = {
  id: string
  groupId: string
  nama: string
  jenis: "Kedatangan" | "Kepulangan"
  leg: "datang" | "berangkat"
  dari: string
  ke: string
  tanggal: string
  jam: string
  organizer: string
  kendaraanId: string
  kendaraan: string
  status: TripStatus
  passengers: { id: string; nama: string; mupel: string }[]
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
  fotoPath?: string
  wa: string
  ukuran: string
  lomba: string[]
  lombaStatus?: Record<string, { status: string; note?: string; by?: string; at?: string }>
  medical?: Medical
  akomodasi?: {
    roomId?: string
    transportId?: string
    status: string
    note?: string
    hotelName?: string
    roomName?: string
    transportName?: string
    route?: string
    depart?: string
    by?: string
    at?: string
  }
  adminNote?: string
  verifiedBy?: string
  verifiedAt?: string
  status: string
  createdAt: string
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
  verifiedBy?: string
  verifiedAt?: string
}
export type Doc = { id: string; owner: string; file: FileInfo; note: string; createdAt: string; status?: string; adminNote?: string; verifiedBy?: string; verifiedAt?: string }

export const ST = { wait: "Menunggu Verifikasi", ok: "Terverifikasi", no: "Ditolak" } as const
export const isLocked = (status?: string) => (status ?? ST.wait) !== ST.wait
export const LOCK_MSG = "Data terkunci setelah verifikasi. Hanya Superuser yang dapat membuka akses."
export function verdictText(status?: string, by?: string, at?: string) {
  if (!isLocked(status) || !by) return ""
  const verb = status === ST.ok ? "Disetujui" : "Ditolak"
  const when = at ? new Date(at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : ""
  return `${verb} oleh ${by}${when ? ` · ${when}` : ""}`
}
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

const PESERTA_SELECT = `
  id, nomor_registrasi, kontingen_id, nama, jenis, tempat_lahir, tanggal_lahir, jenis_kelamin,
  gereja, mupel, whatsapp, ukuran_kaos, foto_path, status, catatan_admin, diverifikasi_pada, created_at,
  verifikator:diverifikasi_oleh ( nama ),
  peserta_lomba ( lomba, status, catatan_admin, diverifikasi_pada, verifikator:diverifikasi_oleh ( nama ) ),
  riwayat_medis (
    golongan_darah, alergi, penyakit_lain, obat, riwayat_rawat, kondisi_khusus,
    kontak_nama, kontak_hubungan, kontak_telp, updated_at,
    riwayat_medis_penyakit ( penyakit )
  ),
  penempatan (
    kamar_id, transportasi_id, status, catatan_admin, diverifikasi_pada,
    verifikator:diverifikasi_oleh ( nama ),
    kamar ( nama, hotel ( nama ) ),
    transportasi ( nama, rute, berangkat )
  ),
  kontingen:kontingen_id ( email, nama )
`

type Nested<T> = T | T[] | null | undefined

function one<T>(value: Nested<T>): T | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function requireUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Sesi berakhir. Silakan masuk lagi.")
  return data.user
}

async function profilIdByEmail(email: string) {
  const { data, error } = await supabase.from("profil").select("id, email").eq("email", email.trim().toLowerCase()).maybeSingle()
  throwIf(error)
  return data
}

async function signedUrlMap(bucket: string, paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))]
  const map = new Map<string, string>()
  if (!unique.length) return map
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(unique, 60 * 60)
  throwIf(error)
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) map.set(item.path, item.signedUrl)
  }
  return map
}

async function uploadDataUrl(bucket: string, path: string, dataUrl: string, contentType: string) {
  const blob = await (await fetch(dataUrl)).blob()
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType })
  throwIf(error)
}

function fileInfo(name: string, type: string, size: number, url: string): FileInfo {
  return { name, type, size, data: url }
}

function verifierName(value: unknown) {
  return one(value as Nested<{ nama?: string }>)?.nama || undefined
}

function mapPeserta(row: Record<string, unknown>, fotoUrl: string): Registration {
  const lombaRows = (row.peserta_lomba as { lomba: string; status: string; catatan_admin: string | null; diverifikasi_pada?: string | null; verifikator?: unknown }[] | null) ?? []
  const medis = one(row.riwayat_medis as Nested<Record<string, unknown>>)
  const penyakit = ((medis?.riwayat_medis_penyakit as { penyakit: string }[] | undefined) ?? []).map((item) => item.penyakit)
  const tempat = one(row.penempatan as Nested<Record<string, unknown>>)
  const kamar = one(tempat?.kamar as Nested<Record<string, unknown>>)
  const hotel = one(kamar?.hotel as Nested<{ nama?: string }>)
  const transport = one(tempat?.transportasi as Nested<Record<string, unknown>>)
  const lombaStatus: Record<string, { status: string; note?: string; by?: string; at?: string }> = {}
  for (const item of lombaRows) {
    lombaStatus[item.lomba] = {
      status: item.status,
      note: item.catatan_admin ?? undefined,
      by: verifierName(item.verifikator),
      at: item.diverifikasi_pada ?? undefined,
    }
  }
  const kontingen = one(row.kontingen as Nested<{ email?: string; nama?: string }>)
  return {
    id: String(row.id),
    regNo: String(row.nomor_registrasi),
    email: kontingen?.email ?? "",
    nama: String(row.nama),
    jenis: String(row.jenis),
    tempat: String(row.tempat_lahir),
    tanggal: String(row.tanggal_lahir),
    gender: String(row.jenis_kelamin),
    gereja: String(row.gereja),
    mupel: String(row.mupel),
    foto: fotoUrl,
    fotoPath: (row.foto_path as string | null) ?? undefined,
    wa: String(row.whatsapp),
    ukuran: String(row.ukuran_kaos),
    lomba: lombaRows.map((item) => item.lomba),
    lombaStatus,
    medical: medis
      ? {
          golongan: String(medis.golongan_darah),
          alergi: String(medis.alergi ?? ""),
          penyakit,
          penyakitLain: String(medis.penyakit_lain ?? ""),
          obat: String(medis.obat ?? ""),
          riwayatRawat: String(medis.riwayat_rawat ?? ""),
          kondisiKhusus: String(medis.kondisi_khusus ?? ""),
          kontakNama: String(medis.kontak_nama),
          kontakHubungan: String(medis.kontak_hubungan),
          kontakTelp: String(medis.kontak_telp),
          updatedAt: String(medis.updated_at ?? ""),
        }
      : undefined,
    akomodasi: tempat
      ? {
          roomId: (tempat.kamar_id as string | null) ?? undefined,
          transportId: (tempat.transportasi_id as string | null) ?? undefined,
          status: String(tempat.status),
          note: (tempat.catatan_admin as string | null) ?? undefined,
          by: verifierName(tempat.verifikator),
          at: (tempat.diverifikasi_pada as string | null) ?? undefined,
          hotelName: hotel?.nama,
          roomName: kamar?.nama as string | undefined,
          transportName: transport?.nama as string | undefined,
          route: transport?.rute as string | undefined,
          depart: transport?.berangkat as string | undefined,
        }
      : undefined,
    adminNote: (row.catatan_admin as string | null) ?? undefined,
    verifiedBy: verifierName(row.verifikator),
    verifiedAt: (row.diverifikasi_pada as string | null) ?? undefined,
    status: String(row.status),
    createdAt: String(row.created_at),
  }
}

async function fetchPeserta(kontingenId?: string): Promise<Registration[]> {
  let query = supabase.from("peserta").select(PESERTA_SELECT).order("created_at")
  if (kontingenId) query = query.eq("kontingen_id", kontingenId)
  const { data, error } = await query
  throwIf(error)
  const rows = (data ?? []) as unknown as Record<string, unknown>[]
  const photos = await signedUrlMap("foto-peserta", rows.map((row) => String(row.foto_path ?? "")))
  return rows.map((row) => mapPeserta(row, photos.get(String(row.foto_path ?? "")) ?? ""))
}

export async function listRegs(email: string): Promise<Registration[]> {
  const owner = await profilIdByEmail(email)
  if (!owner) return []
  return fetchPeserta(owner.id)
}

export async function listAllPeserta(): Promise<Registration[]> {
  return fetchPeserta()
}

async function syncLomba(pesertaId: string, lomba: string[]) {
  const { data, error } = await supabase.from("peserta_lomba").select("lomba").eq("peserta_id", pesertaId)
  throwIf(error)
  const have = new Set((data ?? []).map((row) => row.lomba as string))
  const next = new Set(lomba)
  const remove = [...have].filter((item) => !next.has(item))
  const add = [...next].filter((item) => !have.has(item))
  if (remove.length) {
    const { error: deleteError } = await supabase.from("peserta_lomba").delete().eq("peserta_id", pesertaId).in("lomba", remove)
    throwIf(deleteError)
  }
  if (add.length) {
    const { error: insertError } = await supabase.from("peserta_lomba").insert(add.map((item) => ({ peserta_id: pesertaId, lomba: item })))
    throwIf(insertError)
  }
}

export async function savePeserta(reg: Registration) {
  const user = await requireUser()
  const editing = Boolean(reg.regNo && reg.id && isUuid(reg.id))
  const row = {
    nama: reg.nama,
    jenis: reg.jenis,
    tempat_lahir: reg.tempat,
    tanggal_lahir: reg.tanggal,
    jenis_kelamin: reg.gender,
    gereja: reg.gereja,
    mupel: reg.mupel,
    whatsapp: reg.wa,
    ukuran_kaos: reg.ukuran,
  }

  let pesertaId = reg.id
  if (editing) {
    let fotoPath = reg.fotoPath ?? null
    if (reg.foto.startsWith("data:")) {
      fotoPath = `${user.id}/${pesertaId}.jpg`
      await uploadDataUrl("foto-peserta", fotoPath, reg.foto, "image/jpeg")
    }
    const { data, error } = await supabase
      .from("peserta")
      .update({ ...row, foto_path: fotoPath })
      .eq("id", pesertaId)
      .eq("kontingen_id", user.id)
      .select("id")
      .maybeSingle()
    throwIf(error)
    if (!data) throw new Error("Peserta tidak ditemukan.")
    await syncLomba(data.id, reg.lomba)
    return
  }

  const { data, error } = await supabase
    .from("peserta")
    .insert({ ...row, kontingen_id: user.id, foto_path: null })
    .select("id")
    .single()
  throwIf(error)
  if (!data) throw new Error("Peserta gagal disimpan.")
  pesertaId = data.id

  if (reg.foto.startsWith("data:")) {
    const fotoPath = `${user.id}/${pesertaId}.jpg`
    await uploadDataUrl("foto-peserta", fotoPath, reg.foto, "image/jpeg")
    const { error: fotoError } = await supabase.from("peserta").update({ foto_path: fotoPath }).eq("id", pesertaId)
    throwIf(fotoError)
  }

  if (reg.lomba.length) {
    const { error: lombaError } = await supabase
      .from("peserta_lomba")
      .insert(reg.lomba.map((lomba) => ({ peserta_id: pesertaId, lomba })))
    throwIf(lombaError)
  }
}

export async function deletePeserta(id: string) {
  const user = await requireUser()
  const { error } = await supabase.from("peserta").delete().eq("id", id).eq("kontingen_id", user.id)
  throwIf(error)
}

export async function deletePesertaAdmin(id: string) {
  const { data, error } = await supabase.from("peserta").delete().eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Peserta tidak terhapus. Jalankan skrip supabase/admin-akses.sql di SQL Editor.")
}

export async function setPesertaStatus(id: string, status: string, note?: string) {
  const { data, error } = await supabase.from("peserta").update({ status, catatan_admin: note || null }).eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Status peserta tidak tersimpan. Periksa peran akun.")
}

export async function setLombaStatus(pesertaId: string, lomba: string, status: string, note?: string) {
  const { data, error } = await supabase
    .from("peserta_lomba")
    .update({ status, catatan_admin: note || null })
    .eq("peserta_id", pesertaId)
    .eq("lomba", lomba)
    .select("peserta_id")
    .maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Status lomba tidak tersimpan.")
}

export async function addPesertaLomba(pesertaId: string, lomba: string) {
  const { error } = await supabase.from("peserta_lomba").insert({ peserta_id: pesertaId, lomba })
  throwIf(error)
}

export async function removePesertaLomba(pesertaId: string, lomba: string) {
  const { error } = await supabase.from("peserta_lomba").delete().eq("peserta_id", pesertaId).eq("lomba", lomba)
  throwIf(error)
}

export async function saveMedical(pesertaId: string, medical: Medical) {
  const { error } = await supabase.from("riwayat_medis").upsert({
    peserta_id: pesertaId,
    golongan_darah: medical.golongan,
    alergi: medical.alergi,
    penyakit_lain: medical.penyakitLain,
    obat: medical.obat,
    riwayat_rawat: medical.riwayatRawat,
    kondisi_khusus: medical.kondisiKhusus,
    kontak_nama: medical.kontakNama,
    kontak_hubungan: medical.kontakHubungan,
    kontak_telp: medical.kontakTelp,
  })
  throwIf(error)
  const { error: deleteError } = await supabase.from("riwayat_medis_penyakit").delete().eq("peserta_id", pesertaId)
  throwIf(deleteError)
  if (!medical.penyakit.length) return
  const { error: insertError } = await supabase.from("riwayat_medis_penyakit").insert(
    medical.penyakit.map((penyakit) => ({ peserta_id: pesertaId, penyakit })),
  )
  throwIf(insertError)
}

const TRAVEL_SELECT = `
  id, nama, dari_datang, lokasi_datang, tanggal_datang, jam_datang,
  lokasi_berangkat, ke_berangkat, tanggal_berangkat, jam_berangkat, created_at,
  grup_perjalanan_anggota ( peserta_id )
`

function mapTravelGroup(row: {
  id: string
  nama: string
  dari_datang?: string | null
  lokasi_datang: string
  tanggal_datang: string
  jam_datang: string
  lokasi_berangkat: string
  ke_berangkat?: string | null
  tanggal_berangkat: string
  jam_berangkat: string
  created_at: string
  grup_perjalanan_anggota?: { peserta_id: string }[] | null
}, ownerEmail: string): TravelGroup {
  return {
    id: row.id,
    owner: ownerEmail,
    createdAt: row.created_at,
    nama: row.nama,
    regIds: (row.grup_perjalanan_anggota ?? []).map((member) => member.peserta_id),
    dariDatang: row.dari_datang ?? "",
    lokasiDatang: row.lokasi_datang,
    tglDatang: row.tanggal_datang,
    jamDatang: String(row.jam_datang ?? "").slice(0, 5),
    lokasiBerangkat: row.lokasi_berangkat,
    keBerangkat: row.ke_berangkat ?? "",
    tglBerangkat: row.tanggal_berangkat,
    jamBerangkat: String(row.jam_berangkat).slice(0, 5),
  }
}

export async function listTravelGroups(email: string): Promise<TravelGroup[]> {
  const owner = await profilIdByEmail(email)
  if (!owner) return []
  const { data, error } = await supabase.from("grup_perjalanan").select(TRAVEL_SELECT).eq("kontingen_id", owner.id).order("created_at")
  throwIf(error)
  return (data ?? []).map((row) => mapTravelGroup(row, owner.email))
}

export async function saveTravelGroup(group: TravelGroup) {
  const user = await requireUser()
  const id = isUuid(group.id) ? group.id : newUuid()
  const { error } = await supabase.from("grup_perjalanan").upsert({
    id,
    kontingen_id: user.id,
    nama: group.nama,
    dari_datang: group.dariDatang,
    lokasi_datang: group.lokasiDatang,
    tanggal_datang: group.tglDatang,
    jam_datang: group.jamDatang,
    lokasi_berangkat: group.lokasiBerangkat,
    ke_berangkat: group.keBerangkat,
    tanggal_berangkat: group.tglBerangkat,
    jam_berangkat: group.jamBerangkat,
  })
  throwIf(error)
  if (group.regIds.length) {
    const { error: movedError } = await supabase.from("grup_perjalanan_anggota").delete().in("peserta_id", group.regIds)
    throwIf(movedError)
  }
  const { error: clearError } = await supabase.from("grup_perjalanan_anggota").delete().eq("grup_id", id)
  throwIf(clearError)
  if (!group.regIds.length) return
  const { error: memberError } = await supabase.from("grup_perjalanan_anggota").insert(
    group.regIds.map((pesertaId) => ({ grup_id: id, peserta_id: pesertaId })),
  )
  throwIf(memberError)
}

type TripRow = {
  id: string
  nama: string
  dari_datang: string | null
  lokasi_datang: string
  tanggal_datang: string
  jam_datang: string
  lokasi_berangkat: string
  ke_berangkat: string | null
  tanggal_berangkat: string
  jam_berangkat: string
  status_datang: TripStatus
  status_berangkat: TripStatus
  kendaraan_datang_id: string | null
  kendaraan_berangkat_id: string | null
  kontingen: { nama?: string } | { nama?: string }[] | null
  kendaraan_datang: { nama?: string; jenis?: string } | { nama?: string; jenis?: string }[] | null
  kendaraan_berangkat: { nama?: string; jenis?: string } | { nama?: string; jenis?: string }[] | null
  grup_perjalanan_anggota: { peserta: { id: string; nama: string; mupel: string } | { id: string; nama: string; mupel: string }[] | null }[] | null
}

function vehicleLabel(value: TripRow["kendaraan_datang"]) {
  const row = one(value)
  if (!row?.nama) return ""
  return row.jenis ? `${row.nama} (${row.jenis})` : row.nama
}

function tripPassengers(row: TripRow): Trip["passengers"] {
  return (row.grup_perjalanan_anggota ?? []).flatMap((member) => {
    const peserta = one(member.peserta)
    return peserta ? [{ id: peserta.id, nama: peserta.nama, mupel: peserta.mupel }] : []
  })
}

export async function listTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("grup_perjalanan")
    .select(`
      id, nama, dari_datang, lokasi_datang, tanggal_datang, jam_datang,
      lokasi_berangkat, ke_berangkat, tanggal_berangkat, jam_berangkat,
      status_datang, status_berangkat, kendaraan_datang_id, kendaraan_berangkat_id,
      kontingen:kontingen_id ( nama ),
      kendaraan_datang:kendaraan_datang_id ( nama, jenis ),
      kendaraan_berangkat:kendaraan_berangkat_id ( nama, jenis ),
      grup_perjalanan_anggota ( peserta:peserta_id ( id, nama, mupel ) )
    `)
    .order("tanggal_datang")
  throwIf(error)
  const trips: Trip[] = []
  for (const raw of (data ?? []) as TripRow[]) {
    const organizer = one(raw.kontingen)?.nama || "Kontingen"
    const passengers = tripPassengers(raw)
    trips.push({
      id: `${raw.id}:datang`,
      groupId: raw.id,
      nama: raw.nama,
      jenis: "Kedatangan",
      leg: "datang",
      dari: raw.dari_datang ?? "",
      ke: raw.lokasi_datang,
      tanggal: raw.tanggal_datang,
      jam: String(raw.jam_datang ?? "").slice(0, 5),
      organizer,
      kendaraanId: raw.kendaraan_datang_id ?? "",
      kendaraan: vehicleLabel(raw.kendaraan_datang),
      status: raw.status_datang ?? "Belum",
      passengers,
    })
    trips.push({
      id: `${raw.id}:berangkat`,
      groupId: raw.id,
      nama: raw.nama,
      jenis: "Kepulangan",
      leg: "berangkat",
      dari: raw.lokasi_berangkat,
      ke: raw.ke_berangkat ?? "",
      tanggal: raw.tanggal_berangkat,
      jam: String(raw.jam_berangkat ?? "").slice(0, 5),
      organizer,
      kendaraanId: raw.kendaraan_berangkat_id ?? "",
      kendaraan: vehicleLabel(raw.kendaraan_berangkat),
      status: raw.status_berangkat ?? "Belum",
      passengers,
    })
  }
  return trips.sort((a, b) => a.tanggal.localeCompare(b.tanggal) || a.jam.localeCompare(b.jam) || a.nama.localeCompare(b.nama))
}

export async function updateTrip(groupId: string, leg: Trip["leg"], patch: { lokasi?: string; kendaraanId?: string; status?: TripStatus }) {
  const row: Record<string, string | null> = {}
  if (leg === "datang") {
    if (patch.lokasi !== undefined) row.dari_datang = patch.lokasi
    if (patch.kendaraanId !== undefined) row.kendaraan_datang_id = patch.kendaraanId || null
    if (patch.status) row.status_datang = patch.status
  } else {
    if (patch.lokasi !== undefined) row.ke_berangkat = patch.lokasi
    if (patch.kendaraanId !== undefined) row.kendaraan_berangkat_id = patch.kendaraanId || null
    if (patch.status) row.status_berangkat = patch.status
  }
  const { data, error } = await supabase.from("grup_perjalanan").update(row).eq("id", groupId).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Jadwal trip tidak tersimpan. Jalankan skrip supabase/jadwal-trip.sql di SQL Editor.")
}

export async function deleteTravelGroup(id: string) {
  const user = await requireUser()
  const { error } = await supabase.from("grup_perjalanan").delete().eq("id", id).eq("kontingen_id", user.id)
  throwIf(error)
}

async function fetchPayments(kontingenId?: string): Promise<Payment[]> {
  let query = supabase
    .from("pembayaran")
    .select("id, jumlah, tanggal, catatan, berkas_path, berkas_nama, berkas_mime, berkas_ukuran, status, catatan_admin, diverifikasi_pada, created_at, pembayaran_peserta ( peserta_id ), kontingen:kontingen_id ( email ), verifikator:diverifikasi_oleh ( nama )")
    .order("created_at")
  if (kontingenId) query = query.eq("kontingen_id", kontingenId)
  const { data, error } = await query
  throwIf(error)
  const rows = data ?? []
  const urls = await signedUrlMap("bukti-pembayaran", rows.map((row) => row.berkas_path))
  return rows.map((row) => {
    const kontingen = one(row.kontingen as Nested<{ email?: string }>)
    return {
      id: row.id,
      owner: kontingen?.email ?? "",
      file: fileInfo(row.berkas_nama, row.berkas_mime, row.berkas_ukuran, urls.get(row.berkas_path) ?? ""),
      amount: Number(row.jumlah),
      date: row.tanggal,
      note: row.catatan,
      regIds: (row.pembayaran_peserta ?? []).map((item: { peserta_id: string }) => item.peserta_id),
      createdAt: row.created_at,
      status: row.status,
      adminNote: row.catatan_admin ?? undefined,
      verifiedBy: verifierName(row.verifikator),
      verifiedAt: row.diverifikasi_pada ?? undefined,
    }
  })
}

export async function listPayments(email: string): Promise<Payment[]> {
  const owner = await profilIdByEmail(email)
  if (!owner) return []
  return fetchPayments(owner.id)
}

export async function listAllPayments(): Promise<Payment[]> {
  return fetchPayments()
}

export async function setPaymentStatus(id: string, status: string, note?: string) {
  const { data, error } = await supabase.from("pembayaran").update({ status, catatan_admin: note || null }).eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Status pembayaran tidak tersimpan.")
}

export async function savePayment(file: FileInfo, amount: number, date: string, note: string) {
  const user = await requireUser()
  const id = newUuid()
  const extension = file.type === "application/pdf" ? "pdf" : "jpg"
  const path = `${user.id}/${id}.${extension}`
  await uploadDataUrl("bukti-pembayaran", path, file.data, file.type)
  const { error } = await supabase.from("pembayaran").insert({
    id,
    kontingen_id: user.id,
    jumlah: amount,
    tanggal: date,
    catatan: note,
    berkas_path: path,
    berkas_nama: file.name,
    berkas_mime: file.type,
    berkas_ukuran: file.size,
  })
  throwIf(error)
}

export async function setPaymentParticipants(paymentId: string, regIds: string[]) {
  const { data, error } = await supabase.from("pembayaran_peserta").select("peserta_id").eq("pembayaran_id", paymentId)
  throwIf(error)
  const have = new Set((data ?? []).map((row) => row.peserta_id as string))
  const next = new Set(regIds)
  const remove = [...have].filter((id) => !next.has(id))
  const add = [...next].filter((id) => !have.has(id))
  if (remove.length) {
    const { error: deleteError } = await supabase.from("pembayaran_peserta").delete().eq("pembayaran_id", paymentId).in("peserta_id", remove)
    throwIf(deleteError)
  }
  if (add.length) {
    const { error: insertError } = await supabase.from("pembayaran_peserta").insert(add.map((pesertaId) => ({ pembayaran_id: paymentId, peserta_id: pesertaId })))
    throwIf(insertError)
  }
}

export async function deletePayment(id: string) {
  const user = await requireUser()
  const { error } = await supabase.from("pembayaran").delete().eq("id", id).eq("kontingen_id", user.id)
  throwIf(error)
}

async function fetchSurat(kontingenId?: string): Promise<Doc[]> {
  let query = supabase
    .from("surat_tugas")
    .select("id, catatan, berkas_path, berkas_nama, berkas_mime, berkas_ukuran, status, catatan_admin, diverifikasi_pada, created_at, kontingen:kontingen_id ( email ), verifikator:diverifikasi_oleh ( nama )")
    .order("created_at")
  if (kontingenId) query = query.eq("kontingen_id", kontingenId)
  const { data, error } = await query
  throwIf(error)
  const rows = data ?? []
  const urls = await signedUrlMap("surat-tugas", rows.map((row) => row.berkas_path))
  return rows.map((row) => {
    const kontingen = one(row.kontingen as Nested<{ email?: string }>)
    return {
      id: row.id,
      owner: kontingen?.email ?? "",
      file: fileInfo(row.berkas_nama, row.berkas_mime, row.berkas_ukuran, urls.get(row.berkas_path) ?? ""),
      note: row.catatan,
      createdAt: row.created_at,
      status: row.status,
      adminNote: row.catatan_admin ?? undefined,
      verifiedBy: verifierName(row.verifikator),
      verifiedAt: row.diverifikasi_pada ?? undefined,
    }
  })
}

export async function listSurat(email: string): Promise<Doc[]> {
  const owner = await profilIdByEmail(email)
  if (!owner) return []
  return fetchSurat(owner.id)
}

export async function listAllSurat(): Promise<Doc[]> {
  return fetchSurat()
}

export async function setSuratStatus(id: string, status: string, note?: string) {
  const { data, error } = await supabase.from("surat_tugas").update({ status, catatan_admin: note || null }).eq("id", id).select("id").maybeSingle()
  throwIf(error)
  if (!data) throw new Error("Status surat tugas tidak tersimpan.")
}

export async function saveSurat(file: FileInfo, note: string) {
  const user = await requireUser()
  const id = newUuid()
  const extension = file.type === "application/pdf" ? "pdf" : "jpg"
  const path = `${user.id}/${id}.${extension}`
  await uploadDataUrl("surat-tugas", path, file.data, file.type)
  const { error } = await supabase.from("surat_tugas").insert({
    id,
    kontingen_id: user.id,
    catatan: note,
    berkas_path: path,
    berkas_nama: file.name,
    berkas_mime: file.type,
    berkas_ukuran: file.size,
  })
  throwIf(error)
}

export async function deleteSurat(id: string) {
  const user = await requireUser()
  const { error } = await supabase.from("surat_tugas").delete().eq("id", id).eq("kontingen_id", user.id)
  throwIf(error)
}

export async function listProfiles(): Promise<StoredUser[]> {
  const { data, error } = await supabase.from("profil").select("id, nama, email, peran").order("nama")
  throwIf(error)
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.nama,
    email: row.email,
    role: row.peran as Role,
    salt: "",
    hash: "",
  }))
}

export async function listHotels(): Promise<Hotel[]> {
  const { data, error } = await supabase.from("hotel").select("id, nama, alamat").order("nama")
  throwIf(error)
  return (data ?? []).map((row) => ({ id: row.id, name: row.nama, address: row.alamat }))
}

export async function saveHotel(name: string, address: string) {
  const { error } = await supabase.from("hotel").insert({ nama: name, alamat: address })
  throwIf(error)
}

export async function deleteHotel(id: string) {
  const { error } = await supabase.from("hotel").delete().eq("id", id)
  throwIf(error)
}

export async function listRooms(): Promise<Room[]> {
  const { data, error } = await supabase.from("kamar").select("id, hotel_id, nama, tipe, kapasitas").order("nama")
  throwIf(error)
  return (data ?? []).map((row) => ({ id: row.id, hotelId: row.hotel_id, name: row.nama, type: row.tipe, capacity: row.kapasitas }))
}

export async function saveRoom(hotelId: string, name: string, type: string, capacity: number) {
  const { error } = await supabase.from("kamar").insert({ hotel_id: hotelId, nama: name, tipe: type, kapasitas: capacity })
  throwIf(error)
}

export async function deleteRoom(id: string) {
  const { error } = await supabase.from("kamar").delete().eq("id", id)
  throwIf(error)
}

export async function listTransport(): Promise<Trans[]> {
  const { data, error } = await supabase.from("transportasi").select("id, jenis, nama, rute, berangkat, kapasitas").order("berangkat")
  throwIf(error)
  return (data ?? []).map((row) => ({ id: row.id, kind: row.jenis, name: row.nama, route: row.rute, depart: row.berangkat, capacity: row.kapasitas }))
}

export async function saveTransport(kind: string, name: string, route: string, depart: string, capacity: number) {
  const { error } = await supabase.from("transportasi").insert({
    jenis: kind,
    nama: name,
    rute: route,
    berangkat: new Date(depart).toISOString(),
    kapasitas: capacity,
  })
  throwIf(error)
}

export async function deleteTransport(id: string) {
  const { error } = await supabase.from("transportasi").delete().eq("id", id)
  throwIf(error)
}

export async function savePenempatan(pesertaId: string, acc: { roomId?: string; transportId?: string; status: string; note?: string }) {
  if (!acc.roomId && !acc.transportId) {
    const { error } = await supabase.from("penempatan").delete().eq("peserta_id", pesertaId)
    throwIf(error)
    return
  }
  const { error } = await supabase.from("penempatan").upsert({
    peserta_id: pesertaId,
    kamar_id: acc.roomId ?? null,
    transportasi_id: acc.transportId ?? null,
    status: acc.status,
    catatan_admin: acc.note ?? null,
  })
  throwIf(error)
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
    } else if (mode === "signup") {
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
        await auth.resetPassword(email)
        setMode("login")
        setPassword("")
        setConfirm("")
        setInfo("Tautan pengaturan ulang kata sandi sudah dikirim. Periksa email Anda.")
      }
    } catch (err) {
      setFormError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const title = { login: "MASUK", signup: "BUAT AKUN", reset: "ATUR ULANG SANDI" }[mode]
  const cta = { login: "MASUK", signup: "DAFTAR AKUN", reset: "KIRIM TAUTAN" }[mode]

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
          <img src={logo} alt="Logo TKS 2027 PKB GPIB" style={{ width: 120, height: 120, objectFit: "contain", marginBottom: 32 }} />
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

            {mode !== "reset" && <Field label="Kata Sandi" htmlFor="auth-pass" error={errors.password} hint={mode === "signup" ? "Minimal 8 karakter, kombinasi huruf dan angka." : undefined}>
              <div style={{ position: "relative" }}>
                <input id="auth-pass" type={show ? "text" : "password"} className="tks-input" style={{ ...inputStyle, ...err("password"), paddingRight: 72 }} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 64, background: "none", border: "none", color: O, fontFamily: BC, fontWeight: 700, fontSize: 12, letterSpacing: 1.5, cursor: "pointer" }}>
                  {show ? "HIDE" : "SHOW"}
                </button>
              </div>
            </Field>}

            {mode === "signup" && (
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
  const [regs, setRegs] = useState<Registration[]>([])
  const [pays, setPays] = useState<Payment[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [groups, setGroups] = useState<TravelGroup[]>([])
  const [tab, setTab] = useState<Tab>("peserta")
  const [editing, setEditing] = useState<Registration | "new" | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  const refresh = useCallback(async () => {
    try {
      const [nextRegs, nextPays, nextDocs, nextGroups] = await Promise.all([
        listRegs(user.email),
        listPayments(user.email),
        listSurat(user.email),
        listTravelGroups(user.email),
      ])
      setRegs(nextRegs)
      setPays(nextPays)
      setDocs(nextDocs)
      setGroups(nextGroups)
      setLoadError("")
    } catch (error) {
      setLoadError((error as Error).message)
    }
  }, [user.email])

  useEffect(() => {
    let live = true
    setLoading(true)
    void refresh().finally(() => {
      if (live) setLoading(false)
    })
    return () => {
      live = false
    }
  }, [refresh])

  if (editing) {
    return (
      <PageShell>
        <RegistrationForm
          user={user}
          existing={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            void refresh()
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
        {loadError && <Banner tone="error">{loadError}</Banner>}
        {loading && <p style={{ fontFamily: BB, fontSize: 14, color: "#aaa" }}>Memuat data kontingen…</p>}

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
              void deletePeserta(id)
                .then(() => {
                  setConfirmId(null)
                  return refresh()
                })
                .catch((error: Error) => setLoadError(error.message))
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

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setFormError("")
    if (!validate()) return
    setBusy(true)
    const record: Registration = {
      ...existing,
      id: existing?.id ?? "",
      regNo: existing?.regNo ?? "",
      email: user.email,
      nama: form.nama.trim(),
      jenis: form.jenis,
      tempat: form.tempat.trim(),
      tanggal: form.tanggal,
      gender: form.gender,
      gereja: form.gereja.trim(),
      mupel: form.mupel.trim(),
      foto,
      fotoPath: existing?.fotoPath,
      wa: form.wa.replace(/[\s-]/g, ""),
      ukuran: form.ukuran,
      lomba,
      lombaStatus: Object.fromEntries(
        Object.entries(existing?.lombaStatus ?? {}).filter(([k]) => lomba.includes(k)),
      ),
      status: existing?.status ?? ST.wait,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    }
    try {
      await savePeserta(record)
      onSaved()
    } catch (error) {
      setFormError((error as Error).message)
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
              const lockedLomba = isLocked(existing?.lombaStatus?.[l]?.status)
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={on}
                  disabled={lockedLomba}
                  title={verdictText(existing?.lombaStatus?.[l]?.status, existing?.lombaStatus?.[l]?.by, existing?.lombaStatus?.[l]?.at) || undefined}
                  className="tks-seg"
                  onClick={() => { if (!lockedLomba) setLomba((cur) => (on ? cur.filter((x) => x !== l) : [...cur, l])) }}
                  style={{ fontFamily: BC, fontWeight: 700, fontSize: 14, letterSpacing: 2, padding: "11px 18px", cursor: lockedLomba ? "not-allowed" : "pointer", opacity: lockedLomba ? 0.55 : 1, background: on ? O : "#262626", color: on ? "#fff" : "#ccc", border: `1px solid ${on ? O : "#555"}`, transition: "background .2s, color .2s" }}
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

export function Chip({ children, tone = "orange", title }: { children: React.ReactNode; tone?: "orange" | "green" | "gray" | "red"; title?: string }) {
  const c = { orange: ["rgba(255,109,0,0.25)", "#fff"], green: ["rgba(102,187,106,0.22)", "#a5d6a7"], gray: ["#3a3a3a", "#bbb"], red: ["rgba(239,83,80,0.22)", "#ef9a9a"] }[tone]
  return (
    <span title={title || undefined} style={{ fontFamily: BC, fontWeight: 800, fontSize: 11, letterSpacing: 2, color: c[1], background: c[0], padding: "3px 10px", whiteSpace: "nowrap" }}>
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
                {verdictText(r.status, r.verifiedBy, r.verifiedAt) && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ddd", marginTop: 8 }}>{verdictText(r.status, r.verifiedBy, r.verifiedAt)}</div>
                )}
                {r.status === ST.no && r.adminNote && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", marginTop: 8 }}>Alasan penolakan: {r.adminNote}</div>
                )}
                {isLocked(r.status) && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ffb74d", marginTop: 8 }}>{LOCK_MSG}</div>
                )}
                {r.lomba?.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {r.lomba.map((l) => {
                      const ls = r.lombaStatus?.[l]
                      return (
                        <Chip key={l} tone={ls ? statusTone(ls.status) : "gray"} title={verdictText(ls?.status, ls?.by, ls?.at)}>
                          {l.toUpperCase()}{ls?.status === ST.ok ? " ✓" : ls?.status === ST.no ? " ✕" : ""}
                        </Chip>
                      )
                    })}
                  </div>
                )}
                {r.akomodasi && (r.akomodasi.roomId || r.akomodasi.transportId) && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ccc", marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusChip s={r.akomodasi.status} />
                    {r.akomodasi.roomName && <span>Hotel: <strong style={{ color: "#fff" }}>{r.akomodasi.hotelName} · {r.akomodasi.roomName}</strong></span>}
                    {r.akomodasi.transportName && <span>Transport: <strong style={{ color: "#fff" }}>{r.akomodasi.transportName} ({r.akomodasi.route}, {r.akomodasi.depart ? new Date(r.akomodasi.depart).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : ""})</strong></span>}
                    {verdictText(r.akomodasi.status, r.akomodasi.by, r.akomodasi.at) && <span>{verdictText(r.akomodasi.status, r.akomodasi.by, r.akomodasi.at)}</span>}
                  </div>
                )}
                {!isLocked(r.status) && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
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
                </div>}
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

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e: Record<string, string> = {}
    const nominal = Number(amount.replace(/\D/g, ""))
    if (!file) e.file = "Unggah bukti pembayaran."
    if (!nominal) e.amount = "Masukkan nominal pembayaran."
    if (!date) e.date = "Tanggal transfer wajib diisi."
    setErrors(e)
    if (Object.keys(e).length) return
    try {
      await savePayment(file!, nominal, date, note.trim())
      setFile(null)
      setAmount("")
      setNote("")
      setMsg("Bukti pembayaran tersimpan. Pilih peserta yang dicakup pembayaran ini pada kartu di bawah.")
      await refresh()
    } catch (error) {
      setErrors({ file: (error as Error).message })
    }
  }

  const toggle = (p: Payment, regId: string) => {
    if (isLocked(p.status)) return
    const regIds = p.regIds.includes(regId) ? p.regIds.filter((x) => x !== regId) : [...p.regIds, regId]
    void setPaymentParticipants(p.id, regIds).then(() => refresh()).catch((error: Error) => setErrors({ file: error.message }))
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
                {verdictText(p.status, p.verifiedBy, p.verifiedAt) && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ddd", margin: "4px 0" }}>{verdictText(p.status, p.verifiedBy, p.verifiedAt)}</div>
                )}
                {p.status === ST.no && p.adminNote && (
                  <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a", margin: "4px 0" }}>Alasan penolakan: {p.adminNote}</div>
                )}
                {isLocked(p.status) && <div style={{ fontFamily: BB, fontSize: 13, color: "#ffb74d", margin: "4px 0" }}>{LOCK_MSG}</div>}
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
                          <input type="checkbox" checked={on} disabled={!!other || isLocked(p.status)} onChange={() => toggle(p, r.id)} style={{ accentColor: O, width: 16, height: 16, flexShrink: 0 }} />
                          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.nama}</span>
                          {other && <span style={{ marginLeft: "auto", fontSize: 11, whiteSpace: "nowrap" }}>Bukti #{other}</span>}
                        </label>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 16 }}>
                  {!isLocked(p.status) && <DeleteControl id={p.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus bukti ini?" onDelete={() => { void deletePayment(p.id).then(() => { setConfirmId(null); return refresh() }) }} />}
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

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!file) return setError("Unggah berkas surat tugas.")
    try {
      await saveSurat(file, note.trim())
      setFile(null)
      setNote("")
      setError("")
      await refresh()
    } catch (error) {
      setError((error as Error).message)
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
                {verdictText(d.status, d.verifiedBy, d.verifiedAt) && <div style={{ fontFamily: BB, fontSize: 13, color: "#ddd" }}>{verdictText(d.status, d.verifiedBy, d.verifiedAt)}</div>}
                {d.status === ST.no && d.adminNote && <div style={{ fontFamily: BB, fontSize: 13, color: "#ef9a9a" }}>Alasan penolakan: {d.adminNote}</div>}
                {isLocked(d.status) && <div style={{ fontFamily: BB, fontSize: 13, color: "#ffb74d" }}>{LOCK_MSG}</div>}
                <FileLink f={d.file} /> <span style={{ fontFamily: BB, fontSize: 13, color: "#888" }}>({fmtSize(d.file.size)})</span>
                {d.note && <div style={{ fontFamily: BB, fontSize: 14, color: "#ccc", marginTop: 2 }}>{d.note}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {!isLocked(d.status) && <DeleteControl id={d.id} confirmId={confirmId} setConfirmId={setConfirmId} label="Hapus surat ini?" onDelete={() => { void deleteSurat(d.id).then(() => { setConfirmId(null); return refresh() }).catch((error: Error) => setError(error.message)) }} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
