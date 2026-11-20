import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY wajib diisi.")
}

export type AuthCallbackType = "signup" | "email" | "invite" | "magiclink" | "recovery" | "email_change"

const AUTH_CALLBACK_TYPES = new Set<string>(["signup", "email", "invite", "magiclink", "recovery", "email_change"])

function readAuthCallback(): AuthCallbackType | null {
  if (typeof window === "undefined") return null
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  const query = new URLSearchParams(window.location.search)
  const type = hash.get("type") ?? query.get("type")
  const hasCredential = hash.has("access_token") || hash.has("refresh_token") || query.has("code")
  if (!hasCredential || !type || !AUTH_CALLBACK_TYPES.has(type)) return null
  return type as AuthCallbackType
}

// Dibaca sebelum createClient, karena klien menghapus token dari URL saat inisialisasi.
export const authCallback = readAuthCallback()

const authOptions = {
  flowType: "implicit" as const,
  detectSessionInUrl: true,
  persistSession: true,
  autoRefreshToken: true,
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions })

export function authRedirectTo() {
  const url = new URL(window.location.href)
  url.hash = ""
  url.search = ""
  return url.origin + url.pathname
}

export function authTanpaSesi() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
