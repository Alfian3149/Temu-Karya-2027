-- Foto galeri publik. Bucket ini boleh dibaca siapa saja.
-- Hanya superuser yang dapat mengunggah, mengganti, dan menghapus.
-- Jalankan sekali di SQL Editor Supabase.

insert into storage.buckets (id, name, public)
values ('galeri-situs', 'galeri-situs', true)
on conflict (id) do update set public = true;

drop policy if exists galeri_baca on storage.objects;
create policy galeri_baca on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'galeri-situs');

drop policy if exists galeri_tulis on storage.objects;
create policy galeri_tulis on storage.objects
  for insert to authenticated
  with check (bucket_id = 'galeri-situs' and public.punya_peran('superuser'));

drop policy if exists galeri_ubah on storage.objects;
create policy galeri_ubah on storage.objects
  for update to authenticated
  using (bucket_id = 'galeri-situs' and public.punya_peran('superuser'))
  with check (bucket_id = 'galeri-situs' and public.punya_peran('superuser'));

drop policy if exists galeri_hapus on storage.objects;
create policy galeri_hapus on storage.objects
  for delete to authenticated
  using (bucket_id = 'galeri-situs' and public.punya_peran('superuser'));
