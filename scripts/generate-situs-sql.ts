import { readFileSync, writeFileSync } from "node:fs"
import { DEFAULT_MENUS, KONTEN } from "../src/siteDefaults.ts"

function q(value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

const parents = DEFAULT_MENUS.filter((menu) => !menu.indukId)
const children = DEFAULT_MENUS.filter((menu) => menu.indukId)

function menuValues(rows: typeof DEFAULT_MENUS) {
  return rows.map((menu) => `  (${q(menu.id)}, ${menu.indukId ? q(menu.indukId) : "null"}, ${q(menu.label)}, ${q(menu.jangkar)}, ${menu.urutan}, true)`).join(",\n")
}

function kontenValues() {
  return KONTEN.map((item) => {
    const json = JSON.stringify(item.isi)
    if (json.includes("$json$")) throw new Error(`JSON delimiter bentrok pada ${item.kunci}`)
    return `  (${q(item.kunci)}, ${item.menuId ? q(item.menuId) : "null"}, ${q(item.judul)}, $json$${json}$json$::jsonb, true)`
  }).join(",\n")
}

const body = `-- Menu dan konten halaman publik.
-- Hanya superuser yang boleh mengubah. Pengunjung membaca menu aktif dan konten terbit.
-- Menjalankan ulang skrip ini tidak menimpa perubahan yang sudah disimpan.

create table if not exists public.situs_menu (
  id text primary key,
  induk_id text references public.situs_menu (id) on delete cascade,
  label text not null check (char_length(btrim(label)) > 0),
  jangkar text not null check (char_length(btrim(jangkar)) > 0),
  urutan integer not null,
  aktif boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.situs_konten (
  kunci text primary key,
  menu_id text references public.situs_menu (id) on delete set null,
  judul text not null check (char_length(btrim(judul)) > 0),
  isi jsonb not null check (jsonb_typeof(isi) = 'object'),
  terbit boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists situs_menu_updated_at on public.situs_menu;
create trigger situs_menu_updated_at
  before update on public.situs_menu
  for each row execute function public.set_updated_at();

drop trigger if exists situs_konten_updated_at on public.situs_konten;
create trigger situs_konten_updated_at
  before update on public.situs_konten
  for each row execute function public.set_updated_at();

comment on table public.situs_menu is 'Menu dan submenu situs publik. Hanya superuser yang mengubah.';
comment on table public.situs_konten is 'Teks halaman publik. Pengunjung hanya membaca baris yang diterbitkan.';

alter table public.situs_menu enable row level security;
alter table public.situs_konten enable row level security;

drop policy if exists situs_menu_baca on public.situs_menu;
create policy situs_menu_baca on public.situs_menu
  for select to anon, authenticated
  using (aktif or public.punya_peran('superuser'));

drop policy if exists situs_menu_tambah on public.situs_menu;
create policy situs_menu_tambah on public.situs_menu
  for insert to authenticated
  with check (public.punya_peran('superuser'));

drop policy if exists situs_menu_ubah on public.situs_menu;
create policy situs_menu_ubah on public.situs_menu
  for update to authenticated
  using (public.punya_peran('superuser'))
  with check (public.punya_peran('superuser'));

drop policy if exists situs_konten_baca on public.situs_konten;
create policy situs_konten_baca on public.situs_konten
  for select to anon, authenticated
  using (terbit or public.punya_peran('superuser'));

drop policy if exists situs_konten_tambah on public.situs_konten;
create policy situs_konten_tambah on public.situs_konten
  for insert to authenticated
  with check (public.punya_peran('superuser'));

drop policy if exists situs_konten_ubah on public.situs_konten;
create policy situs_konten_ubah on public.situs_konten
  for update to authenticated
  using (public.punya_peran('superuser'))
  with check (public.punya_peran('superuser'));

grant select on public.situs_menu to anon, authenticated;
grant insert, update on public.situs_menu to authenticated;
grant select on public.situs_konten to anon, authenticated;
grant insert, update on public.situs_konten to authenticated;

insert into public.situs_menu (id, induk_id, label, jangkar, urutan, aktif) values
${menuValues(parents)}
on conflict (id) do nothing;

insert into public.situs_menu (id, induk_id, label, jangkar, urutan, aktif) values
${menuValues(children)}
on conflict (id) do nothing;

insert into public.situs_konten (kunci, menu_id, judul, isi, terbit) values
${kontenValues()}
on conflict (kunci) do nothing;
`

writeFileSync("supabase/situs-konten.sql", `begin;\n\n${body}\ncommit;\n`)

const schemaPath = "supabase/schema.sql"
const schema = readFileSync(schemaPath, "utf8")
if (!schema.includes("public.situs_menu")) {
  const marker = "\ncommit;\n"
  const at = schema.lastIndexOf(marker)
  if (at < 0) throw new Error("commit schema tidak ketemu")
  writeFileSync(schemaPath, `${schema.slice(0, at)}\n-- -----------------------------------------------------------------------------\n-- Situs publik\n-- -----------------------------------------------------------------------------\n\n${body}${schema.slice(at)}`)
}

console.log("sql ready")
