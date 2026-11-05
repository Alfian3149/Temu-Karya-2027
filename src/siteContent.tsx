import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import {
  DEFAULT_MENUS,
  DEFAULT_RUNDOWN,
  KONTEN,
  cloneIsi,
  isMissingSiteTable,
  kontenDef,
  projectNav,
  readKonten,
  type AkomodasiIsi,
  type BackgroundIsi,
  type ContactIsi,
  type DownloadsIsi,
  type FaqIsi,
  type FooterIsi,
  type GalleryIsi,
  type HeroIsi,
  type NavItem,
  type RegistrationIsi,
  type RundownIsi,
  type SectionHead,
  type SiteMenu,
  type SpeakersIsi,
  type SubItem,
  type ThemeIsi,
  type VenueIsi,
  type WelcomeIsi,
} from "@/siteDefaults"

export type { NavItem, SubItem, SiteMenu }
export { DEFAULT_MENUS, DEFAULT_RUNDOWN, KONTEN, cloneIsi, kontenDef }

type MenuDb = {
  id: string
  induk_id: string | null
  label: string
  jangkar: string
  urutan: number
  aktif: boolean
}

type KontenDb = {
  kunci: string
  menu_id: string | null
  judul: string
  isi: unknown
  terbit: boolean
}

export type KontenRow = {
  kunci: string
  menuId: string | null
  judul: string
  isi: unknown
  terbit: boolean
}

const MENU_COLUMNS = "id, induk_id, label, jangkar, urutan, aktif"
const KONTEN_COLUMNS = "kunci, menu_id, judul, isi, terbit"

function mapMenu(row: MenuDb): SiteMenu {
  return {
    id: row.id,
    indukId: row.induk_id,
    label: row.label,
    jangkar: row.jangkar,
    urutan: row.urutan,
    aktif: row.aktif,
  }
}

function mapKonten(row: KontenDb): KontenRow {
  return { kunci: row.kunci, menuId: row.menu_id, judul: row.judul, isi: row.isi, terbit: row.terbit }
}

function fail(error: { message: string } | null, fallback: string) {
  if (error) throw new Error(error.message || fallback)
}

export function missingTableMessage() {
  return "Tabel situs belum ada. Jalankan skrip supabase/situs-konten.sql di SQL Editor Supabase, lalu muat ulang tab ini."
}

export async function loadAdminSite() {
  const [menus, konten] = await Promise.all([
    supabase.from("situs_menu").select(MENU_COLUMNS).order("urutan"),
    supabase.from("situs_konten").select(KONTEN_COLUMNS),
  ])
  if (isMissingSiteTable(menus.error) || isMissingSiteTable(konten.error)) throw new Error(missingTableMessage())
  fail(menus.error, "Gagal memuat menu.")
  fail(konten.error, "Gagal memuat konten.")
  return {
    menus: ((menus.data ?? []) as MenuDb[]).map(mapMenu),
    konten: ((konten.data ?? []) as KontenDb[]).map(mapKonten),
  }
}

export async function saveMenu(menu: SiteMenu) {
  const label = menu.label.trim()
  if (!label) throw new Error("Label menu tidak boleh kosong.")
  const { data, error } = await supabase.from("situs_menu").upsert({
    id: menu.id,
    induk_id: menu.indukId,
    label,
    jangkar: menu.jangkar,
    urutan: menu.urutan,
    aktif: menu.aktif,
  }, { onConflict: "id" }).select("id").single()
  if (isMissingSiteTable(error)) throw new Error(missingTableMessage())
  fail(error, "Menu tidak tersimpan.")
  if (!data) throw new Error("Menu tidak tersimpan. Hanya superuser yang dapat mengubah situs.")
}

export async function saveKonten(kunci: string, isi: object, terbit: boolean) {
  const item = kontenDef(kunci)
  const { data, error } = await supabase.from("situs_konten").upsert({
    kunci,
    menu_id: item.menuId,
    judul: item.judul,
    isi,
    terbit,
  }, { onConflict: "kunci" }).select("kunci").single()
  if (isMissingSiteTable(error)) throw new Error(missingTableMessage())
  fail(error, "Konten tidak tersimpan.")
  if (!data) throw new Error("Konten tidak tersimpan. Hanya superuser yang dapat mengubah situs.")
}

