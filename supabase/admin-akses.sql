-- Jalankan sekali di SQL Editor jika database sudah dibuat dari schema.sql versi sebelumnya.
-- Membuka baca data peserta untuk seluruh staf, serta hapus peserta dan akun oleh admin.

drop policy if exists profil_hapus_admin on public.profil;
create policy profil_hapus_admin on public.profil
  for delete to authenticated
  using (public.punya_peran('superuser') and id <> auth.uid());

drop policy if exists peserta_hapus_admin on public.peserta;
create policy peserta_hapus_admin on public.peserta
  for delete to authenticated
  using (public.punya_peran('superuser', 'reg_admin'));

drop policy if exists peserta_baca_staf on public.peserta;
create policy peserta_baca_staf on public.peserta
  for select to authenticated
  using (public.is_staff());

drop policy if exists lomba_baca_staf on public.peserta_lomba;
create policy lomba_baca_staf on public.peserta_lomba
  for select to authenticated
  using (public.is_staff());

drop policy if exists hotel_baca_staf on public.hotel;
create policy hotel_baca_staf on public.hotel
  for select to authenticated
  using (public.is_staff());

drop policy if exists kamar_baca_staf on public.kamar;
create policy kamar_baca_staf on public.kamar
  for select to authenticated
  using (public.is_staff());

drop policy if exists transport_baca_staf on public.transportasi;
create policy transport_baca_staf on public.transportasi
  for select to authenticated
  using (public.is_staff());

drop policy if exists tempat_baca_staf on public.penempatan;
create policy tempat_baca_staf on public.penempatan
  for select to authenticated
  using (public.is_staff());