type PublicState = {
  fromDb: boolean
  menus: SiteMenu[]
  blocks: Record<string, unknown>
  published: Set<string>
}

const EMPTY: PublicState = { fromDb: false, menus: [], blocks: {}, published: new Set() }

async function loadPublic(): Promise<PublicState> {
  const [menus, konten] = await Promise.all([
    supabase.from("situs_menu").select(MENU_COLUMNS).eq("aktif", true).order("urutan"),
    supabase.from("situs_konten").select(KONTEN_COLUMNS).eq("terbit", true),
  ])
  if (isMissingSiteTable(menus.error) || isMissingSiteTable(konten.error)) return EMPTY
  if (menus.error || konten.error) return EMPTY
  const blocks: Record<string, unknown> = {}
  const published = new Set<string>()
  for (const row of (konten.data ?? []) as KontenDb[]) {
    blocks[row.kunci] = row.isi
    published.add(row.kunci)
  }
  return { fromDb: true, menus: ((menus.data ?? []) as MenuDb[]).map(mapMenu), blocks, published }
}

export type SiteValue = {
  fromDb: boolean
  nav: NavItem[]
  show: (id: string) => boolean
  children: (parentId: string) => SubItem[]
  hero: HeroIsi | null
  aboutHead: SectionHead
  background: BackgroundIsi | null
  theme: ThemeIsi | null
  welcome: WelcomeIsi | null
  scheduleHead: SectionHead
  rundown: RundownIsi | null
  speakers: SpeakersIsi | null
  venue: VenueIsi | null
  infoHead: SectionHead
  accommodation: AkomodasiIsi | null
  faq: FaqIsi | null
  downloads: DownloadsIsi | null
  registration: RegistrationIsi | null
  gallery: GalleryIsi | null
  contact: ContactIsi | null
  footer: FooterIsi
  reload: () => void
}

const SiteContext = createContext<SiteValue | null>(null)

function block<T>(state: PublicState, kunci: string): T | null {
  return readKonten<T>(state.fromDb, state.blocks, kunci, cloneIsi(kontenDef(kunci).isi) as T)
}

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PublicState>(EMPTY)
  const reload = useCallback(() => {
    void loadPublic().then((next) => {
      if (next.fromDb) setState(next)
    })
  }, [])
  useEffect(() => { reload() }, [reload])
  const value = useMemo<SiteValue>(() => {
    const view = projectNav(state.fromDb, state.menus, state.published)
    const head = (kunci: string) => block<SectionHead>(state, kunci) ?? (cloneIsi(kontenDef(kunci).isi) as SectionHead)
    return {
      fromDb: state.fromDb,
      nav: view.nav,
      show: view.show,
      children: view.children,
      hero: block<HeroIsi>(state, "home"),
      aboutHead: head("about"),
      background: block<BackgroundIsi>(state, "about.background"),
      theme: block<ThemeIsi>(state, "about.theme"),
      welcome: block<WelcomeIsi>(state, "about.welcome"),
      scheduleHead: head("schedule"),
      rundown: block<RundownIsi>(state, "schedule.rundown"),
      speakers: block<SpeakersIsi>(state, "schedule.speakers"),
      venue: block<VenueIsi>(state, "schedule.venue"),
      infoHead: head("information"),
      accommodation: block<AkomodasiIsi>(state, "information.accommodation"),
      faq: block<FaqIsi>(state, "information.faq"),
      downloads: block<DownloadsIsi>(state, "information.downloads"),
      registration: block<RegistrationIsi>(state, "registration"),
      gallery: block<GalleryIsi>(state, "gallery"),
      contact: block<ContactIsi>(state, "contact"),
      footer: block<FooterIsi>(state, "footer") ?? (cloneIsi(kontenDef("footer").isi) as FooterIsi),
      reload,
    }
  }, [state, reload])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const value = useContext(SiteContext)
  if (!value) throw new Error("useSite harus dipakai di dalam SiteProvider.")
  return value
}
